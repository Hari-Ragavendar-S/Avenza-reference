#!/usr/bin/env python3
"""
Verify Awards & Rewards Data
Check if tiers exist in database and API is returning them
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def main():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=" * 80)
        print("CHECKING AWARDS & REWARDS DATA")
        print("=" * 80)
        
        # Check if binary_matching_tiers table exists
        print("\n1. Checking if binary_matching_tiers table exists...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'binary_matching_tiers'
            )
        """)
        exists = cursor.fetchone()['exists']
        
        if not exists:
            print("   ❌ Table 'binary_matching_tiers' does NOT exist!")
            print("   Run: python3 migrations/binary_matching_setup.py")
            print("   Then: python3 migrations/binary_awards_update.py")
            cursor.close()
            conn.close()
            return
        
        print("   ✅ Table exists")
        
        # Check tier data
        print("\n2. Checking tier data...")
        cursor.execute("""
            SELECT level, required_match, bonus_amount, is_active, 
                   prize_type, prize_name
            FROM binary_matching_tiers
            ORDER BY level
        """)
        
        tiers = cursor.fetchall()
        
        if not tiers:
            print("   ❌ NO TIERS FOUND in database!")
            print("   Run: python3 migrations/binary_matching_setup.py")
            print("   Then: python3 migrations/binary_awards_update.py")
        else:
            print(f"   ✅ Found {len(tiers)} tiers:")
            for tier in tiers:
                status = "✅" if tier['is_active'] else "❌"
                prize = f" + {tier['prize_name']}" if tier['prize_name'] else ""
                print(f"      {status} Level {tier['level']}: ${tier['required_match']:,} → ${tier['bonus_amount']:,}{prize}")
        
        # Check if any user has claims
        print("\n3. Checking user claims...")
        cursor.execute("""
            SELECT COUNT(*) as count FROM binary_matching_claims
        """)
        claims_count = cursor.fetchone()['count']
        print(f"   Total claims: {claims_count}")
        
        # Check sample user stats
        print("\n4. Checking sample user (Avenza Mother ID)...")
        cursor.execute("""
            SELECT username, left_business, right_business, total_matched, 
                   matching_bonus_earned
            FROM users 
            WHERE username = 'avenza'
        """)
        user = cursor.fetchone()
        
        if user:
            print(f"   Username: {user['username']}")
            print(f"   Left Business: ${user['left_business'] or 0}")
            print(f"   Right Business: ${user['right_business'] or 0}")
            print(f"   Total Matched: ${user['total_matched'] or 0}")
            print(f"   Bonus Earned: ${user['matching_bonus_earned'] or 0}")
        else:
            print("   ❌ User 'avenza' not found")
        
        print("\n" + "=" * 80)
        print("✅ VERIFICATION COMPLETE")
        print("=" * 80)
        
        if not tiers:
            print("\n⚠️  ACTION REQUIRED:")
            print("   cd /var/www/avenza/backend")
            print("   source venv/bin/activate")
            print("   python3 migrations/binary_matching_setup.py")
            print("   python3 migrations/binary_awards_update.py")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
