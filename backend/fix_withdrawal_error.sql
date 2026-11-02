-- Fix Withdrawal 500 Error
-- Run this on the VPS to create missing tables if they don't exist

-- 1. Check if system_settings table exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings') THEN
        CREATE TABLE system_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            description TEXT,
            updated_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert default withdrawal mode
        INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
        VALUES ('withdrawal_mode', 'automatic', 'Withdrawal processing mode (automatic or manual)', CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key) DO NOTHING;
        
        RAISE NOTICE 'system_settings table created';
    ELSE
        RAISE NOTICE 'system_settings table already exists';
    END IF;
END $$;

-- 2. Check if withdrawals table has required columns
DO $$
BEGIN
    -- Add withdrawal_mode column if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'withdrawal_mode'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN withdrawal_mode VARCHAR(20) DEFAULT 'automatic';
        RAISE NOTICE 'Added withdrawal_mode column';
    END IF;
    
    -- Add destination_address column if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'destination_address'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN destination_address VARCHAR(255);
        RAISE NOTICE 'Added destination_address column';
    END IF;
    
    -- Add destination_wallet_type column if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'destination_wallet_type'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN destination_wallet_type VARCHAR(50);
        RAISE NOTICE 'Added destination_wallet_type column';
    END IF;
    
    -- Add processed_by column if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'processed_by'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN processed_by INTEGER;
        RAISE NOTICE 'Added processed_by column';
    END IF;
    
    -- Add processed_at column if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN processed_at TIMESTAMP;
        RAISE NOTICE 'Added processed_at column';
    END IF;
    
    -- Add admin_note column if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'admin_note'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN admin_note TEXT;
        RAISE NOTICE 'Added admin_note column';
    END IF;
    
    -- Add fee column if not exists (required, default 0)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'withdrawals' AND column_name = 'fee'
    ) THEN
        ALTER TABLE withdrawals ADD COLUMN fee DECIMAL(20, 8) DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added fee column';
    END IF;
END $$;

-- 3. Verify the fix
SELECT 
    'system_settings' as table_name,
    COUNT(*) as row_count
FROM system_settings
WHERE setting_key = 'withdrawal_mode'
UNION ALL
SELECT 
    'withdrawals_columns' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'withdrawals' 
AND column_name IN ('withdrawal_mode', 'destination_address', 'destination_wallet_type');
