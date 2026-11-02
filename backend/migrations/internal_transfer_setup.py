#!/usr/bin/env python3
"""
Internal Transfer (P2P) System Setup
Creates tables and triggers for peer-to-peer transfers
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    database=os.getenv('DB_NAME', 'avenzaweb'),
    user=os.getenv('DB_USER', 'avenzauser'),
    password=os.getenv('DB_PASSWORD', '123456'),
    cursor_factory=RealDictCursor
)

def setup_internal_transfers():
    """Setup internal transfer system"""
    cursor = conn.cursor()
    
    print("🚀 Starting internal transfer system setup...")
    
    # 1. Add wallet_pin and profile_photo_url to users table
    print("Adding wallet_pin and profile_photo_url columns to users table...")
    try:
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS wallet_pin VARCHAR(4),
            ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
        """)
        print("✅ User columns added")
    except Exception as e:
        print(f"⚠️  User columns may already exist: {e}")
    
    # 2. Create internal_transfers table
    print("Creating internal_transfers table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS internal_transfers (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL REFERENCES users(id),
            sender_username VARCHAR(100) NOT NULL,
            receiver_id INTEGER NOT NULL REFERENCES users(id),
            receiver_username VARCHAR(100) NOT NULL,
            amount DECIMAL(20, 8) NOT NULL,
            currency VARCHAR(10) DEFAULT 'USD',
            status VARCHAR(20) DEFAULT 'completed',
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ist_created_at TIMESTAMP,
            CONSTRAINT check_different_users CHECK (sender_id != receiver_id),
            CONSTRAINT check_positive_amount CHECK (amount > 0)
        );
    """)
    print("✅ Internal transfers table created")
    
    # 3. Create indexes
    print("Creating indexes...")
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_internal_transfers_sender ON internal_transfers(sender_id);
        CREATE INDEX IF NOT EXISTS idx_internal_transfers_receiver ON internal_transfers(receiver_id);
        CREATE INDEX IF NOT EXISTS idx_internal_transfers_created ON internal_transfers(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_users_wallet_pin ON users(id) WHERE wallet_pin IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
    """)
    print("✅ Indexes created")
    
    # 4. Create IST timestamp trigger
    print("Creating IST timestamp trigger...")
    cursor.execute("""
        CREATE OR REPLACE FUNCTION set_ist_timestamp_internal_transfers()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.ist_created_at := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    cursor.execute("""
        DROP TRIGGER IF EXISTS trigger_ist_timestamp_internal_transfers ON internal_transfers;
        CREATE TRIGGER trigger_ist_timestamp_internal_transfers
        BEFORE INSERT ON internal_transfers
        FOR EACH ROW
        EXECUTE FUNCTION set_ist_timestamp_internal_transfers();
    """)
    print("✅ IST timestamp trigger created")
    
    # 5. Create statistics view
    print("Creating statistics view...")
    cursor.execute("""
        CREATE OR REPLACE VIEW internal_transfer_stats AS
        SELECT 
            COUNT(*) as total_transfers,
            COUNT(DISTINCT sender_id) as unique_senders,
            COUNT(DISTINCT receiver_id) as unique_receivers,
            SUM(amount) as total_volume,
            AVG(amount) as average_transfer
        FROM internal_transfers
        WHERE status = 'completed';
    """)
    print("✅ Statistics view created")
    
    conn.commit()
    
    # 6. Show summary
    cursor.execute("SELECT COUNT(*) as count FROM internal_transfers")
    transfer_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE wallet_pin IS NOT NULL")
    pin_count = cursor.fetchone()['count']
    
    print("\n✨ Internal transfer system setup complete!")
    print(f"📋 Summary:")
    print(f"- Internal transfers table: ✅")
    print(f"- User wallet_pin column: ✅")
    print(f"- User profile_photo_url column: ✅")
    print(f"- Indexes created: ✅")
    print(f"- IST timestamp triggers: ✅")
    print(f"- Statistics view: ✅")
    print(f"\n📊 Current Data:")
    print(f"- Total internal transfers: {transfer_count}")
    print(f"- Users with PIN set: {pin_count}")
    print(f"\n⚠️  Next steps:")
    print(f"1. Upload schemas/transfer.py to VPS")
    print(f"2. Upload routes/transfer.py to VPS")
    print(f"3. Update main.py to include transfer routes")
    print(f"4. Restart backend: sudo systemctl restart avenza")
    
    cursor.close()

if __name__ == "__main__":
    try:
        setup_internal_transfers()
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()
