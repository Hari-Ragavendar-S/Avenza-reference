#!/bin/bash
# Check if automatic withdrawal is properly configured

echo "=== Checking Withdrawal Configuration ==="
echo ""

cd /var/www/avenza/backend

# Check if private key exists
echo "1. Checking WITHDRAWAL_WALLET_PRIVATE_KEY..."
if grep -q "WITHDRAWAL_WALLET_PRIVATE_KEY" .env; then
    if grep "WITHDRAWAL_WALLET_PRIVATE_KEY" .env | grep -q "=.\+"; then
        echo "   ✅ Private key is set"
        # Get the wallet address (you'll need to calculate from private key)
    else
        echo "   ❌ Private key is empty"
        echo "   Set it in .env file"
    fi
else
    echo "   ❌ Private key not found in .env"
    echo "   Add: WITHDRAWAL_WALLET_PRIVATE_KEY=your_private_key_here"
fi

echo ""
echo "2. Checking admin withdrawal settings..."
PGPASSWORD=123456 psql -h localhost -U avenzauser -d avenzaweb -c "
    SELECT setting_key, setting_value 
    FROM admin_settings 
    WHERE setting_key IN (
        'withdrawal_enabled',
        'withdrawal_fee_percentage', 
        'withdrawal_min_amount',
        'withdrawal_max_amount',
        'withdrawal_mode'
    )
    ORDER BY setting_key;
"

echo ""
echo "3. To get wallet address from private key, run:"
echo "   python3 get_private_key.py"

echo ""
echo "=== Configuration Summary ==="
echo "For automatic withdrawal to work:"
echo "  1. WITHDRAWAL_WALLET_PRIVATE_KEY must be set in .env"
echo "  2. That wallet needs BNB for gas (~0.001 BNB per tx)"
echo "  3. That wallet needs USDT to send"
echo "  4. withdrawal_mode should be 'automatic' in admin_settings"
