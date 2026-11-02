"""
Test script to credit techneysoft123 user with top-up entries
Sender: Hari (8940576472)
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import datetime
import pytz

load_dotenv()

# Database connection
conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    cursor_factory=RealDictCursor
)

cursor = conn.cursor()

def get_ist_time():
    """Get current time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

print("=" * 60)
print("🚀 CREDITING USER: techneysoft123")
print("=" * 60)

try:
    # Get user details
    cursor.execute("""
        SELECT id, username, name, email, avenza_balance
        FROM users
        WHERE username = 'techneysoft123'
    """)
    
    user = cursor.fetchone()
    
    if not user:
        print("❌ User 'techneysoft123' not found!")
        exit(1)
    
    print(f"✅ User found:")
    print(f"   ID: {user['id']}")
    print(f"   Username: {user['username']}")
    print(f"   Name: {user['name']}")
    print(f"   Email: {user['email']}")
    print(f"   Current Balance: ${user['avenza_balance']}")
    print("=" * 60)
    
    # Entry 1: Test Entry (0.01 USDT)
    print("\n📝 ENTRY 1: TEST ENTRY")
    print("-" * 60)
    
    test_amount = Decimal('0.01')
    test_tx_hash = '0xTEST_TOPUP_TECHNEYSOFT_' + datetime.now().strftime('%Y%m%d%H%M%S')
    
    cursor.execute("""
        INSERT INTO user_topups
        (user_id, username, user_name, user_email, 
         sender_name, sender_phone, sender_wallet_address,
         amount_received, network, token_type,
         amount_bep20_equivalent, transaction_hash, status, topped_up_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s)
        RETURNING id
    """, (
        user['id'], user['username'], user['name'], user['email'],
        'Hari', '8940576472', '0xTestWalletAddress123',
        test_amount, 'BSC', 'USDT',
        test_amount, test_tx_hash, get_ist_time()
    ))
    
    test_topup_id = cursor.fetchone()['id']
    
    # Credit user's wallet
    new_balance = Decimal(user['avenza_balance']) + test_amount
    cursor.execute("""
        UPDATE users
        SET avenza_balance = %s
        WHERE id = %s
    """, (new_balance, user['id']))
    
    # Create transaction record
    cursor.execute("""
        INSERT INTO transactions
        (user_id, type, amount, currency, description,
         reference_id, reference_type, status, wallet_type, tag, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        user['id'], 'deposit', test_amount, 'USDT',
        f'Test top-up from Hari (8940576472)',
        test_topup_id, 'user_topup', 'completed', 'avenza', 'user_topup',
        get_ist_time()
    ))
    
    print(f"✅ Test top-up recorded!")
    print(f"   Top-up ID: {test_topup_id}")
    print(f"   Amount: ${test_amount}")
    print(f"   TX Hash: {test_tx_hash}")
    print(f"   New Balance: ${new_balance}")
    
    # Entry 2: Real Entry ($2)
    print("\n" + "=" * 60)
    print("💰 ENTRY 2: REAL ENTRY ($2)")
    print("-" * 60)
    
    real_amount = Decimal('2.00')
    real_tx_hash = '0xREAL_TOPUP_TECHNEYSOFT_' + datetime.now().strftime('%Y%m%d%H%M%S')
    
    cursor.execute("""
        INSERT INTO user_topups
        (user_id, username, user_name, user_email, 
         sender_name, sender_phone, sender_wallet_address,
         amount_received, network, token_type,
         amount_bep20_equivalent, transaction_hash, status, topped_up_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s)
        RETURNING id
    """, (
        user['id'], user['username'], user['name'], user['email'],
        'Hari', '8940576472', '0xRealWalletAddress456',
        real_amount, 'BSC', 'USDT',
        real_amount, real_tx_hash, get_ist_time()
    ))
    
    real_topup_id = cursor.fetchone()['id']
    
    # Credit user's wallet
    final_balance = new_balance + real_amount
    cursor.execute("""
        UPDATE users
        SET avenza_balance = %s
        WHERE id = %s
    """, (final_balance, user['id']))
    
    # Create transaction record
    cursor.execute("""
        INSERT INTO transactions
        (user_id, type, amount, currency, description,
         reference_id, reference_type, status, wallet_type, tag, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        user['id'], 'deposit', real_amount, 'USDT',
        f'User top-up from Hari (8940576472)',
        real_topup_id, 'user_topup', 'completed', 'avenza', 'user_topup',
        get_ist_time()
    ))
    
    print(f"✅ Real top-up recorded!")
    print(f"   Top-up ID: {real_topup_id}")
    print(f"   Amount: ${real_amount}")
    print(f"   TX Hash: {real_tx_hash}")
    print(f"   Final Balance: ${final_balance}")
    
    # Update public stats
    cursor.execute("""
        INSERT INTO public_stats (id, total_deposits_count, total_user_topups, 
                                 total_amount_received, last_deposit_at)
        VALUES (1, 2, 2, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            total_deposits_count = public_stats.total_deposits_count + 2,
            total_user_topups = public_stats.total_user_topups + 2,
            total_amount_received = public_stats.total_amount_received + %s,
            last_deposit_at = %s
    """, (test_amount + real_amount, get_ist_time(), test_amount + real_amount, get_ist_time()))
    
    conn.commit()
    
    print("\n" + "=" * 60)
    print("✅ ALL ENTRIES COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\nSUMMARY:")
    print(f"  User: {user['username']} ({user['name']})")
    print(f"  Sender: Hari (8940576472)")
    print(f"  Test Entry: $0.01")
    print(f"  Real Entry: $2.00")
    print(f"  Total Credited: $2.01")
    print(f"  Original Balance: ${user['avenza_balance']}")
    print(f"  Final Balance: ${final_balance}")
    print(f"\n🎉 User can now see these in their transaction history!")
    print("=" * 60)
    
except Exception as e:
    conn.rollback()
    print(f"\n❌ ERROR: {e}")
    raise
finally:
    cursor.close()
    conn.close()
