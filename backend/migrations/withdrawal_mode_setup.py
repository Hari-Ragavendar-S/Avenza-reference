"""
Withdrawal Mode System Setup Migration
Adds system_settings table and updates withdrawals table for manual approval
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        cursor_factory=RealDictCursor
    )

def run_migration():
    """Run the migration"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting withdrawal mode system migration...")
        
        # 1. Create system_settings table
        print("\n📋 Creating system_settings table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                updated_by INTEGER REFERENCES admins(id)
            )
        """)
        print("✅ system_settings table created")
        
        # 2. Insert default withdrawal mode setting
        print("\n📋 Setting default withdrawal mode to 'automatic'...")
        cursor.execute("""
            INSERT INTO system_settings (setting_key, setting_value, description)
            VALUES ('withdrawal_mode', 'automatic', 'Withdrawal processing mode: automatic or manual')
            ON CONFLICT (setting_key) DO NOTHING
        """)
        print("✅ Default withdrawal mode set to automatic")
        
        # 3. Check if withdrawals table exists and add new columns
        print("\n📋 Checking withdrawals table...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'withdrawals'
            )
        """)
        
        table_exists = cursor.fetchone()['exists']
        
        if table_exists:
            print("✅ withdrawals table exists, adding new columns...")
            
            # Add withdrawal_mode column
            cursor.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='withdrawals' AND column_name='withdrawal_mode'
                    ) THEN
                        ALTER TABLE withdrawals ADD COLUMN withdrawal_mode VARCHAR(20) DEFAULT 'automatic';
                    END IF;
                END $$;
            """)
            print("✅ Added withdrawal_mode column")
            
            # Add destination_address column
            cursor.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='withdrawals' AND column_name='destination_address'
                    ) THEN
                        ALTER TABLE withdrawals ADD COLUMN destination_address VARCHAR(255);
                    END IF;
                END $$;
            """)
            print("✅ Added destination_address column")
            
            # Add destination_wallet_type column
            cursor.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='withdrawals' AND column_name='destination_wallet_type'
                    ) THEN
                        ALTER TABLE withdrawals ADD COLUMN destination_wallet_type VARCHAR(50);
                    END IF;
                END $$;
            """)
            print("✅ Added destination_wallet_type column")
            
            # Add admin_note column
            cursor.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='withdrawals' AND column_name='admin_note'
                    ) THEN
                        ALTER TABLE withdrawals ADD COLUMN admin_note TEXT;
                    END IF;
                END $$;
            """)
            print("✅ Added admin_note column")
            
            # Add processed_by column
            cursor.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='withdrawals' AND column_name='processed_by'
                    ) THEN
                        ALTER TABLE withdrawals ADD COLUMN processed_by INTEGER REFERENCES admins(id);
                    END IF;
                END $$;
            """)
            print("✅ Added processed_by column")
            
            # Add processed_at column
            cursor.execute("""
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='withdrawals' AND column_name='processed_at'
                    ) THEN
                        ALTER TABLE withdrawals ADD COLUMN processed_at TIMESTAMP;
                    END IF;
                END $$;
            """)
            print("✅ Added processed_at column")
            
        else:
            print("⚠️  withdrawals table does not exist, skipping column additions")
        
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ Migration completed successfully!")
        print("="*60)
        print("\nSummary:")
        print("- Created system_settings table")
        print("- Set default withdrawal_mode to 'automatic'")
        print("- Added columns to withdrawals table:")
        print("  • withdrawal_mode")
        print("  • destination_address")
        print("  • destination_wallet_type")
        print("  • admin_note")
        print("  • processed_by")
        print("  • processed_at")
        print("\n")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
