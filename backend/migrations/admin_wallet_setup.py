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

def setup_admin_wallet_system():
    """Setup admin wallet system tables and columns"""
    print("Starting admin wallet system setup...\n")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Add wallet_balance column to admins table
        print("Adding wallet_balance column to admins table...")
        cursor.execute("""
            ALTER TABLE admins 
            ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(20, 8) DEFAULT 0.00
        """)
        print("Wallet balance column added to admins table")
        
        # 2. Create admin_wallet_transactions table
        print("\nCreating admin_wallet_transactions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_wallet_transactions (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER NOT NULL,
                admin_username VARCHAR(100) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                user_id INTEGER,
                username VARCHAR(50),
                wallet_type VARCHAR(50),
                action VARCHAR(20),
                amount DECIMAL(20, 8) NOT NULL,
                reason TEXT,
                balance_before DECIMAL(20, 8),
                balance_after DECIMAL(20, 8),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                ist_created_at TIMESTAMP
            )
        """)
        print("Admin wallet transactions table created")
        
        # 3. Create indexes
        print("\nCreating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_admin_wallet_trans_admin_id 
            ON admin_wallet_transactions(admin_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_admin_wallet_trans_user_id 
            ON admin_wallet_transactions(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_admin_wallet_trans_type 
            ON admin_wallet_transactions(transaction_type)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_admin_wallet_trans_created_at 
            ON admin_wallet_transactions(created_at)
        """)
        print("Indexes created")
        
        # 4. Create IST timestamp trigger for admin_wallet_transactions
        print("\nCreating IST timestamp trigger...")
        cursor.execute("""
            DROP TRIGGER IF EXISTS admin_wallet_trans_ist_trigger 
            ON admin_wallet_transactions;
            
            CREATE TRIGGER admin_wallet_trans_ist_trigger
            BEFORE INSERT ON admin_wallet_transactions
            FOR EACH ROW
            EXECUTE FUNCTION set_ist_timestamp();
        """)
        print("IST timestamp trigger created")
        
        # 5. Add last_login tracking columns to users table
        print("\nAdding login tracking columns to users table...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_login_1 TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS last_login_2 TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS last_login_3 TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS ist_last_login_1 TIMESTAMP,
            ADD COLUMN IF NOT EXISTS ist_last_login_2 TIMESTAMP,
            ADD COLUMN IF NOT EXISTS ist_last_login_3 TIMESTAMP
        """)
        print("Login tracking columns added to users table")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\nAdmin wallet system setup complete!")
        print("\nSummary:")
        print("- Added wallet_balance column to admins table")
        print("- Created admin_wallet_transactions table")
        print("- Created indexes for performance")
        print("- Created IST timestamp trigger")
        print("- Added last login tracking columns to users table")
        print("\nNext steps:")
        print("1. Update backend API endpoints for admin wallet operations")
        print("2. Update frontend to show admin wallet and manage balances")
        
    except Exception as e:
        print(f"\nError: {e}")
        return False

if __name__ == '__main__':
    setup_admin_wallet_system()
