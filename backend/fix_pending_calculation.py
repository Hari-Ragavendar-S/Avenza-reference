"""
Fix Pending Calculation Bug
Recalculates pending_left and pending_right for all users based on actual business volumes
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def fix_pending_calculations():
    """Recalculate pending for all users"""
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    cursor = conn.cursor()
    
    try:
        print("🔧 Fixing pending_left and pending_right calculations...")
        print("=" * 60)
        
        # Get all users with binary business
        cursor.execute("""
            SELECT id, username, left_business, right_business, 
                   pending_left, pending_right, total_matched
            FROM users
            WHERE left_business > 0 OR right_business > 0
            ORDER BY id
        """)
        
        users = cursor.fetchall()
        print(f"📊 Found {len(users)} users with binary business\n")
        
        fixed_count = 0
        
        for user in users:
            user_id = user['id']
            username = user['username']
            left_business = Decimal(user['left_business'] or 0)
            right_business = Decimal(user['right_business'] or 0)
            old_pending_left = Decimal(user['pending_left'] or 0)
            old_pending_right = Decimal(user['pending_right'] or 0)
            total_matched = Decimal(user['total_matched'] or 0)
            
            # Calculate correct pending values
            # Pending = unmatched business waiting for the other leg to catch up
            # The SMALLER leg has 0 pending (it's fully matched)
            # The LARGER leg has pending = difference between legs
            if left_business > right_business:
                new_pending_left = left_business - right_business
                new_pending_right = Decimal(0)
            elif right_business > left_business:
                new_pending_left = Decimal(0)
                new_pending_right = right_business - left_business
            else:
                # Both equal, no pending
                new_pending_left = Decimal(0)
                new_pending_right = Decimal(0)
            
            # Only update if values changed
            if new_pending_left != old_pending_left or new_pending_right != old_pending_right:
                cursor.execute("""
                    UPDATE users
                    SET pending_left = %s,
                        pending_right = %s
                    WHERE id = %s
                """, (new_pending_left, new_pending_right, user_id))
                
                print(f"✅ Fixed @{username}:")
                print(f"   Left: ${left_business:,.2f} | Right: ${right_business:,.2f} | Matched: ${total_matched:,.2f}")
                print(f"   Old Pending: L=${old_pending_left:,.2f} | R=${old_pending_right:,.2f}")
                print(f"   New Pending: L=${new_pending_left:,.2f} | R=${new_pending_right:,.2f}")
                print()
                
                fixed_count += 1
        
        conn.commit()
        
        print("=" * 60)
        print(f"✅ Fixed {fixed_count} users")
        print(f"✅ Skipped {len(users) - fixed_count} users (already correct)")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_pending_calculations()
