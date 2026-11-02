"""
Sync Existing Users to Binary Tree
Sets positions for users who don't have positions assigned
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        cursor_factory=RealDictCursor
    )

def sync_existing_users():
    """Sync existing users to binary tree structure"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("\n" + "="*60)
        print("🔄 SYNCING EXISTING USERS TO BINARY TREE")
        print("="*60 + "\n")
        
        # Get all users who have sponsors but no position set
        cursor.execute("""
            SELECT id, username, sponsor_id, left_child_id, right_child_id
            FROM users
            WHERE sponsor_id IS NOT NULL
            AND position IS NULL
            ORDER BY id ASC
        """)
        
        users_to_sync = cursor.fetchall()
        
        if not users_to_sync:
            print("✅ All users already have positions assigned!")
            return
        
        print(f"Found {len(users_to_sync)} users without positions\n")
        
        synced_count = 0
        skipped_count = 0
        
        for user in users_to_sync:
            user_id = user['id']
            username = user['username']
            sponsor_id = user['sponsor_id']
            
            print(f"📝 Processing user: {username} (ID: {user_id})")
            
            # Get sponsor's current children
            cursor.execute("""
                SELECT left_child_id, right_child_id
                FROM users WHERE id = %s
            """, (sponsor_id,))
            
            sponsor = cursor.fetchone()
            if not sponsor:
                print(f"   ⚠️  Sponsor not found, skipping...")
                skipped_count += 1
                continue
            
            # Determine available position
            position = None
            if not sponsor['left_child_id']:
                position = 'left'
            elif not sponsor['right_child_id']:
                position = 'right'
            else:
                print(f"   ⚠️  Both positions occupied for sponsor {sponsor_id}, skipping...")
                skipped_count += 1
                continue
            
            # Update user's position
            cursor.execute("""
                UPDATE users SET position = %s WHERE id = %s
            """, (position, user_id))
            
            # Update sponsor's child reference
            if position == 'left':
                cursor.execute("""
                    UPDATE users SET left_child_id = %s WHERE id = %s
                """, (user_id, sponsor_id))
            else:
                cursor.execute("""
                    UPDATE users SET right_child_id = %s WHERE id = %s
                """, (user_id, sponsor_id))
            
            print(f"   ✅ Assigned to {position.upper()} position of sponsor {sponsor_id}")
            synced_count += 1
        
        conn.commit()
        
        print("\n" + "="*60)
        print("✅ SYNC COMPLETE!")
        print(f"   Users Synced: {synced_count}")
        print(f"   Users Skipped: {skipped_count}")
        print("="*60 + "\n")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during sync: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    sync_existing_users()
