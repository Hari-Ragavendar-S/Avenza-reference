#!/usr/bin/env python3
"""
Test script to verify cron job will work
Run this on VPS to test before setting up cron
"""

import sys
import os

print("🧪 Testing Cron Job Setup\n")
print("=" * 50)

# Test 1: Python version
print("\n1️⃣ Testing Python version...")
print(f"   Python: {sys.version}")
if sys.version_info >= (3, 7):
    print("   ✅ Python version OK")
else:
    print("   ❌ Python version too old (need 3.7+)")
    sys.exit(1)

# Test 2: Check if files exist
print("\n2️⃣ Checking required files...")
files_to_check = [
    'cron_daily_profit.py',
    'distribute_level_income.py',
    '.env'
]

for file in files_to_check:
    if os.path.exists(file):
        print(f"   ✅ {file} exists")
    else:
        print(f"   ❌ {file} MISSING!")
        sys.exit(1)

# Test 3: Check imports
print("\n3️⃣ Testing imports...")
try:
    import psycopg2
    print("   ✅ psycopg2 installed")
except ImportError:
    print("   ❌ psycopg2 NOT installed")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    print("   ✅ python-dotenv installed")
except ImportError:
    print("   ❌ python-dotenv NOT installed")
    sys.exit(1)

try:
    import pytz
    print("   ✅ pytz installed")
except ImportError:
    print("   ❌ pytz NOT installed")
    sys.exit(1)

# Test 4: Load environment variables
print("\n4️⃣ Testing environment variables...")
load_dotenv()

required_env = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
for env_var in required_env:
    value = os.getenv(env_var)
    if value:
        print(f"   ✅ {env_var} = {value[:3]}***")
    else:
        print(f"   ❌ {env_var} NOT SET!")
        sys.exit(1)

# Test 5: Database connection
print("\n5️⃣ Testing database connection...")
try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456')
    )
    print("   ✅ Database connection OK")
    
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"   ✅ Found {user_count} users in database")
    
    cursor.execute("SELECT COUNT(*) FROM user_investments")
    inv_count = cursor.fetchone()[0]
    print(f"   ✅ Found {inv_count} investments in database")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"   ❌ Database connection FAILED: {e}")
    sys.exit(1)

# Test 6: Import distribute_level_income
print("\n6️⃣ Testing level income module...")
try:
    from distribute_level_income import distribute_level_income_for_user, calculate_unlocked_levels
    print("   ✅ distribute_level_income module imported")
    
    # Test function
    unlocked = calculate_unlocked_levels(3)
    print(f"   ✅ calculate_unlocked_levels(3) = {unlocked} levels")
    
except Exception as e:
    print(f"   ❌ Level income module FAILED: {e}")
    sys.exit(1)

# Test 7: Test cron script import
print("\n7️⃣ Testing cron script...")
try:
    from cron_daily_profit import calculate_daily_profits
    print("   ✅ cron_daily_profit module imported")
except Exception as e:
    print(f"   ❌ Cron script import FAILED: {e}")
    sys.exit(1)

# Final summary
print("\n" + "=" * 50)
print("✅ ALL TESTS PASSED!")
print("\nYou can now:")
print("1. Test manually: python cron_daily_profit.py")
print("2. Set up cron job with:")
print("   crontab -e")
print("   Add line:")
print("   0 0 * * * cd /var/www/avenza/backend && /var/www/avenza/backend/venv/bin/python cron_daily_profit.py >> /var/log/avenza_cron.log 2>&1")
print("\n🚀 Ready to deploy!")
