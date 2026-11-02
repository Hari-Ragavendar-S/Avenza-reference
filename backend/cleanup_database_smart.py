#!/usr/bin/env python3
"""
Smart Database Cleanup Script for Avenza
Automatically detects all tables and their dependencies
Keeps: Admin credentials, Mother ID user (avenza)
Deletes: All other users and ALL transaction/income data
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def get_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def cleanup_database():
    """Clean database - keep only admin and mother ID user"""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("=" * 60)
        print("AVENZA DATABASE CLEANUP - SMART MODE")
        print("=" * 60)
        print()
        print("WILL DELETE:")
        print("  ❌ All users except 'avenza'")
        print("  ❌ ALL transaction data (for everyone including avenza)")
        print("  ❌ Reset avenza user balances to $0")
        print("  ❌ Reset admin wallet balances to $0")
        print()
        print("WILL KEEP:")
        print("  ✅ Admin login credentials")
        print("  ✅ User 'avenza' login credentials")
        print("  ✅ Investment plans/packages")
        print("  ✅ Binary matching tiers")
        print("  ✅ Admin settings")
        print()
        
        # Get mother ID user
        cursor.execute("SELECT id, username, email FROM users WHERE username = 'avenza' LIMIT 1")
        mother_user = cursor.fetchone()
        
        if not mother_user:
            print("❌ Mother ID user 'avenza' not found!")
            return
        
        mother_id = mother_user['id']
        print(f"✅ Found Mother ID: {mother_id} ({mother_user['username']} - {mother_user['email']})")
        print()
        
        # Confirm deletion
        confirm = input("⚠️  This will delete ALL data including avenza user data. Continue? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Cleanup cancelled")
            return
        
        print()
        print("🧹 Starting cleanup...")
        print()
        
        # Strategy: Disable foreign key checks temporarily, delete all, re-enable
        # This is safer than trying to figure out the correct order
        
        # Get all tables (exclude system tables and tables to keep)
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT IN ('admins', 'users', 'investment_plans', 'investment_packages', 'packages', 'plans', 'binary_matching_tiers', 'admin_settings', 'system_settings')
            ORDER BY tablename
        """)
        tables_to_truncate = [row['tablename'] for row in cursor.fetchall()]
        
        print(f"Found {len(tables_to_truncate)} tables to clean")
        print()
        
        # Truncate all tables except admins and users with CASCADE
        for table in tables_to_truncate:
            try:
                cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
                print(f"✅ Truncated {table}")
            except Exception as e:
                print(f"⚠️  Could not truncate {table}: {e}")
        
        # Reset avenza user - Get actual columns first, then reset
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN (
                'avenza_balance', 'income_balance', 'gaming_balance',
                'left_business', 'right_business', 'total_matched',
                'pending_left', 'pending_right', 'matching_bonus_earned',
                'total_referral_bonus', 'total_level_income',
                'left_child_id', 'right_child_id', 'sponsor_id', 
                'referred_by', 'last_matched_at'
            )
        """)
        existing_columns = [row['column_name'] for row in cursor.fetchall()]
        
        # Build UPDATE statement only for existing columns
        updates = []
        if 'avenza_balance' in existing_columns:
            updates.append('avenza_balance = 0')
        if 'income_balance' in existing_columns:
            updates.append('income_balance = 0')
        if 'gaming_balance' in existing_columns:
            updates.append('gaming_balance = 0')
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
        if 'total_referral_bonus' in existing_columns:
            updates.append('total_referral_bonus = 0')
        if 'total_level_income' in existing_columns:
            updates.append('total_level_income = 0')
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
            update_sql = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(update_sql, (mother_id,))
            print(f"✅ Reset avenza user: All balances set to $0, relationships cleared")
        else:
            print("⚠️  No columns to reset")
        
        # Reset admin wallet balances too (if admin_wallet_balance column exists)
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            AND column_name IN ('wallet_balance', 'balance', 'admin_wallet_balance')
        """)
        admin_balance_columns = [row['column_name'] for row in cursor.fetchall()]
        
        if admin_balance_columns:
            admin_updates = [f"{col} = 0" for col in admin_balance_columns]
            admin_update_sql = f"UPDATE admins SET {', '.join(admin_updates)}"
            cursor.execute(admin_update_sql)
            print(f"✅ Reset admin wallet balances to $0")
        
        # Delete all other users (keep only avenza)
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE id != %s", (mother_id,))
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM users WHERE id != %s", (mother_id,))
        print(f"✅ Deleted {count} other user(s)")
        
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
        
        cursor.execute("SELECT COUNT(*) as count FROM admins")
        print(f"Admins: {cursor.fetchone()['count']}")
        
        # Check remaining records in key tables
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('withdrawals', 'deposits', 'transactions', 'user_investments', 'referral_bonuses')
        """)
        key_tables = [row['tablename'] for row in cursor.fetchall()]
        
        for table in key_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                print(f"{table.capitalize()}: {cursor.fetchone()['count']}")
            except:
                pass
        
        print()
        print("Remaining user:")
        cursor.execute("SELECT id, username, email, avenza_balance, income_balance FROM users")
        user = cursor.fetchone()
        print(f"  ID: {user['id']}")
        print(f"  Username: {user['username']}")
        print(f"  Email: {user['email']}")
        print(f"  Avenza Balance: ${user['avenza_balance']}")
        print(f"  Income Balance: ${user['income_balance']}")
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
