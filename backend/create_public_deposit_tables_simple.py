#!/usr/bin/env python3
"""
Simplified Database Migration Script: Public Deposit System
Better error handling and diagnostics
"""

import psycopg2
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get database connection from environment variables"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'avenzaweb'),
            user=os.getenv('DB_USER', 'avenzauser'),
            password=os.getenv('DB_PASSWORD', '123456'),
            connect_timeout=10
        )
        conn.autocommit = True  # Auto-commit each statement
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def execute_sql(cursor, sql, description):
    """Execute SQL with error handling"""
    try:
        print(f"\n📋 {description}...")
        cursor.execute(sql)
        print(f"   ✅ Success")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def create_tables():
    """Create all public deposit system tables"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🚀 Starting Public Deposit System Database Migration...")
    print("="*60)
    
    # 1. Public Wallet Configuration
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS public_wallet_config (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(255) NOT NULL,
            encrypted_secret_phrase TEXT NOT NULL,
            network VARCHAR(50) DEFAULT 'BSC',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """, "Creating public_wallet_config table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_wallet_config_active 
        ON public_wallet_config(is_active);
    """, "Creating index on public_wallet_config")
    
    # 2. Supported Networks
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS supported_networks (
            id SERIAL PRIMARY KEY,
            network_name VARCHAR(50) UNIQUE NOT NULL,
            chain_id INTEGER,
            rpc_url VARCHAR(500),
            usdt_contract_address VARCHAR(255),
            native_currency VARCHAR(20),
            conversion_rate_to_bep20 DECIMAL(20, 8) DEFAULT 1.0,
            is_active BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """, "Creating supported_networks table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_network_active 
        ON supported_networks(is_active);
    """, "Creating index on supported_networks")
    
    # 3. Website Public Deposits
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS public_deposits_website (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            wallet_address VARCHAR(255) NOT NULL,
            amount_received DECIMAL(20, 8) NOT NULL,
            network VARCHAR(50) NOT NULL,
            token_type VARCHAR(50) DEFAULT 'USDT',
            amount_bep20_equivalent DECIMAL(20, 8) NOT NULL,
            transaction_hash VARCHAR(255) UNIQUE,
            wallet_status VARCHAR(20) DEFAULT 'pending',
            is_distributed BOOLEAN DEFAULT FALSE,
            distributed_to_count INTEGER DEFAULT 0,
            deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
        );
    """, "Creating public_deposits_website table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_website_distributed 
        ON public_deposits_website(is_distributed);
    """, "Creating indexes on public_deposits_website")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_website_tx_hash 
        ON public_deposits_website(transaction_hash);
    """, "Creating tx_hash index on public_deposits_website")
    
    # 4. External Deposits
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS public_deposits_external (
            id SERIAL PRIMARY KEY,
            sender_address VARCHAR(255) NOT NULL,
            amount_received DECIMAL(20, 8) NOT NULL,
            network VARCHAR(50) NOT NULL,
            token_type VARCHAR(50) DEFAULT 'USDT',
            amount_bep20_equivalent DECIMAL(20, 8) NOT NULL,
            transaction_hash VARCHAR(255) UNIQUE NOT NULL,
            block_number BIGINT,
            is_distributed BOOLEAN DEFAULT FALSE,
            distributed_to_count INTEGER DEFAULT 0,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
        );
    """, "Creating public_deposits_external table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_external_distributed 
        ON public_deposits_external(is_distributed);
    """, "Creating indexes on public_deposits_external")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_external_tx_hash 
        ON public_deposits_external(transaction_hash);
    """, "Creating tx_hash index on public_deposits_external")
    
    # 5. Distribution Records
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS public_distribution_records (
            id SERIAL PRIMARY KEY,
            source_type VARCHAR(20) NOT NULL,
            source_transaction_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            user_phone VARCHAR(50),
            credited_amount DECIMAL(20, 8) NOT NULL,
            status VARCHAR(20) DEFAULT 'completed',
            credited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """, "Creating public_distribution_records table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_distribution_source 
        ON public_distribution_records(source_type, source_transaction_id);
    """, "Creating indexes on public_distribution_records")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_distribution_user 
        ON public_distribution_records(user_id);
    """, "Creating user index on public_distribution_records")
    
    # 6. Add tag column to transactions
    execute_sql(cursor, """
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='transactions' AND column_name='tag'
            ) THEN
                ALTER TABLE transactions ADD COLUMN tag VARCHAR(50);
            END IF;
        END $$;
    """, "Adding tag column to transactions table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_transactions_tag 
        ON transactions(tag);
    """, "Creating tag index on transactions")
    
    # 7. Public Stats
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS public_stats (
            id INTEGER PRIMARY KEY DEFAULT 1,
            total_deposits_count INTEGER DEFAULT 0,
            total_website_deposits INTEGER DEFAULT 0,
            total_external_deposits INTEGER DEFAULT 0,
            total_amount_received DECIMAL(20, 8) DEFAULT 0,
            total_distributed DECIMAL(20, 8) DEFAULT 0,
            total_participants INTEGER DEFAULT 0,
            last_deposit_at TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """, "Creating public_stats table")
    
    execute_sql(cursor, """
        INSERT INTO public_stats (id) VALUES (1)
        ON CONFLICT (id) DO NOTHING;
    """, "Initializing public_stats")
    
    # 8. Distribution Queue
    execute_sql(cursor, """
        CREATE TABLE IF NOT EXISTS distribution_queue (
            id SERIAL PRIMARY KEY,
            source_type VARCHAR(20) NOT NULL,
            transaction_hash VARCHAR(255) UNIQUE NOT NULL,
            amount_bep20 DECIMAL(20, 8) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0
        );
    """, "Creating distribution_queue table")
    
    execute_sql(cursor, """
        CREATE INDEX IF NOT EXISTS idx_queue_status 
        ON distribution_queue(status, created_at);
    """, "Creating indexes on distribution_queue")
    
    # 9. Insert default networks
    execute_sql(cursor, """
        INSERT INTO supported_networks (network_name, chain_id, rpc_url, usdt_contract_address, native_currency, is_active)
        VALUES 
            ('BSC', 56, 'https://bsc-dataseed.binance.org/', '0x55d398326f99059fF775485246999027B3197955', 'BNB', TRUE),
            ('ETH', 1, 'https://mainnet.infura.io/v3/YOUR_KEY', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'ETH', TRUE),
            ('POLYGON', 137, 'https://polygon-rpc.com/', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 'MATIC', TRUE)
        ON CONFLICT (network_name) DO NOTHING;
    """, "Inserting default networks")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ PUBLIC DEPOSIT SYSTEM MIGRATION COMPLETED!")
    print("="*60)
    print("\n📊 Tables Created:")
    print("   1. ✅ public_wallet_config")
    print("   2. ✅ supported_networks")
    print("   3. ✅ public_deposits_website")
    print("   4. ✅ public_deposits_external")
    print("   5. ✅ public_distribution_records")
    print("   6. ✅ public_stats")
    print("   7. ✅ distribution_queue")
    print("   8. ✅ transactions (tag column added)")
    print("\n🚀 Ready to use!")

if __name__ == "__main__":
    try:
        create_tables()
    except KeyboardInterrupt:
        print("\n\n⏹️  Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Migration failed: {e}")
        sys.exit(1)
