#!/bin/bash
# Fix automatic withdrawal endpoint - add missing columns

echo "=== Fixing Automatic Withdrawal Endpoint ==="

# Backup current file
cp /var/www/avenza/backend/app/routes/wallet.py /var/www/avenza/backend/app/routes/wallet.py.backup_auto_withdraw

# Upload new file from local (you'll need to run: scp command first)
# After upload:
echo "File uploaded, restarting service..."

# Restart backend
systemctl restart avenza

# Check status
sleep 2
systemctl status avenza --no-pager | head -20

# Check logs
echo ""
echo "=== Recent Logs ==="
journalctl -u avenza -n 20 --no-pager

echo ""
echo "=== Testing Withdrawal Endpoint ==="
echo "Try automatic withdrawal from frontend now"
echo ""
echo "If still issues, check:"
echo "1. WITHDRAWAL_WALLET_PRIVATE_KEY is set in .env"
echo "2. Wallet has BNB for gas fees"
echo "3. Wallet has USDT balance"
