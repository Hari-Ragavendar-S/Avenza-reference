#!/bin/bash
# Deploy wallet schema fix

echo "=== Deploying Wallet Schema Fix ==="

# This will be run after SCP upload
cd /var/www/avenza/backend

echo "Restarting service..."
systemctl restart avenza

sleep 2

echo ""
echo "=== Service Status ==="
systemctl status avenza --no-pager | head -15

echo ""
echo "=== Recent Logs ==="
journalctl -u avenza -n 20 --no-pager

echo ""
echo "✅ Schema updated! The WithdrawalRequest now expects:"
echo "   - to_address (instead of wallet_address)"
echo "   - destination_wallet_type"
echo ""
echo "Test automatic withdrawal now!"
