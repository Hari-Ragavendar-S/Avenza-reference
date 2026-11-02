#!/usr/bin/env python3
"""
Check Binary Tree Structure
Verifies left/right placements and shows extreme positions
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def get_extreme_left(cursor, user_id, depth=0):
    """Recursively find extreme left"""
    cursor.execute("""
        SELECT id, username, name, left_child_id, right_child_id, position
        FROM users WHERE id = %s
    """, (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return None
    
    if user['left_child_id']:
        return get_extreme_left(cursor, user['left_child_id'], depth + 1)
    else:
        return {
            'id': user['id'],
            'username': user['username'],
            'name': user['name'],
            'depth': depth
        }

def get_extreme_right(cursor, user_id, depth=0):
    """Recursively find extreme right"""
    cursor.execute("""
        SELECT id, username, name, left_child_id, right_child_id, position
        FROM users WHERE id = %s
    """, (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return None
    
    if user['right_child_id']:
        return get_extreme_right(cursor, user['right_child_id'], depth + 1)
    else:
        return {
            'id': user['id'],
            'username': user['username'],
            'name': user['name'],
            'depth': depth
        }

def count_team(cursor, user_id):
    """Count total team size"""
    cursor.execute("""
        WITH RECURSIVE downline AS (
            SELECT id FROM users WHERE id = %s
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN downline d ON u.sponsor_id = d.id
        )
        SELECT COUNT(*) - 1 as team_size FROM downline
    """, (user_id,))
    return cursor.fetchone()['team_size']

def print_tree_recursive(cursor, user_id, indent=0, position="ROOT"):
    """Print tree structure recursively"""
    cursor.execute("""
        SELECT id, username, name, left_child_id, right_child_id, 
               sponsor_id, position, is_active
        FROM users WHERE id = %s
    """, (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return
    
    # Count direct referrals
    cursor.execute("""
        SELECT COUNT(*) as count FROM users WHERE sponsor_id = %s
    """, (user_id,))
    direct_count = cursor.fetchone()['count']
    
    # Count team size
    team_size = count_team(cursor, user_id)
    
    # Print current user
    prefix = "  " * indent
    status = "🟢" if user['is_active'] else "⚪"
    print(f"{prefix}{position}: {status} @{user['username']} ({user['name']}) | Direct: {direct_count} | Team: {team_size}")
    
    # Print children
    if user['left_child_id']:
        print_tree_recursive(cursor, user['left_child_id'], indent + 1, "LEFT")
    else:
        print(f"{prefix}  LEFT: [Empty]")
    
    if user['right_child_id']:
        print_tree_recursive(cursor, user['right_child_id'], indent + 1, "RIGHT")
    else:
        print(f"{prefix}  RIGHT: [Empty]")

def main():
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    
    try:
        print("=" * 80)
        print("BINARY TREE STRUCTURE ANALYSIS")
        print("=" * 80)
        print()
        
        # Get all users with their positions
        cursor.execute("""
            SELECT id, username, name, sponsor_id, position, 
                   left_child_id, right_child_id, is_active
            FROM users
            ORDER BY id
        """)
        users = cursor.fetchall()
        
        print(f"📊 Total Users: {len(users)}")
        print()
        
        # Find root users (users without sponsor or with position NULL/root)
        cursor.execute("""
            SELECT id, username, name FROM users 
            WHERE sponsor_id IS NULL OR position IS NULL OR position = 'root'
            ORDER BY id
        """)
        roots = cursor.fetchall()
        
        print("=" * 80)
        print("ROOT USERS (No Sponsor)")
        print("=" * 80)
        for root in roots:
            print(f"ID: {root['id']} | @{root['username']} | {root['name']}")
        print()
        
        # For each root, analyze their tree
        for root in roots:
            print("=" * 80)
            print(f"TREE FOR: @{root['username']} (ID: {root['id']})")
            print("=" * 80)
            print()
            
            # Get direct children counts
            cursor.execute("""
                SELECT COUNT(*) as count FROM users WHERE sponsor_id = %s
            """, (root['id'],))
            direct_refs = cursor.fetchone()['count']
            
            team_size = count_team(cursor, root['id'])
            
            print(f"📍 Direct Referrals: {direct_refs}")
            print(f"👥 Total Team Size: {team_size}")
            print()
            
            # Find extreme positions
            cursor.execute("""
                SELECT left_child_id, right_child_id FROM users WHERE id = %s
            """, (root['id'],))
            root_data = cursor.fetchone()
            
            if root_data['left_child_id']:
                extreme_left = get_extreme_left(cursor, root_data['left_child_id'])
                print(f"⬅️  EXTREME LEFT: @{extreme_left['username']} ({extreme_left['name']}) | Depth: {extreme_left['depth'] + 1}")
            else:
                print("⬅️  EXTREME LEFT: [Empty]")
            
            if root_data['right_child_id']:
                extreme_right = get_extreme_right(cursor, root_data['right_child_id'])
                print(f"➡️  EXTREME RIGHT: @{extreme_right['username']} ({extreme_right['name']}) | Depth: {extreme_right['depth'] + 1}")
            else:
                print("➡️  EXTREME RIGHT: [Empty]")
            
            print()
            print("🌳 TREE STRUCTURE:")
            print("-" * 80)
            print_tree_recursive(cursor, root['id'])
            print()
        
        # Show position distribution
        print("=" * 80)
        print("POSITION DISTRIBUTION")
        print("=" * 80)
        cursor.execute("""
            SELECT 
                position,
                COUNT(*) as count
            FROM users
            WHERE position IS NOT NULL
            GROUP BY position
            ORDER BY position
        """)
        positions = cursor.fetchall()
        
        for pos in positions:
            print(f"{pos['position']}: {pos['count']} users")
        print()
        
        # Check for placement issues
        print("=" * 80)
        print("CHECKING FOR PLACEMENT ISSUES")
        print("=" * 80)
        
        # Users with position but no sponsor
        cursor.execute("""
            SELECT id, username, position
            FROM users
            WHERE position IS NOT NULL 
            AND position != 'root'
            AND sponsor_id IS NULL
        """)
        orphans = cursor.fetchall()
        
        if orphans:
            print("⚠️  Users with position but no sponsor:")
            for orphan in orphans:
                print(f"   - @{orphan['username']} (position: {orphan['position']})")
        else:
            print("✅ No orphaned users found")
        print()
        
        # Users not connected as children
        cursor.execute("""
            SELECT u.id, u.username, u.position, u.sponsor_id, s.username as sponsor_name
            FROM users u
            LEFT JOIN users s ON u.sponsor_id = s.id
            WHERE u.position IS NOT NULL 
            AND u.position != 'root'
            AND u.id NOT IN (
                SELECT left_child_id FROM users WHERE left_child_id IS NOT NULL
                UNION
                SELECT right_child_id FROM users WHERE right_child_id IS NOT NULL
            )
        """)
        disconnected = cursor.fetchall()
        
        if disconnected:
            print("⚠️  Users not connected as children:")
            for disc in disconnected:
                print(f"   - @{disc['username']} (position: {disc['position']}, sponsor: @{disc['sponsor_name'] if disc['sponsor_name'] else 'None'})")
        else:
            print("✅ All users properly connected")
        print()
        
        print("=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
