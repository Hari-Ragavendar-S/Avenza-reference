#!/bin/bash

echo "🔧 Fixing Withdrawal 500 Error..."
echo ""

# Run SQL fix
echo "📋 Running SQL fixes..."
PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb -f /var/www/avenza/backend/fix_withdrawal_error.sql

echo ""
echo "♻️  Restarting backend service..."
systemctl restart avenza

echo ""
echo "✅ Done! Check status:"
systemctl status avenza --no-pager -l
