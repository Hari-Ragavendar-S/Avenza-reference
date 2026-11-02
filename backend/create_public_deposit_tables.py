#!/usr/bin/env python3
"""
Database Migration Script: Public Deposit System
Creates all necessary tables with proper indexes and constraints
Optimized for concurrent deposits
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get database connection from environment variables"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456')
    )

def create_tables():
    """Create all public deposit system tables"""
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting Public Deposit System Database Migration...")
        
        # STEP 0: Drop existing tables if they exist (cleanup partial migrations)
        print("\n🧹 Cleaning up any existing public deposit tables...")
        cursor.execute("""
            DROP TABLE IF EXISTS public_distribution_records CASCADE;
            DROP TABLE IF EXISTS distribution_queue CASCADE;
            DROP TABLE IF EXISTS public_deposits_external CASCADE;
            DROP TABLE IF EXISTS public_deposits_website CASCADE;
            DROP TABLE IF EXISTS public_stats CASCADE;
            DROP TABLE IF EXISTS public_wallet_config CASCADE;
            DROP TABLE IF EXISTS supported_networks CASCADE;
        """)
        conn.commit()
        print("   ✅ Cleanup completed")
        
        # 1. Public Wallet Configuration (Admin sets wallet + secret)
        print("\n📋 Creating public_wallet_config table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public_wallet_config (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(255) NOT NULL,
                encrypted_secret_phrase TEXT NOT NULL,
                network VARCHAR(50) DEFAULT 'BSC',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_wallet_config_active 
            ON public_wallet_config(is_active);
        """)
        print("   ✅ public_wallet_config created")
        
        # 2. Supported Networks Configuration
        print("\n📋 Creating supported_networks table...")
        cursor.execute("""
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
            
            CREATE INDEX IF NOT EXISTS idx_network_active 
            ON supported_networks(is_active) WHERE is_active = TRUE;
        """)
        print("   ✅ supported_networks created")
        
        # 3. Website Public Deposits (with Name & Phone)
        print("\n📋 Creating public_deposits_website table...")
        cursor.execute("""
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
                processed_at TIMESTAMP,
                CONSTRAINT positive_amount CHECK (amount_received > 0),
                CONSTRAINT positive_bep20 CHECK (amount_bep20_equivalent > 0)
            );
            
            CREATE INDEX IF NOT EXISTS idx_website_distributed 
            ON public_deposits_website(is_distributed);
            
            CREATE INDEX IF NOT EXISTS idx_website_tx_hash 
            ON public_deposits_website(transaction_hash);
            
            CREATE INDEX IF NOT EXISTS idx_website_deposited_at 
            ON public_deposits_website(deposited_at DESC);
        """)
        print("   ✅ public_deposits_website created")
        
        # 4. External Deposits (Copy-Paste Payments)
        print("\n📋 Creating public_deposits_external table...")
        cursor.execute("""
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
                processed_at TIMESTAMP,
                CONSTRAINT positive_ext_amount CHECK (amount_received > 0),
                CONSTRAINT positive_ext_bep20 CHECK (amount_bep20_equivalent > 0)
            );
            
            CREATE INDEX IF NOT EXISTS idx_external_distributed 
            ON public_deposits_external(is_distributed);
            
            CREATE INDEX IF NOT EXISTS idx_external_tx_hash 
            ON public_deposits_external(transaction_hash);
            
            CREATE INDEX IF NOT EXISTS idx_external_detected_at 
            ON public_deposits_external(detected_at DESC);
            
            CREATE INDEX IF NOT EXISTS idx_external_sender 
            ON public_deposits_external(sender_address);
        """)
        print("   ✅ public_deposits_external created")
        
        # 5. Distribution Records (Who received what)
        print("\n📋 Creating public_distribution_records table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public_distribution_records (
                id SERIAL PRIMARY KEY,
                source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('website', 'external')),
                source_transaction_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                user_phone VARCHAR(50),
                credited_amount DECIMAL(20, 8) NOT NULL,
                status VARCHAR(20) DEFAULT 'completed',
                credited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT positive_credit CHECK (credited_amount > 0)
            );
            
            CREATE INDEX IF NOT EXISTS idx_distribution_source 
            ON public_distribution_records(source_type, source_transaction_id);
            
            CREATE INDEX IF NOT EXISTS idx_distribution_user 
            ON public_distribution_records(user_id);
            
            CREATE INDEX IF NOT EXISTS idx_distribution_credited_at 
            ON public_distribution_records(credited_at DESC);
        """)
        print("   ✅ public_distribution_records created")
        
        # 6. Add 'tag' column to existing transactions table if not exists
        print("\n📋 Adding 'tag' column to transactions table...")
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='transactions' AND column_name='tag'
                ) THEN
                    ALTER TABLE transactions ADD COLUMN tag VARCHAR(50);
                    CREATE INDEX idx_transactions_tag ON transactions(tag);
                END IF;
            END $$;
        """)
        print("   ✅ 'tag' column added to transactions")
        
        # 7. Public Stats (Homepage showcase)
        print("\n📋 Creating public_stats table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS public_stats (
                id INTEGER PRIMARY KEY DEFAULT 1,
                total_deposits_count INTEGER DEFAULT 0,
                total_website_deposits INTEGER DEFAULT 0,
                total_external_deposits INTEGER DEFAULT 0,
                total_amount_received DECIMAL(20, 8) DEFAULT 0,
                total_distributed DECIMAL(20, 8) DEFAULT 0,
                total_participants INTEGER DEFAULT 0,
                last_deposit_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT single_row CHECK (id = 1)
            );
            
            INSERT INTO public_stats (id) VALUES (1)
            ON CONFLICT (id) DO NOTHING;
        """)
        print("   ✅ public_stats created")
        
        # 8. Distribution Queue (for concurrent processing)
        print("\n📋 Creating distribution_queue table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS distribution_queue (
                id SERIAL PRIMARY KEY,
                source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('website', 'external')),
                transaction_hash VARCHAR(255) UNIQUE NOT NULL,
                amount_bep20 DECIMAL(20, 8) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP,
                error_message TEXT,
                retry_count INTEGER DEFAULT 0,
                CONSTRAINT positive_queue_amount CHECK (amount_bep20 > 0)
            );
            
            CREATE INDEX IF NOT EXISTS idx_queue_status 
            ON distribution_queue(status, created_at);
            
            CREATE INDEX IF NOT EXISTS idx_queue_tx_hash 
            ON distribution_queue(transaction_hash);
        """)
        print("   ✅ distribution_queue created")
        
        # 9. Insert default supported networks
        print("\n📋 Inserting default network configurations...")
        cursor.execute("""
            INSERT INTO supported_networks (network_name, chain_id, rpc_url, usdt_contract_address, native_currency, conversion_rate_to_bep20, is_active)
            VALUES 
                ('BSC', 56, 'https://bsc-dataseed.binance.org/', '0x55d398326f99059fF775485246999027B3197955', 'BNB', 1.0, TRUE),
                ('ETH', 1, 'https://mainnet.infura.io/v3/YOUR_KEY', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'ETH', 1.0, TRUE),
                ('POLYGON', 137, 'https://polygon-rpc.com/', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 'MATIC', 1.0, TRUE),
                ('TRON', NULL, 'https://api.trongrid.io', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'TRX', 1.0, FALSE)
            ON CONFLICT (network_name) DO NOTHING;
        """)
        print("   ✅ Default networks inserted")
        
        # Commit all changes
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ PUBLIC DEPOSIT SYSTEM MIGRATION COMPLETED SUCCESSFULLY!")
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
        print("\n🔧 Indexes Created: 15+")
        print("🔒 Constraints Added: 10+")
        print("🚀 Ready for concurrent deposits!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_tables()
