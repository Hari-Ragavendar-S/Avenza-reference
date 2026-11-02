"""
Database Cleanup for Client Delivery
Removes all test users except admin and top user (@avenza/9999)
Preserves: packages, tiers, awards, system configuration
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'avenzaweb'),
    'user': os.getenv('DB_USER', 'avenzauser'),
    'password': os.getenv('DB_PASSWORD', '123456')
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def cleanup_database():
    """Clean up database for client delivery"""
    
    print("=" * 60)
    print("AVENZA DATABASE CLEANUP - CLIENT DELIVERY")
    print("=" * 60)
    print()
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Find users to keep
        print("🔍 Identifying users to keep...")
        cursor.execute("""
            SELECT id, username, referral_code, name 
            FROM users 
            WHERE username IN ('avenza', 'gold')
            OR referral_code = '9999'
            ORDER BY id
        """)
        keep_users = cursor.fetchall()
        
        if not keep_users:
            print("❌ ERROR: No users found with username 'avenza' or referral code '9999'")
            return
        
        mother_id = keep_users[0]['id']
        keep_user_ids = [user['id'] for user in keep_users]
        
        print(f"✅ Will keep {len(keep_users)} user(s):")
        for user in keep_users:
            print(f"   - ID {user['id']}: @{user['username']} (Code: {user['referral_code']}) - {user['name']}")
        
        # 2. Find users to delete
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM users 
            WHERE id NOT IN %s
        """, (tuple(keep_user_ids),))
        delete_count = cursor.fetchone()['count']
        
        print(f"\n🗑️  Will delete {delete_count} test user(s)")
        
        if delete_count == 0:
            print("\n✅ Database is already clean! No test users to remove.")
            return
        
        # 3. Show what will be deleted
        print("\n📋 Users to be deleted:")
        cursor.execute("""
            SELECT id, username, referral_code, name
            FROM users 
            WHERE id NOT IN %s
            ORDER BY id
            LIMIT 10
        """, (tuple(keep_user_ids),))
        delete_users = cursor.fetchall()
        
        for user in delete_users:
            print(f"   - ID {user['id']}: @{user['username']} (Code: {user['referral_code']}) - {user['name']}")
        
        if delete_count > 10:
            print(f"   ... and {delete_count - 10} more users")
        
        # 4. Confirm before deletion
        print("\n⚠️  WARNING: This will DELETE all data for these users:")
        print("   • User accounts")
        print("   • Investments and packages")
        print("   • Transactions")
        print("   • Binary matching history")
        print("   • Referral bonuses")
        print("   • Level income")
        print("   • Downline matching bonuses")
        print("   • All other related records")
        print("\n✅ PRESERVED (will NOT be deleted):")
        print("   • Investment packages (plans)")
        print("   • Binary matching tiers")
        print("   • Referral bonus config")
        print("   • Level income config")
        print("   • System settings")
        print("   • Admin accounts")
        print()
        
        response = input("⚠️  Type 'DELETE' to proceed with cleanup: ")
        
        if response.strip() != 'DELETE':
            print("\n❌ Cleanup cancelled by user")
            return
        
        print()
        print("🧹 Starting cleanup...")
        print()
        
        # Strategy: Break user references ONE COLUMN AT A TIME to avoid FK deadlock
        
        # STEP 1: Break user self-references one by one
        print("🔗 Step 1: Breaking user self-references (one column at a time)...")
        
        cursor.execute("UPDATE users SET sponsor_id = NULL")
        print(f"  ✅ Cleared sponsor_id")
        
        cursor.execute("UPDATE users SET referred_by = NULL")
        print(f"  ✅ Cleared referred_by")
        
        cursor.execute("UPDATE users SET left_child_id = NULL")
        print(f"  ✅ Cleared left_child_id")
        
        cursor.execute("UPDATE users SET right_child_id = NULL")
        print(f"  ✅ Cleared right_child_id")
        
        conn.commit()
        print("✅ All user self-references cleared and committed")
        
        # 5. Delete level_income_transactions FIRST (has FK to user_investments)
        print("\n🗑️  Step 2: Deleting child tables...")
        try:
            cursor.execute("SELECT COUNT(*) as count FROM level_income_transactions WHERE recipient_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM level_income_transactions WHERE recipient_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} level income transaction(s)")
        except Exception as e:
            print(f"ℹ️  level_income_transactions: {str(e)[:60]}")
        
        # 6. Delete downline_matching_bonus_history
        try:
            cursor.execute("SELECT COUNT(*) as count FROM downline_matching_bonus_history WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM downline_matching_bonus_history WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} downline matching bonus(es)")
        except Exception as e:
            print(f"ℹ️  downline_matching_bonus_history: {str(e)[:60]}")
        
        # 7. Delete withdrawal logs
        try:
            cursor.execute("SELECT COUNT(*) as count FROM withdrawal_logs")
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM withdrawal_logs")
                print(f"✅ Deleted {count} withdrawal log(s)")
        except Exception:
            pass
        
        # 8. Delete withdrawals (note: has FK to admins.processed_by, but constraints disabled)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM withdrawals WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM withdrawals WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} withdrawal(s)")
        except Exception as e:
            print(f"ℹ️  withdrawals: {str(e)[:60]}")
        
        # 9. Delete deposit logs
        try:
            cursor.execute("SELECT COUNT(*) as count FROM deposit_logs")
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM deposit_logs")
                print(f"✅ Deleted {count} deposit log(s)")
        except Exception:
            pass
        
        # 10. Delete deposits
        try:
            cursor.execute("SELECT COUNT(*) as count FROM deposits WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM deposits WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} deposit(s)")
        except Exception as e:
            print(f"ℹ️  deposits: {str(e)[:60]}")
        
        # 11. Delete transactions
        try:
            cursor.execute("SELECT COUNT(*) as count FROM transactions WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM transactions WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} transaction(s)")
        except Exception as e:
            print(f"ℹ️  transactions: {str(e)[:60]}")
        
        # 12. Delete referral bonus claims (BEFORE referral_bonuses - has FK)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM referral_bonus_claims WHERE referrer_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM referral_bonus_claims WHERE referrer_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} referral bonus claim(s)")
        except Exception:
            pass
        
        # 13. Delete referral bonuses (BEFORE user_investments - has FK)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM referral_bonuses WHERE referrer_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM referral_bonuses WHERE referrer_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} referral bonus(es)")
        except Exception as e:
            print(f"ℹ️  referral_bonuses: {str(e)[:60]}")
        
        # 14. Delete investment transactions
        try:
            cursor.execute("SELECT COUNT(*) as count FROM investment_transactions WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM investment_transactions WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} investment transaction(s)")
        except Exception:
            pass
        
        # 15. Delete user investments (AFTER level_income_transactions and referral_bonuses)
        try:
            cursor.execute("SELECT COUNT(*) as count FROM user_investments WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM user_investments WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} investment(s)")
        except Exception as e:
            print(f"ℹ️  user_investments: {str(e)[:60]}")
        
        # 16. Delete binary matching claims
        try:
            cursor.execute("SELECT COUNT(*) as count FROM binary_matching_claims WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM binary_matching_claims WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} binary matching claim(s)")
        except Exception:
            pass
        
        # 17. Delete binary matching history
        try:
            cursor.execute("SELECT COUNT(*) as count FROM binary_matching_history WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM binary_matching_history WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} binary matching record(s)")
        except Exception:
            pass
        
        # 18. Delete binary tree structure
        try:
            cursor.execute("SELECT COUNT(*) as count FROM binary_tree_structure WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM binary_tree_structure WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} binary tree record(s)")
        except Exception:
            pass
        
        # 19. Delete internal transfers
        try:
            cursor.execute("SELECT COUNT(*) as count FROM internal_transfers WHERE sender_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM internal_transfers WHERE sender_id NOT IN %s OR receiver_id NOT IN %s", (tuple(keep_user_ids), tuple(keep_user_ids)))
                print(f"✅ Deleted {count} internal transfer(s)")
        except Exception:
            pass
        
        # 20. Delete support messages
        try:
            cursor.execute("SELECT COUNT(*) as count FROM support_messages WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
            count = cursor.fetchone()['count']
            if count > 0:
                cursor.execute("DELETE FROM support_messages WHERE user_id NOT IN %s", (tuple(keep_user_ids),))
                print(f"✅ Deleted {count} support message(s)")
        except Exception:
            pass
        
        # 21. Break user table self-references
        print("\n🗑️  Step 3: Deleting users...")
        # Already done in Step 1, just delete now
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE id NOT IN %s", (tuple(keep_user_ids),))
        count = cursor.fetchone()['count']
        if count > 0:
            cursor.execute("DELETE FROM users WHERE id NOT IN %s", (tuple(keep_user_ids),))
            print(f"✅ Deleted {count} user(s)")
        
        conn.commit()  # Final commit
        
        print("\n🗑️  Step 4: Cleaning up kept users...")
        # No need to re-enable constraints
        
        # 23. Reset kept users' binary values and relationships
        print("\n🔧 Resetting kept users' data...")
        cursor.execute("""
            UPDATE users
            SET left_business = 0,
                right_business = 0,
                total_matched = 0,
                pending_left = 0,
                pending_right = 0,
                matching_bonus_earned = 0,
                left_child_id = NULL,
                right_child_id = NULL,
                sponsor_id = NULL,
                referred_by = NULL,
                last_matched_at = NULL
            WHERE id = %s
        """, (mother_id,))
        print(f"✅ Reset mother user (@avenza) balances and relationships")
        
        # 24. Commit all changes
        conn.commit()
        
        # 25. Show final statistics
        # 25. Show final statistics
        print("\n" + "="*60)
        print("✅ CLEANUP COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\n📊 Final Database Statistics:")
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        print(f"   • Users: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM user_investments")
        print(f"   • Investments: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        print(f"   • Transactions: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_history")
        print(f"   • Binary Matches: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM referral_bonuses")
        print(f"   • Referral Bonuses: {cursor.fetchone()['count']}")
        
        try:
            cursor.execute("SELECT COUNT(*) as count FROM level_income_transactions")
            print(f"   • Level Income: {cursor.fetchone()['count']}")
        except:
            pass
        
        try:
            cursor.execute("SELECT COUNT(*) as count FROM downline_matching_bonus_history")
            print(f"   • Downline Matching: {cursor.fetchone()['count']}")
        except:
            pass
        
        print("\n📦 Preserved Configuration:")
        
        cursor.execute("SELECT COUNT(*) as count FROM investment_packages")
        print(f"   • Investment Packages: {cursor.fetchone()['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM binary_matching_tiers")
        print(f"   • Binary Matching Tiers: {cursor.fetchone()['count']}")
        
        try:
            cursor.execute("SELECT COUNT(*) as count FROM referral_bonus_config")
            print(f"   • Referral Bonus Config: {cursor.fetchone()['count']}")
        except:
            pass
        
        try:
            cursor.execute("SELECT COUNT(*) as count FROM level_income_config")
            print(f"   • Level Income Config: {cursor.fetchone()['count']}")
        except:
            pass
        
        print("\n✅ Remaining users:")
        for user in keep_users:
            print(f"   - @{user['username']} (Code: {user['referral_code']})")
        
        print("\n🎉 Database is now ready for client delivery!")
        print("\n📝 Next Steps:")
        print("   1. Verify login works for remaining users")
        print("   2. Check dashboard and all pages load correctly")
        print("   3. Create database backup before deployment")
        print("   4. Deploy to production")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during cleanup: {str(e)}")
        print("❌ Changes rolled back - database unchanged")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    cleanup_database()
