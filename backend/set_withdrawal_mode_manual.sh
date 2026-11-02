#!/bin/bash
# Set withdrawal mode to manual in database

echo "=== Setting Withdrawal Mode to Manual ==="
echo ""

PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb << 'EOF'

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert or update withdrawal mode to manual
INSERT INTO system_settings (setting_key, setting_value, updated_at)
VALUES ('withdrawal_mode', 'manual', NOW())
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = 'manual',
    updated_at = NOW();

-- Verify it was set
SELECT setting_key, setting_value, updated_at 
FROM system_settings 
WHERE setting_key = 'withdrawal_mode';

EOF

echo ""
echo "✅ Withdrawal mode set to MANUAL"
echo ""
echo "Now restart backend:"
echo "systemctl restart avenza"
echo ""
echo "Then test withdrawal - it should show 👤 Manual mode"
