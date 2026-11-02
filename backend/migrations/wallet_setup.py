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

def setup_wallet_system():
    """Setup wallet system tables and columns"""
    print("🚀 Starting wallet system setup...\n")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Add three wallet columns to users table
        print("Adding wallet columns to users table...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS avenza_balance DECIMAL(20, 8) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS income_balance DECIMAL(20, 8) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS gaming_balance DECIMAL(20, 8) DEFAULT 0
        """)
        print("✅ Wallet columns added to users table")
        
        # 2. Create admin_settings table for receiver address
        print("\nCreating admin_settings table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                description TEXT,
                updated_by INTEGER REFERENCES admins(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Admin settings table created")
        
        # 3. Insert default USDT BEP20 receiver address
        print("\nSetting default USDT BEP20 receiver address...")
        cursor.execute("""
            INSERT INTO admin_settings (setting_key, setting_value, description, updated_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (setting_key) DO NOTHING
        """, (
            'usdt_bep20_receiver_address',
            '0x7bccC6F8c7Dbb202967D44741bAaCD87362c741A',
            'USDT BEP20 receiver address for deposits',
            get_ist_time()
        ))
        print("✅ Default receiver address set")
        
        # 4. Update deposits table with IST timestamp and additional fields
        print("\nUpdating deposits table...")
        cursor.execute("""
            DROP TABLE IF EXISTS deposits CASCADE
        """)
        cursor.execute("""
            CREATE TABLE deposits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                username VARCHAR(50) NOT NULL,
                amount DECIMAL(20, 8) NOT NULL,
                currency VARCHAR(20) DEFAULT 'USDT',
                network VARCHAR(50) DEFAULT 'BEP20',
                transaction_hash VARCHAR(255) UNIQUE NOT NULL,
                from_address VARCHAR(255) NOT NULL,
                to_address VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                wallet_type VARCHAR(50) DEFAULT 'avenza',
                block_number BIGINT,
                confirmations INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMPTZ,
                ist_created_at TIMESTAMP,
                ist_confirmed_at TIMESTAMP
            )
        """)
        
        # Create indexes for deposits
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_username ON deposits(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON deposits(transaction_hash)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at)")
        print("✅ Deposits table updated with IST timestamps")
        
        # 5. Create deposit_logs table for tracking
        print("\nCreating deposit_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deposit_logs (
                id SERIAL PRIMARY KEY,
                deposit_id INTEGER REFERENCES deposits(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(100) NOT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50),
                message TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ist_created_at TIMESTAMP
            )
        """)
        print("✅ Deposit logs table created")
        
        # 6. Update transactions table with IST
        print("\nUpdating transactions table...")
        cursor.execute("""
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS ist_created_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(50) DEFAULT 'avenza'
        """)
        print("✅ Transactions table updated")
        
        # 7. Create function to auto-update ist timestamps
        print("\nCreating IST timestamp trigger function...")
        cursor.execute("""
            CREATE OR REPLACE FUNCTION set_ist_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.ist_created_at = (NOW() AT TIME ZONE 'Asia/Kolkata');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        # Create trigger for deposits
        cursor.execute("""
            DROP TRIGGER IF EXISTS deposits_ist_trigger ON deposits;
            CREATE TRIGGER deposits_ist_trigger
            BEFORE INSERT ON deposits
            FOR EACH ROW
            EXECUTE FUNCTION set_ist_timestamp();
        """)
        
        # Create trigger for deposit_logs
        cursor.execute("""
            DROP TRIGGER IF EXISTS deposit_logs_ist_trigger ON deposit_logs;
            CREATE TRIGGER deposit_logs_ist_trigger
            BEFORE INSERT ON deposit_logs
            FOR EACH ROW
            EXECUTE FUNCTION set_ist_timestamp();
        """)
        
        print("✅ IST timestamp triggers created")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n✨ Wallet system setup complete!")
        print("\n📋 Summary:")
        print("   - Added 3 wallet columns to users (avenza_balance, income_balance, gaming_balance)")
        print("   - Created admin_settings table")
        print("   - Set default USDT BEP20 address: 0x7bccC6F8c7Dbb202967D44741bAaCD87362c741A")
        print("   - Updated deposits table with IST timestamps")
        print("   - Created deposit_logs table")
        print("   - Added IST timestamp auto-triggers")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == '__main__':
    setup_wallet_system()
