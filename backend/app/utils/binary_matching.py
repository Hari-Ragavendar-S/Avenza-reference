"""
Binary Matching Utility Functions
Helper functions to trigger binary matching calculations
"""

from decimal import Decimal
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')

def trigger_binary_matching_on_investment(db, user_id, investment_amount):
    """
    Trigger binary matching calculation when user makes investment
    Updates business volume up the tree and calculates matching bonuses
    """
    cursor = db.cursor()
    
    try:
        print(f"\n🎯 Triggering binary matching for user {user_id}, amount: ${investment_amount}")
        
        # Get user's position and sponsor
        cursor.execute("""
            SELECT id, username, sponsor_id, position
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            print(f"❌ User {user_id} not found")
            return False
        
        if not user['sponsor_id']:
            print(f"ℹ️  User {user['username']} has no sponsor, skipping matching")
            return False
        
        # Start updating upline volumes
        _update_upline_volumes(db, user_id, investment_amount)
        
        db.commit()
        print(f"✅ Binary matching triggered successfully for user {user['username']}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error triggering binary matching: {str(e)}")
        return False
    finally:
        cursor.close()

def _update_upline_volumes(db, user_id, amount):
    """Recursively update business volumes for all upline members"""
    cursor = db.cursor()
    
    try:
        # Get user's sponsor and position
        cursor.execute("""
            SELECT sponsor_id, position FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user or not user['sponsor_id']:
            return
        
        sponsor_id = user['sponsor_id']
        position = user['position']
        
        if not position:
            print(f"⚠️  User {user_id} has no position set, skipping volume update")
            return
        
        # Update sponsor's volume based on position
        if position == 'left':
            cursor.execute("""
                UPDATE users 
                SET left_business = left_business + %s
                WHERE id = %s
                RETURNING username, left_business, right_business, pending_left, pending_right
            """, (amount, sponsor_id))
            
            # Recalculate pending: smaller leg has 0 pending, larger leg has the difference
            result = cursor.fetchone()
            if not result:
                print(f"❌ No sponsor found with id {sponsor_id}")
                return
                
            new_left = Decimal(result['left_business'])
            new_right = Decimal(result['right_business'])
            
            if new_left > new_right:
                new_pending_left = new_left - new_right
                new_pending_right = Decimal(0)
            else:
                new_pending_left = Decimal(0)
                new_pending_right = new_right - new_left
            
            cursor.execute("""
                UPDATE users
                SET pending_left = %s,
                    pending_right = %s
                WHERE id = %s
            """, (new_pending_left, new_pending_right, sponsor_id))
            
            print(f"   ✓ Updated sponsor @{result['username']}: L:${new_left} R:${new_right} | Pending L:${new_pending_left} R:${new_pending_right}")
            
        elif position == 'right':
            cursor.execute("""
                UPDATE users 
                SET right_business = right_business + %s
                WHERE id = %s
                RETURNING username, right_business, left_business, pending_right, pending_left
            """, (amount, sponsor_id))
            
            # Recalculate pending: smaller leg has 0 pending, larger leg has the difference
            result = cursor.fetchone()
            if not result:
                print(f"❌ No sponsor found with id {sponsor_id}")
                return
                
            new_right = Decimal(result['right_business'])
            new_left = Decimal(result['left_business'])
            
            if new_right > new_left:
                new_pending_right = new_right - new_left
                new_pending_left = Decimal(0)
            else:
                new_pending_right = Decimal(0)
                new_pending_left = new_left - new_right
            
            cursor.execute("""
                UPDATE users
                SET pending_left = %s,
                    pending_right = %s
                WHERE id = %s
            """, (new_pending_left, new_pending_right, sponsor_id))
            
            print(f"   ✓ Updated sponsor @{result['username']}: L:${new_left} R:${new_right} | Pending L:${new_pending_left} R:${new_pending_right}")
            
        else:
            print(f"⚠️  Invalid position '{position}' for user {user_id}")
            return
        
        # Check if matching bonus should be calculated
        _check_and_award_matching(db, sponsor_id)
        
        # Continue up the tree
        _update_upline_volumes(db, sponsor_id, amount)
        
    except Exception as e:
        print(f"❌ Error updating upline volumes: {str(e)}")
    finally:
        cursor.close()

def _check_and_award_matching(db, user_id):
    """Check if user qualifies for matching bonus and award it"""
    cursor = db.cursor()
    
    try:
        # Get user's volumes
        cursor.execute("""
            SELECT id, username, left_business, right_business, pending_left, pending_right,
                   total_matched, matching_bonus_earned, income_balance
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            return
        
        # Current business volumes (cumulative)
        left_business = Decimal(user['left_business'] or 0)
        right_business = Decimal(user['right_business'] or 0)
        previous_matched = Decimal(user['total_matched'] or 0)
        
        # Calculate NEW matchable amount (not cumulative)
        current_matchable = min(left_business, right_business)
        new_match_amount = current_matchable - previous_matched
        
        if new_match_amount <= 0:
            # No new match
            return
        
        print(f"   💎 New match detected for @{user['username']}: ${new_match_amount} (L:${left_business} R:${right_business})")
        
        # Calculate NEW total matched
        new_total_matched = previous_matched + new_match_amount
        
        # Calculate carry forward (pending)
        carry_forward_left = left_business - current_matchable
        carry_forward_right = right_business - current_matchable
        
        # Get matching tiers
        cursor.execute("""
            SELECT level, required_match, bonus_amount
            FROM binary_matching_tiers
            WHERE is_active = true
            ORDER BY level ASC
        """)
        tiers = cursor.fetchall()
        
        # Get claimed tiers
        cursor.execute("""
            SELECT tier_level FROM binary_matching_claims WHERE user_id = %s
        """, (user_id,))
        claimed_tiers = {row['tier_level'] for row in cursor.fetchall()}
        
        # Find newly unlocked tiers
        total_bonus = Decimal(0)
        tiers_unlocked = []
        
        for tier in tiers:
            tier_level = tier['level']
            required_match = Decimal(tier['required_match'])
            bonus_amount = Decimal(tier['bonus_amount'])
            
            if (tier_level not in claimed_tiers and 
                new_total_matched >= required_match and 
                previous_matched < required_match):
                
                total_bonus += bonus_amount
                tiers_unlocked.append({
                    'level': tier_level,
                    'required_match': required_match,
                    'bonus_amount': bonus_amount
                })
        
        # Update volumes even if no bonus
        cursor.execute("""
            UPDATE users 
            SET pending_left = %s,
                pending_right = %s,
                total_matched = %s,
                last_matched_at = %s
            WHERE id = %s
        """, (carry_forward_left, carry_forward_right, new_total_matched, datetime.now(IST), user_id))
        
        if total_bonus <= 0:
            print(f"   ℹ️  No new tiers unlocked, but match recorded")
            # Still record history even without tier bonus
            cursor.execute("""
                INSERT INTO binary_matching_history (
                    user_id, matched_amount, left_volume, right_volume,
                    bonus_earned, previous_left, previous_right,
                    carry_forward_left, carry_forward_right
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                user_id, new_match_amount, left_business, right_business,
                Decimal(0), left_business - new_match_amount, right_business - new_match_amount,
                carry_forward_left, carry_forward_right
            ))
            history_id = cursor.fetchone()['id']
            
            # 🌟 TRIGGER DOWNLINE MATCHING BONUS for all upline users (including self!)
            from app.utils.downline_matching import distribute_downline_matching_bonus_to_all
            distribute_downline_matching_bonus_to_all(db, user_id, new_match_amount)
            return
        
        # Award bonus
        new_income_balance = Decimal(user['income_balance'] or 0) + total_bonus
        new_matching_earned = Decimal(user['matching_bonus_earned'] or 0) + total_bonus
        
        cursor.execute("""
            UPDATE users 
            SET matching_bonus_earned = %s,
                income_balance = %s
            WHERE id = %s
        """, (new_matching_earned, new_income_balance, user_id))
        
        # Record history
        cursor.execute("""
            INSERT INTO binary_matching_history (
                user_id, matched_amount, left_volume, right_volume,
                bonus_earned, previous_left, previous_right,
                carry_forward_left, carry_forward_right
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, new_match_amount, left_business, right_business,
            total_bonus, left_business - new_match_amount, right_business - new_match_amount,
            carry_forward_left, carry_forward_right
        ))
        
        history_id = cursor.fetchone()['id']
        
        # Record tier claims
        for tier_data in tiers_unlocked:
            cursor.execute("""
                INSERT INTO binary_matching_claims (
                    user_id, tier_level, required_match, bonus_amount, matching_history_id
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                user_id, tier_data['level'], tier_data['required_match'],
                tier_data['bonus_amount'], history_id
            ))
            
            cursor.execute("""
                UPDATE binary_matching_history
                SET level_achieved = %s, tier_name = %s
                WHERE id = %s
            """, (tier_data['level'], f"Level {tier_data['level']}", history_id))
        
        # Record transaction
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'matching_bonus', total_bonus, 'USD',
            f"Binary Matching Bonus - {len(tiers_unlocked)} tier(s) unlocked",
            history_id, 'binary_matching', 'completed', 'income'
        ))
        
        print(f"   🎉 Awarded ${total_bonus} matching bonus to @{user['username']} ({len(tiers_unlocked)} tiers)")
        
        # 🌟 TRIGGER DOWNLINE MATCHING BONUS for all upline users (including self!)
        from app.utils.downline_matching import distribute_downline_matching_bonus_to_all
        distribute_downline_matching_bonus_to_all(db, user_id, new_match_amount)
        
    except Exception as e:
        print(f"❌ Error checking matching for user {user_id}: {str(e)}")
    finally:
        cursor.close()

def get_next_available_position(db, sponsor_id, preferred_position=None):
    """
    Find next available position in sponsor's binary tree
    Returns 'left' or 'right'
    """
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            SELECT left_child_id, right_child_id FROM users WHERE id = %s
        """, (sponsor_id,))
        
        sponsor = cursor.fetchone()
        if not sponsor:
            return None
        
        # If preferred position is available, use it
        if preferred_position:
            if preferred_position == 'left' and not sponsor['left_child_id']:
                return 'left'
            elif preferred_position == 'right' and not sponsor['right_child_id']:
                return 'right'
        
        # Otherwise, find first available position
        if not sponsor['left_child_id']:
            return 'left'
        elif not sponsor['right_child_id']:
            return 'right'
        
        # Both positions filled
        return None
        
    finally:
        cursor.close()

def place_user_in_binary_tree(db, user_id, sponsor_id, position):
    """Place user in sponsor's binary tree at specified position"""
    cursor = db.cursor()
    
    try:
        # Validate position is available
        cursor.execute("""
            SELECT left_child_id, right_child_id FROM users WHERE id = %s
        """, (sponsor_id,))
        
        sponsor = cursor.fetchone()
        if not sponsor:
            return False, "Sponsor not found"
        
        if position == 'left' and sponsor['left_child_id']:
            return False, "Left position already occupied"
        elif position == 'right' and sponsor['right_child_id']:
            return False, "Right position already occupied"
        
        # Update user's position
        cursor.execute("""
            UPDATE users SET position = %s WHERE id = %s
        """, (position, user_id))
        
        # Update sponsor's child reference
        if position == 'left':
            cursor.execute("""
                UPDATE users SET left_child_id = %s WHERE id = %s
            """, (user_id, sponsor_id))
        else:
            cursor.execute("""
                UPDATE users SET right_child_id = %s WHERE id = %s
            """, (user_id, sponsor_id))
        
        db.commit()
        return True, f"User placed at {position} position"
        
    except Exception as e:
        db.rollback()
        return False, str(e)
    finally:
        cursor.close()
