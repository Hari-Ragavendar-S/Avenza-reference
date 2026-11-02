#!/bin/bash
# Quick fix for withdrawal fee column error

echo "🔧 Adding fee column to withdrawals table..."

PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb << 'EOF'

-- Add fee column if not exists
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS fee DECIMAL(20, 8) DEFAULT 0 NOT NULL;

-- Verify the column was added
\d withdrawals

-- Show result
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'withdrawals' AND column_name = 'fee';

EOF

echo ""
echo "✅ Fee column added. Restarting service..."
systemctl restart avenza

echo ""
echo "Done! Service status:"
systemctl status avenza --no-pager -l | head -20
