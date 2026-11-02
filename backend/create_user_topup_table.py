"""
Create user_topups table for public user top-up feature
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

# Database connection
conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    cursor_factory=RealDictCursor
)

cursor = conn.cursor()

print("🚀 Creating user_topups table...")
print("=" * 60)

try:
    # Create user_topups table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_topups (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            username VARCHAR(100) NOT NULL,
            user_name VARCHAR(200),
            user_email VARCHAR(200),
            sender_name VARCHAR(200),
            sender_phone VARCHAR(50),
            sender_wallet_address VARCHAR(100) NOT NULL,
            amount_received DECIMAL(20, 8) NOT NULL,
            network VARCHAR(50) NOT NULL,
            token_type VARCHAR(50) NOT NULL,
            amount_bep20_equivalent DECIMAL(20, 8) NOT NULL,
            transaction_hash VARCHAR(100) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'completed',
            topped_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("✅ user_topups table created")
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_topups_user_id ON user_topups(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_topups_username ON user_topups(username)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_topups_tx_hash ON user_topups(transaction_hash)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_topups_status ON user_topups(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_topups_topped_up_at ON user_topups(topped_up_at DESC)")
    print("✅ Indexes created")
    
    # Add total_user_topups column to public_stats if not exists
    cursor.execute("""
        ALTER TABLE public_stats 
        ADD COLUMN IF NOT EXISTS total_user_topups INTEGER DEFAULT 0
    """)
    print("✅ Added total_user_topups to public_stats")
    
    conn.commit()
    print("=" * 60)
    print("✅ USER TOP-UP TABLE CREATED SUCCESSFULLY!")
    print("=" * 60)
    
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
    raise
finally:
    cursor.close()
    conn.close()
