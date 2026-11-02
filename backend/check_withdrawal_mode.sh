#!/bin/bash
# Check withdrawal mode setting in database

echo "=== Checking Withdrawal Mode Setting ==="
echo ""

PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb << 'EOF'

-- Check if system_settings table exists
\dt system_settings

-- Check current withdrawal mode
SELECT setting_key, setting_value, updated_at 
FROM system_settings 
WHERE setting_key = 'withdrawal_mode';

-- If not found, check admin_settings as fallback
SELECT setting_key, setting_value 
FROM admin_settings 
WHERE setting_key = 'withdrawal_mode';

-- Show all system_settings
SELECT * FROM system_settings;

EOF

echo ""
echo "If withdrawal_mode not found, run this to set it:"
echo ""
echo "PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb << 'EOF'"
echo "INSERT INTO system_settings (setting_key, setting_value, updated_at)"
echo "VALUES ('withdrawal_mode', 'manual', NOW())"
echo "ON CONFLICT (setting_key) DO UPDATE SET setting_value = 'manual';"
echo "EOF"
