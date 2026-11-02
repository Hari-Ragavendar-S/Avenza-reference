#!/usr/bin/env python3
"""
Reorganize Binary Tree
Fixes the existing tree so LEFT users go straight down left leg
and RIGHT users go straight down right leg
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def get_all_users_by_position(cursor, root_id):
    """Get all users in the tree separated by their intended position"""
    cursor.execute("""
        SELECT id, username, name, position, sponsor_id
        FROM users
        WHERE sponsor_id = %s
        ORDER BY id
    """, (root_id,))
    
    return cursor.fetchall()

def clear_tree_structure(cursor, root_id):
    """Clear all left_child_id and right_child_id relationships"""
    cursor.execute("""
        UPDATE users 
        SET left_child_id = NULL, right_child_id = NULL
        WHERE id IN (
            WITH RECURSIVE downline AS (
                SELECT id FROM users WHERE id = %s
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN downline d ON u.sponsor_id = d.id
            )
            SELECT id FROM downline
        )
    """, (root_id,))
    print("✅ Cleared all tree relationships")

def place_user_in_position(cursor, parent_id, user_id, position):
    """Place a user in the extreme position of specified leg"""
    
    if position == 'left':
        # Find extreme left position
        current_id = parent_id
        while True:
            cursor.execute("""
                SELECT left_child_id FROM users WHERE id = %s
            """, (current_id,))
            result = cursor.fetchone()
            
            if not result['left_child_id']:
                # Found empty left position
                cursor.execute("""
                    UPDATE users SET left_child_id = %s WHERE id = %s
                """, (user_id, current_id))
                return current_id
            else:
                # Go deeper left
                current_id = result['left_child_id']
    
    elif position == 'right':
        # Find extreme right position
        current_id = parent_id
        while True:
            cursor.execute("""
                SELECT right_child_id FROM users WHERE id = %s
            """, (current_id,))
            result = cursor.fetchone()
            
            if not result['right_child_id']:
                # Found empty right position
                cursor.execute("""
                    UPDATE users SET right_child_id = %s WHERE id = %s
                """, (user_id, current_id))
                return current_id
            else:
                # Go deeper right
                current_id = result['right_child_id']

def reorganize_tree(cursor, root_id):
    """Reorganize the entire tree with proper left/right placement"""
    
    # Get all direct referrals
    direct_refs = get_all_users_by_position(cursor, root_id)
    
    if not direct_refs:
        return
    
    left_users = [u for u in direct_refs if u['position'] == 'left']
    right_users = [u for u in direct_refs if u['position'] == 'right']
    
    print(f"\n📊 Found {len(left_users)} LEFT users and {len(right_users)} RIGHT users under root")
    
    # Place all left users
    print("\n⬅️  Placing LEFT users:")
    for i, user in enumerate(left_users):
        parent = place_user_in_position(cursor, root_id, user['id'], 'left')
        print(f"   {i+1}. @{user['username']} → Placed under user ID {parent}")
    
    # Place all right users
    print("\n➡️  Placing RIGHT users:")
    for i, user in enumerate(right_users):
        parent = place_user_in_position(cursor, root_id, user['id'], 'right')
        print(f"   {i+1}. @{user['username']} → Placed under user ID {parent}")

def main():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    
    try:
        print("=" * 80)
        print("BINARY TREE REORGANIZATION")
        print("=" * 80)
        print()
        
        # Find root user (avenza)
        cursor.execute("""
            SELECT id, username FROM users 
            WHERE sponsor_id IS NULL OR username = 'avenza'
            ORDER BY id
            LIMIT 1
        """)
        root = cursor.fetchone()
        
        if not root:
            print("❌ Root user not found!")
            return
        
        print(f"🌳 Root User: @{root['username']} (ID: {root['id']})")
        print()
        
        # Get current structure
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM users 
            WHERE sponsor_id = %s
        """, (root['id'],))
        direct_count = cursor.fetchone()['count']
        
        print(f"📍 Direct Referrals: {direct_count}")
        print()
        
        # Confirm
        print("⚠️  WARNING: This will reorganize the entire binary tree!")
        print("   - All LEFT users will go straight down the left leg")
        print("   - All RIGHT users will go straight down the right leg")
        print()
        response = input("Continue? (yes/no): ")
        
        if response.lower() != 'yes':
            print("❌ Cancelled")
            return
        
        print()
        print("🔄 Starting reorganization...")
        print()
        
        # Step 1: Clear all tree relationships (but keep sponsor_id and position)
        clear_tree_structure(cursor, root['id'])
        
        # Step 2: Reorganize tree
        reorganize_tree(cursor, root['id'])
        
        # Commit changes
        conn.commit()
        
        print()
        print("=" * 80)
        print("✅ REORGANIZATION COMPLETE!")
        print("=" * 80)
        print()
        
        # Show new structure
        print("📊 New Tree Structure:")
        print()
        
        # Count left leg depth
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
            SELECT MAX(depth) as max_depth, COUNT(*) - 1 as total_users
            FROM left_leg
        """, (root['id'],))
        left_stats = cursor.fetchone()
        
        print(f"⬅️  LEFT LEG: {left_stats['total_users']} users, Max Depth: {left_stats['max_depth']}")
        
        # Count right leg depth
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
            SELECT MAX(depth) as max_depth, COUNT(*) - 1 as total_users
            FROM right_leg
        """, (root['id'],))
        right_stats = cursor.fetchone()
        
        print(f"➡️  RIGHT LEG: {right_stats['total_users']} users, Max Depth: {right_stats['max_depth']}")
        print()
        
        # Show extreme positions
        cursor.execute("""
            WITH RECURSIVE extreme_left AS (
                SELECT id, username, left_child_id, 0 as depth
                FROM users WHERE id = %s
                
                UNION ALL
                
                SELECT u.id, u.username, u.left_child_id, el.depth + 1
                FROM users u
                INNER JOIN extreme_left el ON u.id = el.left_child_id
                WHERE el.left_child_id IS NOT NULL
            )
            SELECT username, depth FROM extreme_left ORDER BY depth DESC LIMIT 1
        """, (root['id'],))
        extreme_left = cursor.fetchone()
        
        if extreme_left and extreme_left['depth'] > 0:
            print(f"⬅️  EXTREME LEFT: @{extreme_left['username']} at depth {extreme_left['depth']}")
        
        cursor.execute("""
            WITH RECURSIVE extreme_right AS (
                SELECT id, username, right_child_id, 0 as depth
                FROM users WHERE id = %s
                
                UNION ALL
                
                SELECT u.id, u.username, u.right_child_id, er.depth + 1
                FROM users u
                INNER JOIN extreme_right er ON u.id = er.right_child_id
                WHERE er.right_child_id IS NOT NULL
            )
            SELECT username, depth FROM extreme_right ORDER BY depth DESC LIMIT 1
        """, (root['id'],))
        extreme_right = cursor.fetchone()
        
        if extreme_right and extreme_right['depth'] > 0:
            print(f"➡️  EXTREME RIGHT: @{extreme_right['username']} at depth {extreme_right['depth']}")
        
        print()
        print("🎉 All new registrations will now follow this pattern!")
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
