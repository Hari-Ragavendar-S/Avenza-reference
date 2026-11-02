#!/usr/bin/env python3
"""
Client Delivery Cleanup Script
Keeps: Admin credentials, Mother ID user (@avenza only)
Deletes: ALL other users including @gold
Preserves: Investment packages, Binary matching tiers, Config tables
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
        print("CLIENT DELIVERY DATABASE CLEANUP")
        print("=" * 60)
        print()
        print("WILL DELETE:")
        print("  ❌ ALL users except '@avenza' (including @gold)")
        print("  ❌ ALL transaction data")
        print("  ❌ Reset @avenza user balances to $0")
        print()
        print("WILL KEEP:")
        print("  ✅ Admin login credentials")
        print("  ✅ User '@avenza' (9999) login only")
        print("  ✅ Investment packages (plans)")
        print("  ✅ Binary matching tiers")
        print("  ✅ Referral/Level config")
        print("  ✅ System settings")
        print()
        
        # Get mother ID user (ONLY avenza)
        cursor.execute("SELECT id, username, email, referral_code FROM users WHERE username = 'avenza' LIMIT 1")
        mother_user = cursor.fetchone()
        
        if not mother_user:
            print("❌ Mother ID user 'avenza' not found!")
            return
        
        mother_id = mother_user['id']
        print(f"✅ Found Mother ID: {mother_id} (@{mother_user['username']} - Code: {mother_user['referral_code']})")
        
        # Count users to delete
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE id != %s", (mother_id,))
        delete_count = cursor.fetchone()['count']
        print(f"🗑️  Will delete {delete_count} users (including @gold)")
        print()
        
        # Confirm deletion
        confirm = input("⚠️  Type 'DELETE' to proceed: ")
        if confirm != 'DELETE':
            print("❌ Cleanup cancelled")
            return
        
        print()
        print("🧹 Starting cleanup...")
        print()
        
        # Get all tables to truncate (exclude config tables)
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT IN (
                'admins', 
                'users', 
                'investment_packages', 
                'binary_matching_tiers', 
                'referral_bonus_config',
                'level_income_config',
                'admin_settings', 
                'system_settings'
            )
            ORDER BY tablename
        """)
        tables_to_truncate = [row['tablename'] for row in cursor.fetchall()]
        
        print(f"🗑️  Truncating {len(tables_to_truncate)} transaction tables...")
        
        # Truncate all transaction tables with CASCADE (with timeout)
        for table in tables_to_truncate:
            try:
                # Set statement timeout to 5 seconds
                cursor.execute("SET statement_timeout = '5s'")
                cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
                cursor.execute("SET statement_timeout = 0")
                print(f"  ✅ {table}")
            except Exception as e:
                cursor.execute("SET statement_timeout = 0")
                print(f"  ⏭️  Skipped {table} (timeout or locked)")
        
        print()
        
        # Reset avenza user - Get actual columns first
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN (
                'balance', 'avenza_balance', 'income_balance', 'gaming_balance',
                'left_business', 'right_business', 'total_matched',
                'pending_left', 'pending_right', 'matching_bonus_earned',
                'total_referral_bonus', 'total_level_income', 'downline_matching_earned',
                'left_child_id', 'right_child_id', 'sponsor_id', 
                'referred_by', 'last_matched_at'
            )
        """)
        existing_columns = [row['column_name'] for row in cursor.fetchall()]
        
        # Build UPDATE statement only for existing columns
        updates = []
        
        # Balance columns
        for col in ['balance', 'avenza_balance', 'income_balance', 'gaming_balance']:
            if col in existing_columns:
                updates.append(f'{col} = 0')
        
        # Binary matching columns
        for col in ['left_business', 'right_business', 'total_matched', 'pending_left', 'pending_right', 'matching_bonus_earned']:
            if col in existing_columns:
                updates.append(f'{col} = 0')
        
        # Income tracking columns
        for col in ['total_referral_bonus', 'total_level_income', 'downline_matching_earned']:
            if col in existing_columns:
                updates.append(f'{col} = 0')
        
        # FK columns
        for col in ['left_child_id', 'right_child_id', 'sponsor_id', 'referred_by']:
            if col in existing_columns:
                updates.append(f'{col} = NULL')
        
        # Timestamp columns
        if 'last_matched_at' in existing_columns:
            updates.append('last_matched_at = NULL')
        
        if updates:
            update_sql = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(update_sql, (mother_id,))
            print(f"✅ Reset @avenza user: All balances = $0, relationships cleared")
        
        # Delete ALL other users (including @gold)
        print(f"\n🗑️  Deleting {delete_count} users...")
        cursor.execute("DELETE FROM users WHERE id != %s", (mother_id,))
        print(f"✅ Deleted {cursor.rowcount} user(s)")
        
        # Commit all changes
        conn.commit()
        
        print()
        print("=" * 60)
        print("✅ CLEANUP COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        
        # Show final state
        print("📊 Final Database Summary:")
        print("-" * 60)
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        print(f"Total Users: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM admins")
        print(f"Admins: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM investment_packages")
        print(f"Investment Packages: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_tiers")
        print(f"Binary Matching Tiers: {cursor.fetchone()['count']}")
        
        try:
            cursor.execute("SELECT COUNT(*) as count FROM referral_bonus_config")
            print(f"Referral Bonus Config: {cursor.fetchone()['count']}")
        except:
            pass
        
        try:
            cursor.execute("SELECT COUNT(*) as count FROM level_income_config")
            print(f"Level Income Config: {cursor.fetchone()['count']}")
        except:
            pass
        
        print()
        print("👤 Remaining User:")
        cursor.execute("SELECT id, username, email, referral_code FROM users")
        user = cursor.fetchone()
        print(f"  ID: {user['id']}")
        print(f"  Username: @{user['username']}")
        print(f"  Email: {user['email']}")
        print(f"  Referral Code: {user['referral_code']}")
        print()
        
        print("🎉 Database is ready for client delivery!")
        print()
        print("📝 Next Steps:")
        print("  1. Verify @avenza login works")
        print("  2. Check admin login works")
        print("  3. Backup database: pg_dump avenzaweb > backup.sql")
        print("  4. Deploy to production")
        
    except Exception as e:
        conn.rollback()
        print()
        print(f"❌ Error during cleanup: {e}")
        print("❌ Changes rolled back")
        import traceback
        traceback.print_exc()
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup_database()
