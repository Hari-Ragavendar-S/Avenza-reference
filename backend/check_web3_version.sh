#!/bin/bash
# Check Web3.py version and test transaction signing

echo "=== Checking Web3.py Configuration ==="
echo ""

cd /var/www/avenza/backend
source venv/bin/activate

echo "1. Web3.py version:"
python3 -c "import web3; print(web3.__version__)"

echo ""
echo "2. Testing transaction signing attributes:"
python3 << 'EOF'
from web3 import Web3
from eth_account import Account

# Create test account
account = Account.create()

# Create dummy transaction
tx = {
    'nonce': 0,
    'to': account.address,
    'value': 0,
    'gas': 21000,
    'gasPrice': 5000000000,
    'chainId': 56
}

# Sign transaction
signed = Account.sign_transaction(tx, account.key)

# Check which attribute exists
print("Available attributes:")
if hasattr(signed, 'rawTransaction'):
    print("  ✅ rawTransaction (camelCase) - FOUND")
else:
    print("  ❌ rawTransaction (camelCase) - NOT FOUND")

if hasattr(signed, 'raw_transaction'):
    print("  ✅ raw_transaction (snake_case) - FOUND")
else:
    print("  ❌ raw_transaction (snake_case) - NOT FOUND")

print(f"\nActual type: {type(signed)}")
print(f"Dir: {[attr for attr in dir(signed) if not attr.startswith('_')]}")
EOF

echo ""
echo "3. Testing BSC connection:"
python3 -c "from web3 import Web3; w3 = Web3(Web3.HTTPProvider('https://bsc-dataseed.binance.org/')); print('Connected:', w3.is_connected())"

echo ""
echo "Done! The fix handles all versions automatically."
