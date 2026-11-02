#!/usr/bin/env python3
"""
Database Cleanup Script for Avenza
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
        print("AVENZA DATABASE CLEANUP")
        print("=" * 60)
        print()
        print("WILL DELETE:")
        print("  ❌ All users except 'avenza'")
        print("  ❌ ALL transaction data (for everyone including avenza)")
        print("  ❌ Reset avenza user balances to $0")
        print()
        print("WILL KEEP:")
        print("  ✅ Admin login credentials")
        print("  ✅ User 'avenza' login credentials")
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
        
        # IMPORTANT: Delete in correct order due to foreign key constraints
        
        # 1. Delete level_income_transactions FIRST (has FK to user_investments)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM level_income_transactions")
            count = cursor.fetchone()['count']
            cursor.execute("DELETE FROM level_income_transactions")
            print(f"✅ Deleted {count} level income transaction(s)")
        except Exception:
            print("ℹ️  level_income_transactions table not found")
        
        # 2. Delete withdrawal logs
        try:
            cursor.execute("SELECT COUNT(*) as count FROM withdrawal_logs")
            count = cursor.fetchone()['count']
            cursor.execute("DELETE FROM withdrawal_logs")
            print(f"✅ Deleted {count} withdrawal log(s)")
        except Exception:
            pass
        
        # 3. Delete withdrawals
        cursor.execute("SELECT COUNT(*) as count FROM withdrawals")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM withdrawals")
        print(f"✅ Deleted {count} withdrawal(s)")
        
        # 4. Delete deposits
        cursor.execute("SELECT COUNT(*) as count FROM deposits")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM deposits")
        print(f"✅ Deleted {count} deposit(s)")
        
        # 5. Delete transactions
        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM transactions")
        print(f"✅ Deleted {count} transaction(s)")
        
        # 6. Delete referral bonus claims (BEFORE referral_bonuses - has FK)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM referral_bonus_claims")
            count = cursor.fetchone()['count']
            cursor.execute("DELETE FROM referral_bonus_claims")
            print(f"✅ Deleted {count} referral bonus claim(s)")
        except Exception:
            pass
        
        # 7. Delete referral bonuses (BEFORE user_investments - has FK)
        cursor.execute("SELECT COUNT(*) as count FROM referral_bonuses")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM referral_bonuses")
        print(f"✅ Deleted {count} referral bonus(es)")
        
        # 8. Delete user investments (AFTER level_income_transactions and referral_bonuses)
        cursor.execute("SELECT COUNT(*) as count FROM user_investments")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM user_investments")
        print(f"✅ Deleted {count} investment(s)")
        
        # 9. Delete level income (if exists)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM level_income")
            count = cursor.fetchone()['count']
            cursor.execute("DELETE FROM level_income")
            print(f"✅ Deleted {count} level income record(s)")
        except Exception:
            print("ℹ️  level_income table not found")
        
        # 10. Delete downline matching bonus (if exists)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM downline_matching_bonus")
            count = cursor.fetchone()['count']
            cursor.execute("DELETE FROM downline_matching_bonus")
            print(f"✅ Deleted {count} downline matching bonus(es)")
        except Exception:
            pass
        
        # 10. Delete binary matching history
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_history")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM binary_matching_history")
        print(f"✅ Deleted {count} binary matching record(s)")
        
        # 11. Delete binary matching claims
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_claims")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM binary_matching_claims")
        print(f"✅ Deleted {count} binary matching claim(s)")
        
        # 12. Delete internal transfers
        cursor.execute("SELECT COUNT(*) as count FROM internal_transfers")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM internal_transfers")
        print(f"✅ Deleted {count} internal transfer(s)")
        
        # 13. Delete support tickets
        cursor.execute("SELECT COUNT(*) as count FROM support_tickets")
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM support_tickets")
        print(f"✅ Deleted {count} support ticket(s)")
        
        # 14. Delete wallet nonces (except mother ID)
        cursor.execute("SELECT COUNT(*) as count FROM wallet_nonces WHERE wallet_address NOT IN (SELECT wallet_address FROM users WHERE id = %s)", (mother_id,))
        count = cursor.fetchone()['count']
        cursor.execute("DELETE FROM wallet_nonces WHERE wallet_address NOT IN (SELECT wallet_address FROM users WHERE id = %s)", (mother_id,))
        print(f"✅ Deleted {count} wallet nonce(s)")
        
        # 15. Reset avenza user - ZERO balances, clear all data
        cursor.execute("""
            UPDATE users SET 
                avenza_balance = 0,
                income_balance = 0,
                gaming_balance = 0,
                left_business = 0,
                right_business = 0,
                total_matched = 0,
                pending_left = 0,
                pending_right = 0,
                matching_bonus_earned = 0,
                total_referral_bonus = 0,
                total_level_income = 0,
                left_child_id = NULL,
                right_child_id = NULL,
                sponsor_id = NULL,
                last_matched_at = NULL
            WHERE id = %s
        """, (mother_id,))
        print(f"✅ Reset avenza user: All balances set to $0, relationships cleared")
        
        # 16. Delete all other users (keep only avenza)
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
        
        cursor.execute("SELECT COUNT(*) as count FROM withdrawals")
        print(f"Withdrawals: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM deposits")
        print(f"Deposits: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        print(f"Transactions: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM user_investments")
        print(f"Investments: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM referral_bonuses")
        print(f"Referral Bonuses: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM level_income")
        print(f"Level Income: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_history")
        print(f"Binary Matching: {cursor.fetchone()['count']}")
        
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
        
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup_database()
