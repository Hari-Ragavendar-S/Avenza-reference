#!/usr/bin/env python3
"""
Simple Database Cleanup - TRUNCATE approach
Keeps: Admin, @avenza, @gold
Preserves: All config tables
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def cleanup():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    conn.autocommit = False
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("AVENZA DATABASE CLEANUP - SIMPLE VERSION")
        print("=" * 60)
        
        # Get users to keep
        cursor.execute("SELECT id, username, referral_code FROM users WHERE username IN ('avenza', 'gold') OR referral_code = '9999'")
        keep_users = cursor.fetchall()
        
        print(f"\n✅ Keeping {len(keep_users)} users:")
        for u in keep_users:
            print(f"   ID {u['id']}: @{u['username']} (Code: {u['referral_code']})")
        
        confirm = input("\n⚠️  Type 'YES' to proceed: ")
        if confirm != 'YES':
            print("Cancelled")
            return
        
        print("\n🧹 Starting cleanup...\n")
        
        # TRUNCATE all transaction tables (fastest way, ignores FK)
        print("🗑️  Truncating all transaction tables...")
        tables_to_truncate = [
            'level_income_transactions',
            'downline_matching_bonus_history',
            'binary_matching_claims',
            'binary_matching_history',
            'referral_bonus_claims',
            'referral_bonuses',
            'investment_transactions',
            'user_investments',
            'internal_transfers',
            'support_messages',
            'withdrawal_logs',
            'withdrawals',
            'deposit_logs',
            'deposits',
            'transactions',
            'wallet_connection_logs',
            'binary_tree_structure',
        ]
        
        for table in tables_to_truncate:
            try:
                cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
                print(f"  ✅ Truncated {table}")
            except Exception as e:
                print(f"  ⚠️  {table}: {str(e)[:40]}")
        
        conn.commit()
        print("\n✅ All transaction data deleted")
        
        # Now delete users except kept ones
        print("\n🗑️  Deleting test users...")
        keep_ids = tuple([u['id'] for u in keep_users])
        
        # First set all FK columns to NULL
        cursor.execute("UPDATE users SET sponsor_id = NULL WHERE sponsor_id NOT IN %s OR sponsor_id IS NULL", (keep_ids,))
        cursor.execute("UPDATE users SET referred_by = NULL WHERE referred_by NOT IN %s OR referred_by IS NULL", (keep_ids,))
        cursor.execute("UPDATE users SET left_child_id = NULL WHERE left_child_id NOT IN %s OR left_child_id IS NULL", (keep_ids,))
        cursor.execute("UPDATE users SET right_child_id = NULL WHERE right_child_id NOT IN %s OR right_child_id IS NULL", (keep_ids,))
        conn.commit()
        
        # Now delete users
        cursor.execute("DELETE FROM users WHERE id NOT IN %s", (keep_ids,))
        deleted = cursor.rowcount
        print(f"✅ Deleted {deleted} users")
        
        # Reset avenza user
        print("\n🔧 Resetting avenza user...")
        cursor.execute("""
            UPDATE users SET 
                left_business = 0,
                right_business = 0,
                total_matched = 0,
                pending_left = 0,
                pending_right = 0,
                matching_bonus_earned = 0,
                sponsor_id = NULL,
                referred_by = NULL,
                left_child_id = NULL,
                right_child_id = NULL,
                last_matched_at = NULL
            WHERE username = 'avenza'
        """)
        print("✅ Reset complete")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ CLEANUP COMPLETE!")
        print("=" * 60)
        
        cursor.execute("SELECT COUNT(*) as c FROM users")
        print(f"\nTotal users: {cursor.fetchone()['c']}")
        
        cursor.execute("SELECT id, username, referral_code FROM users ORDER BY id")
        print("\nRemaining users:")
        for u in cursor.fetchall():
            print(f"  - ID {u['id']}: @{u['username']} (Code: {u['referral_code']})")
        
        print("\n🎉 Database ready for client delivery!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup()
