#!/usr/bin/env python3
"""
Cleanup Duplicate Referral Bonuses
Removes duplicate bonuses from the same referral (keeps only FIRST investment bonus)
Run this ONCE to clean up the data
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def cleanup_duplicate_bonuses():
    """Remove duplicate bonuses, keep only first investment per referral"""
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("🧹 Starting Duplicate Bonus Cleanup...\n")
        
        # Find referrals with multiple bonuses
        cursor.execute("""
            SELECT 
                referrer_id,
                referral_id,
                COUNT(*) as bonus_count
            FROM referral_bonuses
            GROUP BY referrer_id, referral_id
            HAVING COUNT(*) > 1
        """)
        
        duplicates = cursor.fetchall()
        
        if not duplicates:
            print("✅ No duplicate bonuses found. Database is clean!\n")
            cursor.close()
            conn.close()
            return
        
        print(f"⚠️  Found {len(duplicates)} referrals with multiple bonuses\n")
        
        removed_count = 0
        
        for dup in duplicates:
            referrer_id = dup['referrer_id']
            referral_id = dup['referral_id']
            bonus_count = dup['bonus_count']
            
            print(f"👤 Referral ID {referral_id} has {bonus_count} bonuses")
            
            # Get all bonuses for this referral, ordered by creation date
            cursor.execute("""
                SELECT 
                    rb.id,
                    rb.bonus_amount,
                    rb.investment_amount,
                    rb.status,
                    rb.created_at,
                    ui.enrollment_date
                FROM referral_bonuses rb
                JOIN user_investments ui ON rb.investment_id = ui.id
                WHERE rb.referrer_id = %s AND rb.referral_id = %s
                ORDER BY ui.enrollment_date ASC, rb.created_at ASC
            """, (referrer_id, referral_id))
            
            bonuses = cursor.fetchall()
            
            # Keep the first one (earliest investment)
            first_bonus = bonuses[0]
            print(f"   ✅ KEEPING: Bonus #{first_bonus['id']} - ${first_bonus['bonus_amount']} (Status: {first_bonus['status']})")
            
            # Delete the rest
            for bonus in bonuses[1:]:
                bonus_status = bonus['status']
                bonus_amount = bonus['bonus_amount']
                
                # If this duplicate bonus was CLAIMED, we need to reverse it
                if bonus_status == 'claimed':
                    # Get claim details
                    cursor.execute("""
                        SELECT referrer_id, amount FROM referral_bonus_claims
                        WHERE bonus_id = %s
                    """, (bonus['id'],))
                    
                    claim = cursor.fetchone()
                    if claim:
                        # Deduct the duplicate bonus from income wallet
                        cursor.execute("""
                            UPDATE users
                            SET income_balance = income_balance - %s
                            WHERE id = %s
                        """, (bonus_amount, referrer_id))
                        
                        print(f"   💰 REVERSED: Deducted ${bonus_amount} from referrer's income wallet")
                        
                        # Delete claim record
                        cursor.execute("""
                            DELETE FROM referral_bonus_claims WHERE bonus_id = %s
                        """, (bonus['id'],))
                
                # Delete the bonus
                cursor.execute("""
                    DELETE FROM referral_bonuses WHERE id = %s
                """, (bonus['id'],))
                
                status_note = f" (Was {bonus_status})" if bonus_status == 'claimed' else ""
                print(f"   ❌ REMOVED: Bonus #{bonus['id']} - ${bonus['bonus_amount']}{status_note}")
                removed_count += 1
        
        conn.commit()
        
        print(f"\n" + "=" * 60)
        print(f"✅ Cleanup Complete!")
        print(f"🗑️  Removed {removed_count} duplicate bonuses")
        print(f"📊 Each referral now has only ONE bonus (from first investment)\n")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🧹 DUPLICATE BONUS CLEANUP SCRIPT")
    print("=" * 60)
    print("This will remove duplicate bonuses from same referral")
    print("Keeps only the bonus from FIRST investment")
    print("⚠️  WARNING: This will delete data!\n")
    
    confirmation = input("Continue? (yes/no): ").strip().lower()
    
    if confirmation == 'yes':
        cleanup_duplicate_bonuses()
    else:
        print("❌ Cancelled")
