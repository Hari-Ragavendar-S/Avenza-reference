#!/usr/bin/env python3
"""
Backfill script to recalculate downline matching bonuses with daily $220 cap
This will:
1. Get all history entries grouped by user and date
2. Recalculate with daily cap
3. Update user balances
4. Update history entries
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import datetime

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

MAX_BONUS_PER_DAY = Decimal('220')

def main():
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("=" * 80)
        print("BACKFILLING DOWNLINE MATCHING BONUSES WITH DAILY CAP")
        print("=" * 80)
        
        # Get all history entries grouped by user and date
        print("\n1. Fetching all downline matching bonus history...")
        cursor.execute("""
            SELECT 
                id, user_id, downline_user_id, match_amount,
                user_package_amount, bonus_percentage,
                calculated_bonus, user_received, admin_received,
                created_at,
                DATE(created_at AT TIME ZONE 'Asia/Kolkata') as match_date
            FROM downline_matching_bonus_history
            ORDER BY user_id, created_at
        """)
        
        all_entries = cursor.fetchall()
        print(f"   Found {len(all_entries)} total entries")
        
        # Group by user and date
        user_daily_entries = {}
        for entry in all_entries:
            user_id = entry['user_id']
            match_date = entry['match_date']
            key = (user_id, match_date)
            
            if key not in user_daily_entries:
                user_daily_entries[key] = []
            user_daily_entries[key].append(entry)
        
        print(f"   Grouped into {len(user_daily_entries)} user-date combinations")
        
        # Track changes
        total_users_affected = set()
        total_entries_updated = 0
        total_balance_adjustment = Decimal('0')
        
        print("\n2. Recalculating with daily cap...")
        
        for (user_id, match_date), entries in user_daily_entries.items():
            print(f"\n   User {user_id} on {match_date}:")
            print(f"      {len(entries)} matches")
            
            daily_total = Decimal('0')
            
            for i, entry in enumerate(entries, 1):
                old_user_received = Decimal(str(entry['user_received']))
                calculated_bonus = Decimal(str(entry['calculated_bonus']))
                
                # Calculate new amount with daily cap
                remaining_limit = MAX_BONUS_PER_DAY - daily_total
                
                if remaining_limit <= 0:
                    new_user_received = Decimal('0')
                elif calculated_bonus > remaining_limit:
                    new_user_received = remaining_limit
                else:
                    new_user_received = calculated_bonus
                
                new_admin_received = calculated_bonus - new_user_received
                daily_total += new_user_received
                
                # Calculate adjustment
                adjustment = new_user_received - old_user_received
                
                if adjustment != 0:
                    print(f"      Match {i}: Old ${old_user_received} → New ${new_user_received} (Adjustment: ${adjustment})")
                    
                    # Update history entry
                    cursor.execute("""
                        UPDATE downline_matching_bonus_history
                        SET user_received = %s,
                            admin_received = %s
                        WHERE id = %s
                    """, (new_user_received, new_admin_received, entry['id']))
                    
                    total_entries_updated += 1
                    total_balance_adjustment += adjustment
                    total_users_affected.add(user_id)
                else:
                    print(f"      Match {i}: No change (${old_user_received})")
            
            print(f"      Daily total: ${daily_total}")
        
        # Recalculate user balances
        print("\n3. Recalculating user balances...")
        
        for user_id in total_users_affected:
            # Get new total from history
            cursor.execute("""
                SELECT COALESCE(SUM(user_received), 0) as new_total
                FROM downline_matching_bonus_history
                WHERE user_id = %s
            """, (user_id,))
            
            new_total = Decimal(str(cursor.fetchone()['new_total']))
            
            # Update user's downline_matching_earned
            cursor.execute("""
                UPDATE users
                SET downline_matching_earned = %s
                WHERE id = %s
                RETURNING username, income_balance, downline_matching_earned
            """, (new_total, user_id))
            
            user = cursor.fetchone()
            print(f"   User {user_id} (@{user['username']}): Updated to ${new_total}")
        
        # Show summary
        print("\n" + "=" * 80)
        print("BACKFILL SUMMARY")
        print("=" * 80)
        print(f"Total entries processed: {len(all_entries)}")
        print(f"Entries updated: {total_entries_updated}")
        print(f"Users affected: {len(total_users_affected)}")
        print(f"Total balance adjustment: ${total_balance_adjustment}")
        
        # Show before/after for each affected user
        print("\n📊 User-by-User Summary:")
        for user_id in sorted(total_users_affected):
            cursor.execute("""
                SELECT username, downline_matching_earned
                FROM users
                WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
            
            cursor.execute("""
                SELECT 
                    DATE(created_at AT TIME ZONE 'Asia/Kolkata') as date,
                    COUNT(*) as matches,
                    SUM(user_received) as daily_total
                FROM downline_matching_bonus_history
                WHERE user_id = %s
                GROUP BY DATE(created_at AT TIME ZONE 'Asia/Kolkata')
                ORDER BY date DESC
            """, (user_id,))
            
            daily_totals = cursor.fetchall()
            
            print(f"\n   @{user['username']} (ID: {user_id}):")
            print(f"      Total earned: ${user['downline_matching_earned']}")
            print(f"      Daily breakdown:")
            for day in daily_totals:
                print(f"         {day['date']}: {day['matches']} matches → ${day['daily_total']}")
        
        # Ask for confirmation
        print("\n" + "=" * 80)
        print("⚠️  REVIEW THE CHANGES ABOVE")
        print("=" * 80)
        response = input("\nDo you want to COMMIT these changes? (yes/no): ")
        
        if response.lower() == 'yes':
            conn.commit()
            print("\n✅ Changes committed successfully!")
            print("\nNext steps:")
            print("1. Restart backend: sudo systemctl restart avenza")
            print("2. Test new matches to verify daily cap works")
        else:
            conn.rollback()
            print("\n❌ Changes rolled back. No data was modified.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
