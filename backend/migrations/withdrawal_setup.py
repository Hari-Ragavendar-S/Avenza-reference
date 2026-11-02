import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from datetime import datetime
import pytz

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'avenzaweb'),
    'user': os.getenv('DB_USER', 'avenzauser'),
    'password': os.getenv('DB_PASSWORD', '123456')
}

def get_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def get_ist_time():
    """Get current time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

def setup_withdrawal_system():
    """Setup withdrawal system tables and settings"""
    print("🚀 Starting withdrawal system setup...\n")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Add withdrawal settings to admin_settings
        print("Adding withdrawal settings...")
        
        # Withdrawal wallet address (same as deposit for now)
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET updated_at = EXCLUDED.updated_at
        """, (
            'withdrawal_wallet_address',
            '0x7bccC6F8c7Dbb202967D44741bAaCD87362c741A',
            'USDT BEP20 withdrawal sender wallet address',
            get_ist_time()
        ))
        
        # Withdrawal fee percentage (default 5%)
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        """, (
            'withdrawal_fee_percentage',
            '5',
            'Withdrawal fee percentage (default 5%)',
            get_ist_time()
        ))
        
        # Minimum withdrawal amount
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        """, (
            'withdrawal_min_amount',
            '1',
            'Minimum withdrawal amount in USD',
            get_ist_time()
        ))
        
        # Maximum withdrawal amount
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        """, (
            'withdrawal_max_amount',
            '1000',
            'Maximum withdrawal amount per transaction in USD',
            get_ist_time()
        ))
        
        # Daily withdrawal limit (transactions)
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        """, (
            'withdrawal_daily_limit_count',
            '10',
            'Maximum withdrawals per user per day',
            get_ist_time()
        ))
        
        # Withdrawal enabled/disabled
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        """, (
            'withdrawal_enabled',
            'true',
            'Enable or disable withdrawals',
            get_ist_time()
        ))
        
        print("✅ Withdrawal settings added")
        
        # 2. Create withdrawals table
        print("\nCreating withdrawals table...")
        
        # First check if table exists and drop if needed
        cursor.execute("""
            DROP TABLE IF EXISTS withdrawal_logs CASCADE;
            DROP TABLE IF EXISTS withdrawals CASCADE;
        """)
        
        cursor.execute("""
            CREATE TABLE withdrawals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                username VARCHAR(50) NOT NULL,
                amount DECIMAL(20, 8) NOT NULL,
                fee DECIMAL(20, 8) NOT NULL,
                fee_percentage DECIMAL(5, 2) NOT NULL,
                net_amount DECIMAL(20, 8) NOT NULL,
                currency VARCHAR(20) DEFAULT 'USDT',
                network VARCHAR(50) DEFAULT 'BEP20',
                to_address VARCHAR(255) NOT NULL,
                from_address VARCHAR(255),
                transaction_hash VARCHAR(255) UNIQUE,
                status VARCHAR(50) DEFAULT 'pending',
                wallet_type VARCHAR(50) DEFAULT 'avenza',
                error_message TEXT,
                admin_note TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,
                ist_created_at TIMESTAMP,
                ist_processed_at TIMESTAMP,
                ist_completed_at TIMESTAMP
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_username ON withdrawals(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_tx_hash ON withdrawals(transaction_hash)")
        
        print("✅ Withdrawals table created")
        
        # 3. Create withdrawal_logs table
        print("\nCreating withdrawal_logs table...")
        cursor.execute("""
            CREATE TABLE withdrawal_logs (
                id SERIAL PRIMARY KEY,
                withdrawal_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                action VARCHAR(100) NOT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50),
                message TEXT,
                ip_address VARCHAR(50),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ist_created_at TIMESTAMP
            )
        """)
        print("✅ Withdrawal logs table created")
        
        # 4. Create trigger for IST timestamps on withdrawals
        print("\nCreating IST timestamp trigger for withdrawals...")
        cursor.execute("""
            DROP TRIGGER IF EXISTS withdrawals_ist_trigger ON withdrawals;
            CREATE TRIGGER withdrawals_ist_trigger
            BEFORE INSERT ON withdrawals
            FOR EACH ROW
            EXECUTE FUNCTION set_ist_timestamp();
        """)
        
        # Create trigger for withdrawal_logs
        cursor.execute("""
            DROP TRIGGER IF EXISTS withdrawal_logs_ist_trigger ON withdrawal_logs;
            CREATE TRIGGER withdrawal_logs_ist_trigger
            BEFORE INSERT ON withdrawal_logs
            FOR EACH ROW
            EXECUTE FUNCTION set_ist_timestamp();
        """)
        
        print("✅ IST timestamp triggers created")
        
        # 5. Update transactions table to handle withdrawals (skip if column exists)
        print("\nUpdating transactions table...")
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='transactions' AND column_name='withdrawal_id'
                ) THEN
                    ALTER TABLE transactions ADD COLUMN withdrawal_id INTEGER;
                END IF;
            END $$;
        """)
        print("✅ Transactions table updated")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n✨ Withdrawal system setup complete!")
        print("\n📋 Summary:")
        print("   - Added withdrawal settings (fee: 5%, min: $1, max: $1000, daily: 10)")
        print("   - Created withdrawals table with IST timestamps")
        print("   - Created withdrawal_logs table for tracking")
        print("   - Set withdrawal wallet: 0x7bccC6F8c7Dbb202967D44741bAaCD87362c741A")
        print("   - Status: Withdrawals ENABLED")
        
        print("\n⚠️  IMPORTANT: Set WITHDRAWAL_WALLET_PRIVATE_KEY in .env file!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == '__main__':
    setup_withdrawal_system()
