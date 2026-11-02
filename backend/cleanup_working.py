#!/usr/bin/env python3
"""
Working Database Cleanup - Batch by batch approach
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import time

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def cleanup():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    conn.autocommit = True  # Auto-commit each statement
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("AVENZA DATABASE CLEANUP - WORKING VERSION")
        print("=" * 60)
        
        # Get users to keep
        cursor.execute("SELECT id, username, referral_code FROM users WHERE username IN ('avenza', 'gold') OR referral_code = '9999'")
        keep_users = cursor.fetchall()
        keep_ids = [u['id'] for u in keep_users]
        
        print(f"\n✅ Keeping {len(keep_users)} users:")
        for u in keep_users:
            print(f"   ID {u['id']}: @{u['username']} (Code: {u['referral_code']})")
        
        confirm = input("\n⚠️  Type 'YES' to proceed: ")
        if confirm != 'YES':
            print("Cancelled")
            return
        
        print("\n🧹 Starting cleanup with auto-commit...\n")
        
        # Get users to delete
        cursor.execute("SELECT id FROM users WHERE id NOT IN %s ORDER BY id", (tuple(keep_ids),))
        delete_user_ids = [row['id'] for row in cursor.fetchall()]
        
        print(f"📋 Found {len(delete_user_ids)} users to delete")
        print("🔧 Processing in batches of 10...\n")
        
        # Process in small batches
        batch_size = 10
        for i in range(0, len(delete_user_ids), batch_size):
            batch = delete_user_ids[i:i+batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(delete_user_ids) + batch_size - 1) // batch_size
            
            print(f"🔄 Batch {batch_num}/{total_batches}: Deleting users {batch}")
            
            # Break references FOR THIS BATCH
            cursor.execute("UPDATE users SET sponsor_id = NULL WHERE sponsor_id IN %s", (tuple(batch),))
            cursor.execute("UPDATE users SET referred_by = NULL WHERE referred_by IN %s", (tuple(batch),))
            cursor.execute("UPDATE users SET left_child_id = NULL WHERE left_child_id IN %s", (tuple(batch),))
            cursor.execute("UPDATE users SET right_child_id = NULL WHERE right_child_id IN %s", (tuple(batch),))
            
            # Break self-references IN THIS BATCH
            cursor.execute("UPDATE users SET sponsor_id = NULL WHERE id IN %s", (tuple(batch),))
            cursor.execute("UPDATE users SET referred_by = NULL WHERE id IN %s", (tuple(batch),))
            cursor.execute("UPDATE users SET left_child_id = NULL WHERE id IN %s", (tuple(batch),))
            cursor.execute("UPDATE users SET right_child_id = NULL WHERE id IN %s", (tuple(batch),))
            
            # Delete users in this batch
            cursor.execute("DELETE FROM users WHERE id IN %s", (tuple(batch),))
            
            print(f"   ✅ Deleted batch {batch_num}")
            time.sleep(0.1)  # Small delay between batches
        
        print(f"\n✅ All {len(delete_user_ids)} users deleted successfully!")
        
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
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup()
