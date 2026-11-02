#!/usr/bin/env python3
"""
Backfill Referral Bonuses Script
Creates missing referral bonuses for existing investments
Run this ONCE to fix old data
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

def backfill_referral_bonuses():
    """Create missing referral bonuses for existing investments"""
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("🔄 Starting Referral Bonus Backfill...\n")
        
        # Get FIRST investment from each referral that doesn't have a bonus
        cursor.execute("""
            WITH first_investments AS (
                SELECT 
                    ui.user_id,
                    MIN(ui.id) as first_investment_id
                FROM user_investments ui
                JOIN users u ON ui.user_id = u.id
                WHERE u.sponsor_id IS NOT NULL
                GROUP BY ui.user_id
            )
            SELECT 
                ui.id as investment_id,
                ui.user_id as referral_id,
                ui.invested_amount,
                ui.enrollment_date,
                u.sponsor_id as referrer_id,
                u.username as referral_username,
                sponsor.username as referrer_username
            FROM first_investments fi
            JOIN user_investments ui ON fi.first_investment_id = ui.id
            JOIN users u ON ui.user_id = u.id
            LEFT JOIN users sponsor ON u.sponsor_id = sponsor.id
            WHERE NOT EXISTS (
                SELECT 1 FROM referral_bonuses rb
                WHERE rb.referral_id = u.id
            )
            ORDER BY ui.enrollment_date ASC
        """)
        
        missing_bonuses = cursor.fetchall()
        
        if not missing_bonuses:
            print("✅ No missing bonuses found. All investments already have bonuses!\n")
            cursor.close()
            conn.close()
            return
        
        print(f"📊 Found {len(missing_bonuses)} investments without referral bonuses\n")
        
        created_count = 0
        
        # Group by referrer to calculate correct referral numbers
        referrer_investments = {}
        for inv in missing_bonuses:
            referrer_id = inv['referrer_id']
            if referrer_id not in referrer_investments:
                referrer_investments[referrer_id] = []
            referrer_investments[referrer_id].append(inv)
        
        # Process each referrer's referrals
        for referrer_id, investments in referrer_investments.items():
            # Get existing bonus count for this referrer
            cursor.execute("""
                SELECT COUNT(DISTINCT referral_id) as count
                FROM referral_bonuses
                WHERE referrer_id = %s
            """, (referrer_id,))
            
            existing_count = cursor.fetchone()['count']
            
            # Sort by enrollment date to maintain chronological order
            investments.sort(key=lambda x: x['enrollment_date'])
            
            print(f"\n👤 Referrer: {investments[0]['referrer_username']} (ID: {referrer_id})")
            print(f"   Existing bonuses: {existing_count}")
            print(f"   Missing bonuses: {len(investments)}")
            
            for idx, inv in enumerate(investments):
                referral_number = existing_count + idx + 1
                
                # Determine bonus percentage
                if referral_number == 1:
                    bonus_percentage = Decimal('5.00')
                elif referral_number == 2:
                    bonus_percentage = Decimal('6.00')
                elif referral_number == 3:
                    bonus_percentage = Decimal('7.00')
                elif referral_number == 4:
                    bonus_percentage = Decimal('8.00')
                elif referral_number == 5:
                    bonus_percentage = Decimal('9.00')
                else:
                    bonus_percentage = Decimal('10.00')
                    referral_number = 6  # Store as 6 for 6+
                
                investment_amount = Decimal(inv['invested_amount'])
                bonus_amount = (investment_amount * bonus_percentage) / Decimal('100')
                
                # Create bonus record
                cursor.execute("""
                    INSERT INTO referral_bonuses (
                        referrer_id, referral_id, investment_id, referral_number,
                        investment_amount, bonus_percentage, bonus_amount, status,
                        created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    referrer_id, inv['referral_id'], inv['investment_id'], referral_number,
                    investment_amount, bonus_percentage, bonus_amount, 'pending',
                    inv['enrollment_date']  # Use original enrollment date
                ))
                
                bonus_id = cursor.fetchone()['id']
                
                print(f"   ✅ Bonus #{bonus_id}: ${bonus_amount} ({bonus_percentage}%) for {inv['referral_username']} - ${investment_amount} investment")
                
                created_count += 1
        
        conn.commit()
        
        print(f"\n" + "=" * 60)
        print(f"✅ Backfill Complete!")
        print(f"📊 Created {created_count} referral bonuses")
        print(f"💰 Users can now claim these bonuses from the Referral Bonus page\n")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Error during backfill: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🎁 REFERRAL BONUS BACKFILL SCRIPT")
    print("=" * 60)
    print("This will create missing referral bonuses for old investments")
    print("Safe to run - only creates bonuses that don't exist yet\n")
    
    confirmation = input("Continue? (yes/no): ").strip().lower()
    
    if confirmation == 'yes':
        backfill_referral_bonuses()
    else:
        print("❌ Cancelled")
