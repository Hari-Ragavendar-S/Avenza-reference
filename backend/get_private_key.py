from eth_account import Account
from mnemonic import Mnemonic

# Your seed phrase
seed_phrase = "bag journey weird blood gather minute cash cry luggage option purchase mistake"

# Generate account from mnemonic
Account.enable_unaudited_hdwallet_features()
account = Account.from_mnemonic(seed_phrase)

print("=" * 60)
print("WALLET DETAILS")
print("=" * 60)
print(f"Address: {account.address}")
print(f"Private Key: {account.key.hex()}")
print("=" * 60)
print("\n⚠️  IMPORTANT:")
print("Add this to your .env file:")
print(f"WITHDRAWAL_WALLET_PRIVATE_KEY={account.key.hex()}")
print("\nCommand:")
print("nano /var/www/avenza/backend/.env")
print("=" * 60)
