"""
Downline Matching Bonus Utility Functions
Handles bonus distribution when downline users make binary matches
"""

from decimal import Decimal
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')

# Bonus percentages by package amount
# Bronze ($50) → 5%, Silver ($100) → 6%, Gold ($300) → 7%, Platinum ($1K) → 8%, Diamond ($3K) → 9%, Elite ($5K) → 10%
PACKAGE_BONUS_RATES = {
    Decimal('50'): Decimal('5'),      # Bronze: 5%
    Decimal('100'): Decimal('6'),     # Silver: 6%
    Decimal('300'): Decimal('7'),     # Gold: 7%
    Decimal('1000'): Decimal('8'),    # Platinum: 8%
    Decimal('3000'): Decimal('9'),    # Diamond: 9%
    Decimal('5000'): Decimal('10'),   # Elite: 10%
}

MAX_BONUS_PER_DAY = Decimal('220')  # Maximum $220 per day per user

def get_bonus_percentage(package_amount):
    """Get bonus percentage for a package amount"""
    package_amount = Decimal(str(package_amount))
    return PACKAGE_BONUS_RATES.get(package_amount, Decimal('0'))

def get_user_daily_bonus_total(db, user_id):
    """Get user's total downline matching bonus earned today"""
    cursor = db.cursor()
    try:
        ist_now = datetime.now(IST)
        today = ist_now.date()
        
        cursor.execute("""
            SELECT COALESCE(SUM(user_received), 0) as daily_total
            FROM downline_matching_bonus_history
            WHERE user_id = %s 
            AND DATE(created_at AT TIME ZONE 'Asia/Kolkata') = %s
        """, (user_id, today))
        
        result = cursor.fetchone()
        return Decimal(str(result['daily_total'] or 0))
    finally:
        cursor.close()

def get_user_highest_package(db, user_id):
    """Get user's highest active package amount"""
    cursor = db.cursor()
    try:
        cursor.execute("""
            SELECT invested_amount 
            FROM user_investments
            WHERE user_id = %s AND status = 'active'
            ORDER BY invested_amount DESC
            LIMIT 1
        """, (user_id,))
        
        result = cursor.fetchone()
        if result:
            return Decimal(result['invested_amount'])
        return None
    finally:
        cursor.close()

def distribute_downline_matching_bonus_to_all(db, matched_user_id, matched_amount):
    """
    Distribute downline matching bonus to the user who matched AND all their upline
    This gives bonus to:
    1. The user whose legs matched (because their downline contributed)
    2. All upline users (standard downline matching)
    """
    cursor = db.cursor()
    
    try:
        print(f"\n💰 Distributing downline matching bonus for match: ${matched_amount}")
        print(f"   User who matched: {matched_user_id}")
        
        # Get matched user info
        cursor.execute("""
            SELECT username FROM users WHERE id = %s
        """, (matched_user_id,))
        matched_user = cursor.fetchone()
        
        if not matched_user:
            print(f"   ❌ User {matched_user_id} not found")
            return
        
        matched_username = matched_user['username']
        matched_amount = Decimal(str(matched_amount))
        
        # Get ALL users who should receive bonus:
        # 1. The user who matched (receives bonus from own downline)
        # 2. All upline users (standard behavior)
        users_to_pay = [matched_user_id]  # Start with self
        upline_users = _get_all_upline_users(db, matched_user_id)
        users_to_pay.extend(upline_users)
        
        print(f"   📊 Paying bonus to {len(users_to_pay)} users (self + {len(upline_users)} upline)")
        
        total_distributed = Decimal('0')
        total_to_admin = Decimal('0')
        
        for upline_user_id in users_to_pay:
            # Get user's highest package
            highest_package = get_user_highest_package(db, upline_user_id)
            
            if not highest_package:
                print(f"   ⏭️  User {upline_user_id} has no active package, skipping")
                continue
            
            # Get bonus percentage for highest package
            bonus_percentage = get_bonus_percentage(highest_package)
            
            if bonus_percentage == 0:
                print(f"   ⏭️  User {upline_user_id} package ${highest_package} not eligible, skipping")
                continue
            
            # Check daily limit
            daily_earned = get_user_daily_bonus_total(db, upline_user_id)
            
            # Calculate bonus
            calculated_bonus = (matched_amount * bonus_percentage) / Decimal('100')
            
            # Apply daily $220 cap
            remaining_daily_limit = MAX_BONUS_PER_DAY - daily_earned
            
            # Even if daily limit reached, still record with $0 received
            if daily_earned >= MAX_BONUS_PER_DAY:
                user_receives = Decimal('0')
                admin_receives = calculated_bonus  # All goes to admin
                print(f"   📊 User {upline_user_id} hit daily cap (${daily_earned}), recording with $0")
            elif calculated_bonus > remaining_daily_limit:
                user_receives = remaining_daily_limit
                admin_receives = calculated_bonus - remaining_daily_limit
            else:
                user_receives = calculated_bonus
                admin_receives = Decimal('0')
            
            # Get username
            cursor.execute("""
                SELECT username FROM users WHERE id = %s
            """, (upline_user_id,))
            user_info = cursor.fetchone()
            
            # Credit user's income wallet (only if user_receives > 0)
            if user_receives > 0:
                cursor.execute("""
                    UPDATE users 
                    SET income_balance = income_balance + %s,
                        downline_matching_earned = downline_matching_earned + %s
                    WHERE id = %s
                """, (user_receives, user_receives, upline_user_id))
            
            # Record in history (ALWAYS, even if user_receives = $0)
            # If this is the matched user themselves, show as "self" match
            display_username = matched_username if upline_user_id == matched_user_id else matched_username
            
            cursor.execute("""
                INSERT INTO downline_matching_bonus_history (
                    user_id, downline_user_id, match_amount, 
                    user_package_amount, bonus_percentage,
                    calculated_bonus, user_received, admin_received
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                upline_user_id, matched_user_id, matched_amount,
                highest_package, bonus_percentage,
                calculated_bonus, user_receives, admin_receives
            ))
            
            history_id = cursor.fetchone()['id']
            
            # Record transaction only if user actually received something
            if user_receives > 0:
                description = f"Downline matching bonus from @{display_username} (${matched_amount} match)"
                if upline_user_id == matched_user_id:
                    description = f"Downline matching bonus from own match (${matched_amount})"
                    
                cursor.execute("""
                    INSERT INTO transactions (
                        user_id, type, amount, currency, description,
                        reference_id, reference_type, status, wallet_type
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    upline_user_id, 'downline_matching_bonus', user_receives, 'USD',
                    description,
                    history_id, 'downline_matching', 'completed', 'income'
                ))
            
            # If admin receives excess, credit admin wallet
            if admin_receives > 0:
                cursor.execute("""
                    UPDATE users 
                    SET income_balance = income_balance + %s
                    WHERE username = 'admin'
                """, (admin_receives,))
                
                # Record admin transaction
                cursor.execute("""
                    SELECT id FROM users WHERE username = 'admin'
                """)
                admin_user = cursor.fetchone()
                if admin_user:
                    cursor.execute("""
                        INSERT INTO transactions (
                            user_id, type, amount, currency, description,
                            reference_id, reference_type, status, wallet_type
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        admin_user['id'], 'downline_matching_excess', admin_receives, 'USD',
                        f"Excess downline matching from @{user_info['username']} (capped at $220)",
                        history_id, 'downline_matching', 'completed', 'income'
                    ))
            
            total_distributed += user_receives
            total_to_admin += admin_receives
            
            role = "SELF" if upline_user_id == matched_user_id else "UPLINE"
            print(f"   ✅ [{role}] @{user_info['username']}: Package ${highest_package} ({bonus_percentage}%) → Calculated: ${calculated_bonus}, Daily earned: ${daily_earned}, User gets: ${user_receives}, Admin: ${admin_receives}")
        
        db.commit()
        
        print(f"   🎉 Total distributed: ${total_distributed}")
        print(f"   💸 Total to admin: ${total_to_admin}")
        print(f"   ✅ Downline matching bonus distribution complete!")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error distributing downline matching bonus: {str(e)}")
        return False
    finally:
        cursor.close()


def distribute_downline_matching_bonus(db, downline_user_id, matched_amount):
    """
    Distribute downline matching bonus to all upline users
    Called when a user makes a binary match
    """
    cursor = db.cursor()
    
    try:
        print(f"\n💰 Distributing downline matching bonus for match: ${matched_amount}")
        print(f"   Downline user ID: {downline_user_id}")
        
        # Get downline user info
        cursor.execute("""
            SELECT username FROM users WHERE id = %s
        """, (downline_user_id,))
        downline_user = cursor.fetchone()
        
        if not downline_user:
            print(f"   ❌ Downline user {downline_user_id} not found")
            return
        
        downline_username = downline_user['username']
        matched_amount = Decimal(str(matched_amount))
        
        # Get ALL upline users (traverse to root)
        upline_users = _get_all_upline_users(db, downline_user_id)
        
        print(f"   📊 Found {len(upline_users)} upline users")
        
        total_distributed = Decimal('0')
        total_to_admin = Decimal('0')
        
        for upline_user_id in upline_users:
            # Get user's highest package
            highest_package = get_user_highest_package(db, upline_user_id)
            
            if not highest_package:
                print(f"   ⏭️  User {upline_user_id} has no active package, skipping")
                continue
            
            # Get bonus percentage for highest package
            bonus_percentage = get_bonus_percentage(highest_package)
            
            if bonus_percentage == 0:
                print(f"   ⏭️  User {upline_user_id} package ${highest_package} not eligible, skipping")
                continue
            
            # Check daily limit
            daily_earned = get_user_daily_bonus_total(db, upline_user_id)
            
            # Calculate bonus
            calculated_bonus = (matched_amount * bonus_percentage) / Decimal('100')
            
            # Apply daily $220 cap
            remaining_daily_limit = MAX_BONUS_PER_DAY - daily_earned
            
            # Even if daily limit reached, still record with $0 received
            if daily_earned >= MAX_BONUS_PER_DAY:
                user_receives = Decimal('0')
                admin_receives = calculated_bonus  # All goes to admin
                print(f"   📊 User {upline_user_id} hit daily cap (${daily_earned}), recording with $0")
            elif calculated_bonus > remaining_daily_limit:
                user_receives = remaining_daily_limit
                admin_receives = calculated_bonus - remaining_daily_limit
            else:
                user_receives = calculated_bonus
                admin_receives = Decimal('0')
            
            # Get username
            cursor.execute("""
                SELECT username FROM users WHERE id = %s
            """, (upline_user_id,))
            user_info = cursor.fetchone()
            
            # Credit user's income wallet (only if user_receives > 0)
            if user_receives > 0:
                cursor.execute("""
                    UPDATE users 
                    SET income_balance = income_balance + %s,
                        downline_matching_earned = downline_matching_earned + %s
                    WHERE id = %s
                """, (user_receives, user_receives, upline_user_id))
            
            # Record in history (ALWAYS, even if user_receives = $0)
            cursor.execute("""
                INSERT INTO downline_matching_bonus_history (
                    user_id, downline_user_id, match_amount, 
                    user_package_amount, bonus_percentage,
                    calculated_bonus, user_received, admin_received
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                upline_user_id, downline_user_id, matched_amount,
                highest_package, bonus_percentage,
                calculated_bonus, user_receives, admin_receives
            ))
            
            history_id = cursor.fetchone()['id']
            
            # Record transaction only if user actually received something
            if user_receives > 0:
                cursor.execute("""
                    INSERT INTO transactions (
                        user_id, type, amount, currency, description,
                        reference_id, reference_type, status, wallet_type
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    upline_user_id, 'downline_matching_bonus', user_receives, 'USD',
                    f"Downline matching bonus from @{downline_username} (${matched_amount} match)",
                    history_id, 'downline_matching', 'completed', 'income'
                ))
            
            # If admin receives excess, credit admin wallet
            if admin_receives > 0:
                cursor.execute("""
                    UPDATE users 
                    SET income_balance = income_balance + %s
                    WHERE username = 'admin'
                """, (admin_receives,))
                
                # Record admin transaction
                cursor.execute("""
                    SELECT id FROM users WHERE username = 'admin'
                """)
                admin_user = cursor.fetchone()
                if admin_user:
                    cursor.execute("""
                        INSERT INTO transactions (
                            user_id, type, amount, currency, description,
                            reference_id, reference_type, status, wallet_type
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        admin_user['id'], 'downline_matching_excess', admin_receives, 'USD',
                        f"Excess downline matching from @{user_info['username']} (capped at $220)",
                        history_id, 'downline_matching', 'completed', 'income'
                    ))
            
            total_distributed += user_receives
            total_to_admin += admin_receives
            
            print(f"   ✅ @{user_info['username']}: Package ${highest_package} ({bonus_percentage}%) → Calculated: ${calculated_bonus}, Daily earned: ${daily_earned}, User gets: ${user_receives}, Admin: ${admin_receives}")
        
        db.commit()
        
        print(f"   🎉 Total distributed: ${total_distributed}")
        print(f"   💸 Total to admin: ${total_to_admin}")
        print(f"   ✅ Downline matching bonus distribution complete!")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error distributing downline matching bonus: {str(e)}")
        return False
    finally:
        cursor.close()

def _get_all_upline_users(db, user_id):
    """Get all upline users from user to root"""
    cursor = db.cursor()
    upline_users = []
    
    try:
        current_user_id = user_id
        
        while True:
            cursor.execute("""
                SELECT sponsor_id FROM users WHERE id = %s
            """, (current_user_id,))
            
            result = cursor.fetchone()
            
            if not result or not result['sponsor_id']:
                break
            
            sponsor_id = result['sponsor_id']
            upline_users.append(sponsor_id)
            current_user_id = sponsor_id
            
            # Safety check to prevent infinite loops
            if len(upline_users) > 100:
                print(f"   ⚠️  Upline depth exceeded 100 levels, stopping")
                break
        
        return upline_users
        
    finally:
        cursor.close()
