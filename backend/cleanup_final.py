#!/usr/bin/env python3
"""
Final Database Cleanup - Uses DROP and RECREATE approach
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
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("AVENZA DATABASE CLEANUP - FINAL VERSION")
        print("=" * 60)
        
        # Get users to keep
        cursor.execute("SELECT id, username, referral_code FROM users WHERE username IN ('avenza', 'gold') OR referral_code = '9999'")
        keep_users = cursor.fetchall()
        keep_ids = tuple([u['id'] for u in keep_users])
        
        print(f"\n✅ Keeping {len(keep_users)} users:")
        for u in keep_users:
            print(f"   ID {u['id']}: @{u['username']} (Code: {u['referral_code']})")
        
        cursor.execute("SELECT COUNT(*) as c FROM users WHERE id NOT IN %s", (keep_ids,))
        delete_count = cursor.fetchone()['c']
        print(f"\n🗑️  Will delete {delete_count} users")
        
        confirm = input("\n⚠️  Type 'YES' to proceed: ")
        if confirm != 'YES':
            print("Cancelled")
            return
        
        print("\n🧹 Starting cleanup...\n")
        
        # Disable triggers temporarily
        print("🔓 Disabling triggers...")
        cursor.execute("ALTER TABLE users DISABLE TRIGGER ALL")
        cursor.execute("ALTER TABLE binary_tree_structure DISABLE TRIGGER ALL")
        
        # Delete from all tables
        tables = [
            ('level_income_transactions', 'recipient_id'),
            ('downline_matching_bonus_history', 'user_id'),
            ('binary_matching_claims', 'user_id'),
            ('binary_matching_history', 'user_id'),
            ('binary_tree_structure', 'user_id'),
            ('referral_bonus_claims', 'referrer_id'),
            ('referral_bonuses', 'referrer_id'),
            ('investment_transactions', 'user_id'),
            ('user_investments', 'user_id'),
            ('internal_transfers', 'sender_id'),
            ('support_messages', 'user_id'),
            ('withdrawals', 'user_id'),
            ('deposits', 'user_id'),
            ('transactions', 'user_id'),
            ('wallet_connection_logs', 'user_id'),
        ]
        
        for table, col in tables:
            try:
                cursor.execute(f"DELETE FROM {table} WHERE {col} NOT IN %s", (keep_ids,))
                if cursor.rowcount > 0:
                    print(f"✅ {table}: deleted {cursor.rowcount}")
            except Exception as e:
                print(f"⚠️  {table}: {str(e)[:50]}")
        
        # Delete users
        cursor.execute("DELETE FROM users WHERE id NOT IN %s", (keep_ids,))
        print(f"\n✅ Deleted {cursor.rowcount} users")
        
        # Re-enable triggers
        print("\n🔒 Re-enabling triggers...")
        cursor.execute("ALTER TABLE users ENABLE TRIGGER ALL")
        cursor.execute("ALTER TABLE binary_tree_structure ENABLE TRIGGER ALL")
        
        # Reset avenza user
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
            WHERE id = %s
        """, (keep_ids[0],))
        print(f"✅ Reset avenza user")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ CLEANUP COMPLETE!")
        print("=" * 60)
        
        cursor.execute("SELECT COUNT(*) as c FROM users")
        print(f"\nTotal users: {cursor.fetchone()['c']}")
        
        cursor.execute("SELECT id, username, referral_code FROM users")
        for u in cursor.fetchall():
            print(f"  - ID {u['id']}: @{u['username']} (Code: {u['referral_code']})")
        
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
