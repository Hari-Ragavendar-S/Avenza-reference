#!/usr/bin/env python3
"""
Check @trail's actual direct referrals by sponsor_id
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def check_trail_sponsors():
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("=" * 80)
        print("🔍 CHECKING @trail's ACTUAL DIRECT REFERRALS")
        print("=" * 80)
        
        # Get @trail's ID
        cursor.execute("SELECT id, username FROM users WHERE username = 'trail'")
        trail = cursor.fetchone()
        trail_id = trail['id']
        
        print(f"\n@trail ID: {trail_id}")
        
        # Get ALL users with sponsor_id = trail_id
        cursor.execute("""
            SELECT id, username, sponsor_id, position
            FROM users
            WHERE sponsor_id = %s
            ORDER BY id
        """, (trail_id,))
        
        direct_refs = cursor.fetchall()
        
        print(f"\n📊 DIRECT REFERRALS (sponsor_id = {trail_id}):")
        print(f"Total Count: {len(direct_refs)}")
        print("-" * 80)
        
        for ref in direct_refs:
            print(f"  ID: {ref['id']:3d} | Username: @{ref['username']:15s} | Position: {ref['position'] or 'None'}")
        
        # Get binary tree members
        cursor.execute("""
            WITH RECURSIVE tree AS (
                SELECT u.id, u.username, u.sponsor_id, 1 as depth,
                       (SELECT username FROM users WHERE id = u.sponsor_id) as sponsor_name
                FROM users u
                WHERE u.id IN (
                    SELECT left_child_id FROM users WHERE id = %s AND left_child_id IS NOT NULL
                    UNION
                    SELECT right_child_id FROM users WHERE id = %s AND right_child_id IS NOT NULL
                )
                
                UNION ALL
                
                SELECT u.id, u.username, u.sponsor_id, t.depth + 1,
                       (SELECT username FROM users WHERE id = u.sponsor_id) as sponsor_name
                FROM users u
                INNER JOIN tree t ON (u.id = (SELECT left_child_id FROM users WHERE id = t.id) 
                                   OR u.id = (SELECT right_child_id FROM users WHERE id = t.id))
                WHERE t.depth < 50
            )
            SELECT * FROM tree ORDER BY id
        """, (trail_id, trail_id))
        
        tree_members = cursor.fetchall()
        
        print(f"\n🌳 BINARY TREE MEMBERS:")
        print(f"Total Count: {len(tree_members)}")
        print("-" * 80)
        
        for member in tree_members:
            is_direct = "✅ DIRECT" if member['sponsor_id'] == trail_id else f"❌ SPILLOVER (from @{member['sponsor_name']})"
            print(f"  ID: {member['id']:3d} | Username: @{member['username']:15s} | {is_direct}")
        
        # Summary
        direct_count = len(direct_refs)
        tree_count = len(tree_members)
        
        print("\n" + "=" * 80)
        print("📊 SUMMARY")
        print("=" * 80)
        print(f"Direct Referrals (sponsor_id = {trail_id}): {direct_count}")
        print(f"Binary Tree Members: {tree_count}")
        print(f"Spillover Members: {tree_count - direct_count}")
        
        if direct_count < tree_count:
            print(f"\n⚠️  Client says all {tree_count} are direct referrals, but database shows only {direct_count}")
            print("    Possible reasons:")
            print("    1. Members signed up using OTHER referral links (@traila, @trailB, etc.)")
            print("    2. Database sponsor_id values are INCORRECT")
            print("\n    ACTION: Ask client to verify if ALL members used @trail's referral link")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_trail_sponsors()
