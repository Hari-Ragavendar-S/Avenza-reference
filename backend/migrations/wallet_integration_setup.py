#!/usr/bin/env python3
"""
Web3 Wallet Integration Migration
Adds wallet authentication support to users table
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        cursor_factory=RealDictCursor
    )

def run_migration():
    """Add Web3 wallet columns to users table"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Starting Web3 Wallet Integration Migration...")
    print("=" * 60)
    
    try:
        # Add wallet columns to users table
        print("\n1. Adding wallet columns to users table...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42),
            ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20),
            ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMP;
        """)
        print("   - Columns added successfully")
        
        # Create index for fast wallet lookup
        print("\n2. Creating wallet address index...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
            ON users(wallet_address);
        """)
        print("   - Index created successfully")
        
        # Create wallet_login_nonces table for security
        print("\n3. Creating wallet_login_nonces table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wallet_login_nonces (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(42) NOT NULL,
                nonce VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE
            );
        """)
        print("   - Table created successfully")
        
        # Create index for nonce lookup
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_wallet_nonces_address 
            ON wallet_login_nonces(wallet_address);
        """)
        print("   - Nonce index created")
        
        # Create wallet_connection_logs table for audit
        print("\n4. Creating wallet_connection_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wallet_connection_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                wallet_address VARCHAR(42) NOT NULL,
                wallet_type VARCHAR(20),
                action VARCHAR(20) NOT NULL, -- connect, disconnect, login
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("   - Logs table created successfully")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("Migration completed successfully!")
        print("\nNew columns added to users table:")
        print("  - wallet_address: Stores user's Web3 wallet address")
        print("  - wallet_type: Type of wallet (metamask, trust, safePal, etc.)")
        print("  - wallet_connected_at: Timestamp when wallet was connected")
        print("\nNew tables created:")
        print("  - wallet_login_nonces: For secure wallet authentication")
        print("  - wallet_connection_logs: Audit trail for wallet actions")
        
    except Exception as e:
        conn.rollback()
        print(f"\nError during migration: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
