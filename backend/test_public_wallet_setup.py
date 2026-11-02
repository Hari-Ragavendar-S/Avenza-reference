"""
Test script to verify public wallet system setup
"""
import sys
import os

print("🔍 Testing Public Wallet System Setup...")
print("=" * 60)

# Test 1: Check encryption key
print("\n1️⃣  Checking ENCRYPTION_KEY...")
from dotenv import load_dotenv
load_dotenv()

encryption_key = os.getenv('ENCRYPTION_KEY')
if encryption_key:
    print(f"   ✅ ENCRYPTION_KEY is set (length: {len(encryption_key)})")
else:
    print("   ❌ ENCRYPTION_KEY is NOT set in .env file!")
    print("   💡 Add this line to .env:")
    print("      ENCRYPTION_KEY=your-32-character-secret-key-here-change-this!")
    sys.exit(1)

# Test 2: Check encryption service
print("\n2️⃣  Testing Encryption Service...")
try:
    from app.utils.encryption import get_encryption_service
    
    encryption_service = get_encryption_service()
    print("   ✅ Encryption service initialized")
    
    # Test encryption/decryption
    test_phrase = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
    is_valid, error = encryption_service.validate_secret_phrase(test_phrase)
    
    if is_valid:
        print("   ✅ Secret phrase validation works")
        
        encrypted = encryption_service.encrypt(test_phrase)
        print(f"   ✅ Encryption works (encrypted length: {len(encrypted)})")
        
        decrypted = encryption_service.decrypt(encrypted)
        if decrypted == test_phrase:
            print("   ✅ Decryption works")
        else:
            print("   ❌ Decryption failed - output doesn't match input")
    else:
        print(f"   ❌ Validation error: {error}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check database tables
print("\n3️⃣  Checking Database Tables...")
try:
    from app.database.connection import get_db
    
    db = get_db()
    cursor = db.cursor()
    
    tables = [
        'public_wallet_config',
        'supported_networks',
        'public_deposits_website',
        'public_deposits_external',
        'public_distribution_records',
        'public_stats',
        'distribution_queue'
    ]
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
        result = cursor.fetchone()
        print(f"   ✅ {table}: {result['count']} records")
    
    cursor.close()
    print("   ✅ All tables exist")
    
except Exception as e:
    print(f"   ❌ Database error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Check supported networks
print("\n4️⃣  Checking Supported Networks...")
try:
    cursor = db.cursor()
    cursor.execute("SELECT network_name, is_active FROM supported_networks")
    networks = cursor.fetchall()
    
    for net in networks:
        status = "✅ Active" if net['is_active'] else "⚠️  Inactive"
        print(f"   {status}: {net['network_name']}")
    
    cursor.close()
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 5: Test API endpoint simulation
print("\n5️⃣  Testing Configuration Endpoint Logic...")
try:
    from app.utils.encryption import get_encryption_service
    
    # Simulate what the endpoint does
    test_config = {
        'wallet_address': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'secret_phrase': 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        'network': 'BSC'
    }
    
    encryption_service = get_encryption_service()
    
    # Validate
    is_valid, error = encryption_service.validate_secret_phrase(test_config['secret_phrase'])
    if is_valid:
        print("   ✅ Secret phrase validation passed")
        
        # Encrypt
        encrypted = encryption_service.encrypt(test_config['secret_phrase'])
        print("   ✅ Encryption successful")
        
        print("\n   📝 Would insert into database:")
        print(f"      wallet_address: {test_config['wallet_address']}")
        print(f"      network: {test_config['network']}")
        print(f"      encrypted_secret_phrase: (encrypted - {len(encrypted)} chars)")
    else:
        print(f"   ❌ Validation failed: {error}")
        
except Exception as e:
    print(f"   ❌ Error during endpoint simulation: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("✅ Setup test completed!")
print("\nIf all tests passed, the system is ready.")
print("If any test failed, check the errors above and fix them.")
