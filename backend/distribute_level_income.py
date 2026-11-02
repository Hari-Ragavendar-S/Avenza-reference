"""
Level Income Distribution Helper
Call this function after distributing daily ROI to calculate and distribute level income
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

def calculate_unlocked_levels(direct_referrals):
    """Calculate how many levels are unlocked based on direct referrals"""
    if direct_referrals == 0:
        return 0
    if direct_referrals >= 10:
        return 20  # Max levels
    return direct_referrals * 2

def distribute_level_income_for_user(user_id: int, roi_amount: Decimal, investment_id: int = None):
    """
    Distribute level income when a user receives ROI
    
    Args:
        user_id: User who received ROI
        roi_amount: Amount of ROI received
        investment_id: Reference to investment (optional)
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print(f"📊 Distributing level income for user {user_id}, ROI: ${roi_amount}")
        
        # Get level income config
        cursor.execute("""
            SELECT level, percentage FROM level_income_config
            WHERE is_active = TRUE
            ORDER BY level
        """)
        level_config = {row['level']: Decimal(row['percentage']) for row in cursor.fetchall()}
        
        # Find upline chain (up to 20 levels)
        current_user_id = user_id
        level = 1
        distributed_count = 0
        visited_users = set()  # Prevent circular references
        
        while level <= 20 and current_user_id:
            # Prevent infinite loops from circular references
            if current_user_id in visited_users:
                print(f"  ⚠️ Circular reference detected at user {current_user_id}, stopping")
                break
            visited_users.add(current_user_id)
            
            # Get sponsor
            cursor.execute("""
                SELECT sponsor_id FROM users WHERE id = %s
            """, (current_user_id,))
            
            result = cursor.fetchone()
            if not result or not result['sponsor_id']:
                break
            
            sponsor_id = result['sponsor_id']
            
            # Get sponsor's ACTIVE direct referrals count (with active investments)
            cursor.execute("""
                SELECT COUNT(DISTINCT u.id) as direct_refs
                FROM users u
                INNER JOIN user_investments ui ON u.id = ui.user_id
                WHERE u.sponsor_id = %s AND ui.status = 'active'
            """, (sponsor_id,))
            
            direct_refs = cursor.fetchone()['direct_refs']
            unlocked_levels = calculate_unlocked_levels(direct_refs)
            
            # Check if this level is unlocked for the sponsor
            if level > unlocked_levels:
                print(f"  🔒 Level {level} LOCKED for user {sponsor_id} (needs {(level + 1) // 2} direct refs, has {direct_refs})")
                # Move to next level without distributing
                current_user_id = sponsor_id
                level += 1
                continue
            
            # Calculate income for this level
            if level in level_config:
                percentage = level_config[level]
                income_amount = (roi_amount * percentage) / Decimal('100')
                
                # Credit to sponsor's income wallet
                cursor.execute("""
                    UPDATE users
                    SET income_balance = income_balance + %s
                    WHERE id = %s
                """, (income_amount, sponsor_id))
                
                # Record transaction
                cursor.execute("""
                    INSERT INTO level_income_transactions (
                        recipient_id, from_user_id, level, percentage,
                        roi_amount, income_amount, investment_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    sponsor_id, user_id, level, percentage,
                    roi_amount, income_amount, investment_id
                ))
                
                # Record in main transactions
                cursor.execute("""
                    INSERT INTO transactions (
                        user_id, type, amount, currency, description,
                        reference_id, reference_type, status, wallet_type
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    sponsor_id, 'level_income', income_amount, 'USD',
                    f'Level {level} income from user {user_id} ROI',
                    user_id, 'level_income', 'completed', 'income'
                ))
                
                distributed_count += 1
                print(f"  ✅ Level {level}: ${income_amount} to user {sponsor_id} ({percentage}%)")
            
            # Move to next level
            current_user_id = sponsor_id
            level += 1
        
        conn.commit()
        print(f"✅ Level income distributed to {distributed_count} upline members\n")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error distributing level income: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()
        return False

def create_referral_bonus_on_investment(referrer_id: int, referral_id: int, investment_id: int, investment_amount: Decimal):
    """
    Create referral bonus record when a direct referral makes their first investment
    
    Args:
        referrer_id: User who referred
        referral_id: User who invested
        investment_id: Investment record ID
        investment_amount: Amount invested
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print(f"🎁 Creating referral bonus for referrer {referrer_id}")
        
        # Check if this referral already has a bonus from this investment
        cursor.execute("""
            SELECT id FROM referral_bonuses
            WHERE referrer_id = %s AND investment_id = %s
        """, (referrer_id, investment_id))
        
        if cursor.fetchone():
            print(f"  ⚠️ Bonus already exists for this investment")
            cursor.close()
            conn.close()
            return False
        
        # Count how many referrals have invested so far
        cursor.execute("""
            SELECT COUNT(DISTINCT referral_id) as count
            FROM referral_bonuses
            WHERE referrer_id = %s
        """, (referrer_id,))
        
        existing_count = cursor.fetchone()['count']
        referral_number = existing_count + 1
        
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
        
        # Calculate bonus amount
        bonus_amount = (investment_amount * bonus_percentage) / Decimal('100')
        
        # Create bonus record (pending status)
        cursor.execute("""
            INSERT INTO referral_bonuses (
                referrer_id, referral_id, investment_id, referral_number,
                investment_amount, bonus_percentage, bonus_amount, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            referrer_id, referral_id, investment_id, referral_number,
            investment_amount, bonus_percentage, bonus_amount, 'pending'
        ))
        
        bonus_id = cursor.fetchone()['id']
        
        conn.commit()
        print(f"  ✅ Bonus #{bonus_id} created: ${bonus_amount} ({bonus_percentage}%) - Status: Pending")
        print(f"     Referral #{referral_number} for referrer {referrer_id}\n")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating referral bonus: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()
        return False

# Example usage
if __name__ == "__main__":
    # Test distribution
    print("🧪 Testing Level Income Distribution\n")
    
    # Example: User 5 received $100 ROI
    distribute_level_income_for_user(
        user_id=5,
        roi_amount=Decimal('100.00'),
        investment_id=1
    )
    
    # Example: User 5 made first investment, referrer is user 3
    print("🧪 Testing Referral Bonus Creation\n")
    create_referral_bonus_on_investment(
        referrer_id=3,
        referral_id=5,
        investment_id=1,
        investment_amount=Decimal('500.00')
    )
