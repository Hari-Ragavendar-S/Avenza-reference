#!/usr/bin/env python3
"""
Check Binary Tree vs Direct Referrals Discrepancy
Shows why tree shows 28 but direct shows only 10
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def check_tree_vs_direct():
    """Compare binary tree placement vs direct sponsorship"""
    
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("=" * 100)
        print("🔍 BINARY TREE vs DIRECT REFERRALS ANALYSIS")
        print("=" * 100)
        
        # Get all users with binary tree data
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.sponsor_id,
                (SELECT username FROM users WHERE id = u.sponsor_id) as sponsor_username,
                u.position
            FROM users u
            WHERE u.id != 1
            ORDER BY u.id
        """)
        
        all_users = cursor.fetchall()
        
        print(f"\n📊 Total Users: {len(all_users)}\n")
        
        # For each user, count their direct referrals and binary tree members
        for user in all_users:
            user_id = user['id']
            username = user['username']
            
            # Count DIRECT referrals (sponsor_id)
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM users
                WHERE sponsor_id = %s
            """, (user_id,))
            direct_count = cursor.fetchone()['count']
            
            # Count LEFT leg (via left_child_id recursive)
            cursor.execute("""
                WITH RECURSIVE left_tree AS (
                    SELECT u.id, u.username, u.sponsor_id, 1 as depth
                    FROM users u
                    WHERE u.id IN (
                        SELECT left_child_id FROM users WHERE id = %s AND left_child_id IS NOT NULL
                    )
                    
                    UNION ALL
                    
                    SELECT u.id, u.username, u.sponsor_id, lt.depth + 1
                    FROM users u
                    INNER JOIN left_tree lt ON (u.id = (SELECT left_child_id FROM users WHERE id = lt.id) 
                                              OR u.id = (SELECT right_child_id FROM users WHERE id = lt.id))
                    WHERE lt.depth < 50
                )
                SELECT COUNT(*) as count FROM left_tree
            """, (user_id,))
            left_count = cursor.fetchone()['count']
            
            # Count RIGHT leg (via right_child_id recursive)
            cursor.execute("""
                WITH RECURSIVE right_tree AS (
                    SELECT u.id, u.username, u.sponsor_id, 1 as depth
                    FROM users u
                    WHERE u.id IN (
                        SELECT right_child_id FROM users WHERE id = %s AND right_child_id IS NOT NULL
                    )
                    
                    UNION ALL
                    
                    SELECT u.id, u.username, u.sponsor_id, rt.depth + 1
                    FROM users u
                    INNER JOIN right_tree rt ON (u.id = (SELECT left_child_id FROM users WHERE id = rt.id) 
                                               OR u.id = (SELECT right_child_id FROM users WHERE id = rt.id))
                    WHERE rt.depth < 50
                )
                SELECT COUNT(*) as count FROM right_tree
            """, (user_id,))
            right_count = cursor.fetchone()['count']
            
            tree_total = left_count + right_count
            
            # Only show users with discrepancy
            if tree_total > 0 and (direct_count != tree_total or direct_count < 5):
                print(f"{'─' * 100}")
                print(f"👤 USER: @{username} (ID: {user_id})")
                print(f"   Sponsor: @{user['sponsor_username'] or 'None'}")
                print(f"   Position: {user['position'] or 'None'}")
                print(f"\n   📊 COUNTS:")
                print(f"      🌳 Binary Tree: LEFT={left_count}, RIGHT={right_count}, TOTAL={tree_total}")
                print(f"      👥 Direct Referrals (sponsor_id): {direct_count}")
                
                if tree_total != direct_count:
                    print(f"\n   ⚠️  DISCREPANCY: Tree shows {tree_total} but only {direct_count} are direct referrals!")
                    print(f"      This means {tree_total - direct_count} members are spillover from upline")
                
                # Show left leg members
                if left_count > 0:
                    cursor.execute("""
                        WITH RECURSIVE left_tree AS (
                            SELECT u.id, u.username, u.sponsor_id, 1 as depth
                            FROM users u
                            WHERE u.id IN (
                                SELECT left_child_id FROM users WHERE id = %s AND left_child_id IS NOT NULL
                            )
                            
                            UNION ALL
                            
                            SELECT u.id, u.username, u.sponsor_id, lt.depth + 1
                            FROM users u
                            INNER JOIN left_tree lt ON (u.id = (SELECT left_child_id FROM users WHERE id = lt.id) 
                                                      OR u.id = (SELECT right_child_id FROM users WHERE id = lt.id))
                            WHERE lt.depth < 50
                        )
                        SELECT 
                            lt.id,
                            lt.username,
                            lt.sponsor_id,
                            (SELECT username FROM users WHERE id = lt.sponsor_id) as sponsor_username,
                            lt.depth
                        FROM left_tree lt
                        ORDER BY lt.depth, lt.id
                        LIMIT 15
                    """, (user_id,))
                    
                    left_members = cursor.fetchall()
                    
                    print(f"\n   ⬅️  LEFT LEG MEMBERS ({left_count} total, showing first 15):")
                    for m in left_members:
                        is_direct = "✅ DIRECT" if m['sponsor_id'] == user_id else f"❌ SPILLOVER (sponsored by @{m['sponsor_username']})"
                        print(f"      - @{m['username']} (Depth {m['depth']}) - {is_direct}")
                
                # Show right leg members
                if right_count > 0:
                    cursor.execute("""
                        WITH RECURSIVE right_tree AS (
                            SELECT u.id, u.username, u.sponsor_id, 1 as depth
                            FROM users u
                            WHERE u.id IN (
                                SELECT right_child_id FROM users WHERE id = %s AND right_child_id IS NOT NULL
                            )
                            
                            UNION ALL
                            
                            SELECT u.id, u.username, u.sponsor_id, rt.depth + 1
                            FROM users u
                            INNER JOIN right_tree rt ON (u.id = (SELECT left_child_id FROM users WHERE id = rt.id) 
                                                       OR u.id = (SELECT right_child_id FROM users WHERE id = rt.id))
                            WHERE rt.depth < 50
                        )
                        SELECT 
                            rt.id,
                            rt.username,
                            rt.sponsor_id,
                            (SELECT username FROM users WHERE id = rt.sponsor_id) as sponsor_username,
                            rt.depth
                        FROM right_tree rt
                        ORDER BY rt.depth, rt.id
                        LIMIT 15
                    """, (user_id,))
                    
                    right_members = cursor.fetchall()
                    
                    print(f"\n   ➡️  RIGHT LEG MEMBERS ({right_count} total, showing first 15):")
                    for m in right_members:
                        is_direct = "✅ DIRECT" if m['sponsor_id'] == user_id else f"❌ SPILLOVER (sponsored by @{m['sponsor_username']})"
                        print(f"      - @{m['username']} (Depth {m['depth']}) - {is_direct}")
                
                print("")
        
        # Summary
        print("\n" + "=" * 100)
        print("📊 EXPLANATION")
        print("=" * 100)
        print("""
Binary Tree vs Direct Referrals:

1. BINARY TREE (left_child_id + right_child_id):
   - Shows ALL members placed under you in the binary structure
   - Includes YOUR direct referrals + SPILLOVER from upline
   - Used for binary matching calculations
   
2. DIRECT REFERRALS (sponsor_id):
   - Shows ONLY members you personally referred
   - Used for: Referral bonus, Level income unlock, etc.
   - Does NOT include spillover members

EXAMPLE:
- You have 10 direct referrals (sponsored by you)
- Your upline places 18 more members under you (spillover)
- Result: Tree shows 28, Direct shows 10

This is NORMAL and EXPECTED in binary MLM systems!
        """)
        
        print("=" * 100)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_tree_vs_direct()
