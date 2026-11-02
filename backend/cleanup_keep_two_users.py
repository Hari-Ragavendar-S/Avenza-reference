#!/usr/bin/env python3
"""
Database Cleanup - Keep avenza and gold users
Uses TRUNCATE CASCADE approach from cleanup_database_smart.py
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import sys

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def get_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def cleanup_database():
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("=" * 60)
        print("AVENZA DATABASE CLEANUP - KEEP TWO USERS")
        print("=" * 60)
        print()
        
        # Get users to keep
        cursor.execute("SELECT id, username, email, referral_code FROM users WHERE username IN ('avenza', 'gold') OR referral_code = '9999' ORDER BY id")
        keep_users = cursor.fetchall()
        
        if not keep_users:
            print("❌ Users 'avenza' or 'gold' not found!")
            return
        
        keep_ids = [u['id'] for u in keep_users]
        
        print(f"✅ Will keep {len(keep_users)} user(s):")
        for u in keep_users:
            print(f"   ID {u['id']}: @{u['username']} ({u['email']}) Code: {u['referral_code']}")
        print()
        
        cursor.execute("SELECT COUNT(*) as c FROM users WHERE id NOT IN %s", (tuple(keep_ids),))
        delete_count = cursor.fetchone()['c']
        print(f"🗑️  Will delete {delete_count} users")
        print()
        
        confirm = input("⚠️  Type 'yes' to proceed: ")
        if confirm.lower() != 'yes':
            print("❌ Cleanup cancelled")
            return
        
        print()
        print("🧹 Starting cleanup...")
        print()
        
        # Get all transaction tables to truncate
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT IN (
                'admins', 'users', 
                'investment_packages', 'packages', 'plans',
                'binary_matching_tiers',
                'referral_bonus_config',
                'level_income_config',
                'admin_settings', 'system_settings'
            )
            ORDER BY tablename
        """)
        tables_to_truncate = [row['tablename'] for row in cursor.fetchall()]
        
        print(f"📋 Found {len(tables_to_truncate)} tables to truncate")
        print()
        
        # Truncate all transaction tables
        for table in tables_to_truncate:
            try:
                cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
                print(f"  ✅ Truncated {table}")
            except Exception as e:
                print(f"  ⚠️  {table}: {str(e)[:50]}")
        
        print()
        print("✅ All transaction data deleted")
        
        # Now delete other users (safe since all transactions truncated)
        print()
        print("🗑️  Deleting other users...")
        cursor.execute("DELETE FROM users WHERE id NOT IN %s", (tuple(keep_ids),))
        deleted = cursor.rowcount
        print(f"✅ Deleted {deleted} users")
        
        # Reset avenza user
        print()
        print("🔧 Resetting kept users...")
        
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN (
                'left_business', 'right_business', 'total_matched',
                'pending_left', 'pending_right', 'matching_bonus_earned',
                'left_child_id', 'right_child_id', 'sponsor_id', 
                'referred_by', 'last_matched_at'
            )
        """)
        existing_columns = [row['column_name'] for row in cursor.fetchall()]
        
        updates = []
        if 'left_business' in existing_columns:
            updates.append('left_business = 0')
        if 'right_business' in existing_columns:
            updates.append('right_business = 0')
        if 'total_matched' in existing_columns:
            updates.append('total_matched = 0')
        if 'pending_left' in existing_columns:
            updates.append('pending_left = 0')
        if 'pending_right' in existing_columns:
            updates.append('pending_right = 0')
        if 'matching_bonus_earned' in existing_columns:
            updates.append('matching_bonus_earned = 0')
        if 'left_child_id' in existing_columns:
            updates.append('left_child_id = NULL')
        if 'right_child_id' in existing_columns:
            updates.append('right_child_id = NULL')
        if 'sponsor_id' in existing_columns:
            updates.append('sponsor_id = NULL')
        if 'referred_by' in existing_columns:
            updates.append('referred_by = NULL')
        if 'last_matched_at' in existing_columns:
            updates.append('last_matched_at = NULL')
        
        if updates:
            update_sql = f"UPDATE users SET {', '.join(updates)} WHERE username = 'avenza'"
            cursor.execute(update_sql)
            print("✅ Reset avenza user")
        
        # Commit all changes
        conn.commit()
        
        print()
        print("=" * 60)
        print("✅ CLEANUP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        
        # Show final state
        print("📊 Database Summary:")
        print("-" * 60)
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        print(f"Users: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM user_investments")
        print(f"Investments: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        print(f"Transactions: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM investment_packages")
        print(f"Packages: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_tiers")
        print(f"Binary Tiers: {cursor.fetchone()['count']}")
        
        print()
        print("Remaining users:")
        cursor.execute("SELECT id, username, email, referral_code FROM users ORDER BY id")
        for user in cursor.fetchall():
            print(f"  ID {user['id']}: @{user['username']} ({user['email']}) Code: {user['referral_code']}")
        print()
        
        print("✅ Database is now clean and ready for client delivery!")
        
    except Exception as e:
        conn.rollback()
        print()
        print(f"❌ Error during cleanup: {e}")
        print("❌ Changes rolled back - database unchanged")
        import traceback
        traceback.print_exc()
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup_database()
