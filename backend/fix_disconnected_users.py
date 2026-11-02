#!/usr/bin/env python3
"""
Fix Disconnected Users
Places JOSEPH and Siv in the proper tree positions
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
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    
    try:
        print("=" * 80)
        print("FIXING DISCONNECTED USERS")
        print("=" * 80)
        print()
        
        # Find JOSEPH (left position under AVENZA1)
        cursor.execute("""
            SELECT id, username, position, sponsor_id 
            FROM users 
            WHERE username = 'JOSEPH'
        """)
        joseph = cursor.fetchone()
        
        # Find Siv (right position under AVENZA1)
        cursor.execute("""
            SELECT id, username, position, sponsor_id 
            FROM users 
            WHERE username = 'Siv'
        """)
        siv = cursor.fetchone()
        
        if not joseph or not siv:
            print("❌ Users not found!")
            return
        
        print(f"Found: @{joseph['username']} (ID: {joseph['id']}, Position: {joseph['position']})")
        print(f"Found: @{siv['username']} (ID: {siv['id']}, Position: {siv['position']})")
        print()
        
        # Since these are under AVENZA1 who is already deep in the left leg,
        # We need to place them at the root level
        
        # Option 1: Place them under root (avenza)
        cursor.execute("SELECT id FROM users WHERE username = 'avenza'")
        root_id = cursor.fetchone()['id']
        
        # JOSEPH should go in LEFT leg (position = left)
        # Find extreme left
        cursor.execute("""
            WITH RECURSIVE left_leg AS (
                SELECT id, left_child_id FROM users WHERE id = %s
                UNION ALL
                SELECT u.id, u.left_child_id 
                FROM users u
                INNER JOIN left_leg l ON u.id = l.left_child_id
                WHERE l.left_child_id IS NOT NULL
            )
            SELECT id FROM left_leg ORDER BY id DESC LIMIT 1
        """, (root_id,))
        extreme_left = cursor.fetchone()
        
        if extreme_left:
            cursor.execute("""
                UPDATE users SET left_child_id = %s WHERE id = %s
            """, (joseph['id'], extreme_left['id']))
            print(f"✅ Placed @JOSEPH at extreme left (under user ID {extreme_left['id']})")
        
        # Siv should go in RIGHT leg (position = right)
        # Find extreme right
        cursor.execute("""
            WITH RECURSIVE right_leg AS (
                SELECT id, right_child_id FROM users WHERE id = %s
                UNION ALL
                SELECT u.id, u.right_child_id 
                FROM users u
                INNER JOIN right_leg r ON u.id = r.right_child_id
                WHERE r.right_child_id IS NOT NULL
            )
            SELECT id FROM right_leg ORDER BY id DESC LIMIT 1
        """, (root_id,))
        extreme_right = cursor.fetchone()
        
        if extreme_right:
            cursor.execute("""
                UPDATE users SET right_child_id = %s WHERE id = %s
            """, (siv['id'], extreme_right['id']))
            print(f"✅ Placed @Siv at extreme right (under user ID {extreme_right['id']})")
        
        # Update their sponsor to root
        cursor.execute("""
            UPDATE users SET sponsor_id = %s WHERE id IN (%s, %s)
        """, (root_id, joseph['id'], siv['id']))
        print(f"✅ Updated sponsor to root for both users")
        
        conn.commit()
        
        print()
        print("=" * 80)
        print("✅ DISCONNECTED USERS FIXED!")
        print("=" * 80)
        print()
        
        # Show new structure
        print("📊 New Tree Stats:")
        
        # Left leg
        cursor.execute("""
            WITH RECURSIVE left_leg AS (
                SELECT id, left_child_id, 0 as depth
                FROM users WHERE id = %s
                UNION ALL
                SELECT u.id, u.left_child_id, l.depth + 1
                FROM users u
                INNER JOIN left_leg l ON u.id = l.left_child_id
                WHERE l.left_child_id IS NOT NULL
            )
            SELECT MAX(depth) as max_depth, COUNT(*) - 1 as total
            FROM left_leg
        """, (root_id,))
        left_stats = cursor.fetchone()
        print(f"⬅️  LEFT LEG: {left_stats['total']} users, Depth: {left_stats['max_depth']}")
        
        # Right leg
        cursor.execute("""
            WITH RECURSIVE right_leg AS (
                SELECT id, right_child_id, 0 as depth
                FROM users WHERE id = %s
                UNION ALL
                SELECT u.id, u.right_child_id, r.depth + 1
                FROM users u
                INNER JOIN right_leg r ON u.id = r.right_child_id
                WHERE r.right_child_id IS NOT NULL
            )
            SELECT MAX(depth) as max_depth, COUNT(*) - 1 as total
            FROM right_leg
        """, (root_id,))
        right_stats = cursor.fetchone()
        print(f"➡️  RIGHT LEG: {right_stats['total']} users, Depth: {right_stats['max_depth']}")
        print()
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
