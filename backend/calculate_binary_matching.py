"""
Binary Matching Bonus Calculator
Calculates and distributes matching bonuses based on left/right business volumes
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from decimal import Decimal
from datetime import datetime
import pytz

load_dotenv()

IST = pytz.timezone('Asia/Kolkata')

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        cursor_factory=RealDictCursor
    )

def calculate_matching_for_user(conn, user_id):
    """Calculate and award matching bonus for a single user"""
    cursor = conn.cursor()
    
    try:
        # Get user's current business volumes
        cursor.execute("""
            SELECT id, username, left_business, right_business, pending_left, pending_right,
                   total_matched, matching_bonus_earned, income_balance
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            print(f"❌ User {user_id} not found")
            return False
        
        # Add pending amounts to current business
        total_left = Decimal(user['left_business'] or 0) + Decimal(user['pending_left'] or 0)
        total_right = Decimal(user['right_business'] or 0) + Decimal(user['pending_right'] or 0)
        
        # Calculate matching (minimum of left and right)
        matchable_amount = min(total_left, total_right)
        
        if matchable_amount <= 0:
            print(f"⚠️  No matchable volume for user {user['username']}")
            return False
        
        # Calculate carry forward
        carry_forward_left = total_left - matchable_amount
        carry_forward_right = total_right - matchable_amount
        
        # Get matching tiers
        cursor.execute("""
            SELECT level, required_match, bonus_amount
            FROM binary_matching_tiers
            WHERE is_active = true
            ORDER BY level ASC
        """)
        tiers = cursor.fetchall()
        
        # Get already claimed tiers
        cursor.execute("""
            SELECT tier_level FROM binary_matching_claims WHERE user_id = %s
        """, (user_id,))
        claimed_tiers = {row['tier_level'] for row in cursor.fetchall()}
        
        # Calculate new matched amount
        previous_matched = Decimal(user['total_matched'] or 0)
        new_total_matched = previous_matched + matchable_amount
        
        # Check which tiers are newly unlocked
        total_bonus = Decimal(0)
        tiers_unlocked = []
        
        for tier in tiers:
            tier_level = tier['level']
            required_match = Decimal(tier['required_match'])
            bonus_amount = Decimal(tier['bonus_amount'])
            
            # Check if tier is newly unlocked
            if (tier_level not in claimed_tiers and 
                new_total_matched >= required_match and 
                previous_matched < required_match):
                
                total_bonus += bonus_amount
                tiers_unlocked.append({
                    'level': tier_level,
                    'required_match': required_match,
                    'bonus_amount': bonus_amount
                })
                
                print(f"🎉 User {user['username']} unlocked LEVEL {tier_level}: ${bonus_amount}")
        
        if total_bonus <= 0:
            print(f"ℹ️  No new tier unlocked for user {user['username']}")
            # Still update volumes and carry forward
            cursor.execute("""
                UPDATE users 
                SET pending_left = %s,
                    pending_right = %s,
                    total_matched = %s,
                    last_matched_at = %s
                WHERE id = %s
            """, (carry_forward_left, carry_forward_right, new_total_matched, datetime.now(IST), user_id))
            conn.commit()
            return False
        
        # Award bonus to income balance
        new_income_balance = Decimal(user['income_balance'] or 0) + total_bonus
        new_matching_earned = Decimal(user['matching_bonus_earned'] or 0) + total_bonus
        
        # Update user
        cursor.execute("""
            UPDATE users 
            SET total_matched = %s,
                pending_left = %s,
                pending_right = %s,
                matching_bonus_earned = %s,
                income_balance = %s,
                last_matched_at = %s
            WHERE id = %s
        """, (
            new_total_matched, carry_forward_left, carry_forward_right,
            new_matching_earned, new_income_balance, datetime.now(IST), user_id
        ))
        
        # Record matching history
        cursor.execute("""
            INSERT INTO binary_matching_history (
                user_id, matched_amount, left_volume, right_volume,
                bonus_earned, previous_left, previous_right,
                carry_forward_left, carry_forward_right
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, matchable_amount, total_left, total_right,
            total_bonus, user['left_business'], user['right_business'],
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
            
            # Update history with tier info
            cursor.execute("""
                UPDATE binary_matching_history
                SET level_achieved = %s,
                    tier_name = %s
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
        
        conn.commit()
        
        print(f"✅ Awarded ${total_bonus} matching bonus to {user['username']}")
        print(f"   Matched: ${matchable_amount} | Carry: L:${carry_forward_left} R:${carry_forward_right}")
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error calculating matching for user {user_id}: {str(e)}")
        return False
    finally:
        cursor.close()

def update_business_volume(conn, user_id, amount, from_side):
    """Update business volume up the binary tree"""
    cursor = conn.cursor()
    
    try:
        # Get sponsor and position
        cursor.execute("""
            SELECT sponsor_id, position FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user or not user['sponsor_id']:
            return
        
        sponsor_id = user['sponsor_id']
        position = user['position']  # 'left' or 'right'
        
        # Update sponsor's business volume based on position
        if position == 'left':
            cursor.execute("""
                UPDATE users 
                SET left_business = left_business + %s,
                    pending_left = pending_left + %s
                WHERE id = %s
            """, (amount, amount, sponsor_id))
        elif position == 'right':
            cursor.execute("""
                UPDATE users 
                SET right_business = right_business + %s,
                    pending_right = pending_right + %s
                WHERE id = %s
            """, (amount, amount, sponsor_id))
        
        print(f"📊 Updated {position} volume for user #{sponsor_id}: +${amount}")
        
        # Calculate matching for sponsor
        calculate_matching_for_user(conn, sponsor_id)
        
        # Recursively update upline
        update_business_volume(conn, sponsor_id, amount, from_side)
        
    except Exception as e:
        print(f"❌ Error updating volume for user {user_id}: {str(e)}")
    finally:
        cursor.close()

def process_all_users_matching():
    """Process matching bonus for all users with pending volumes"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("\n" + "="*60)
        print("🚀 BINARY MATCHING BONUS CALCULATOR")
        print("="*60)
        print(f"Started at: {datetime.now(IST).strftime('%Y-%m-%d %I:%M:%S %p IST')}\n")
        
        # Get all users with pending volumes
        cursor.execute("""
            SELECT id, username, pending_left, pending_right
            FROM users
            WHERE (pending_left > 0 OR pending_right > 0)
            AND is_active = true
            ORDER BY id ASC
        """)
        
        users = cursor.fetchall()
        
        if not users:
            print("ℹ️  No users with pending matching volumes found.")
            return
        
        print(f"Found {len(users)} users with pending volumes\n")
        
        success_count = 0
        for user in users:
            print(f"\n🔍 Processing user: {user['username']} (ID: {user['id']})")
            print(f"   Pending: Left ${user['pending_left']} | Right ${user['pending_right']}")
            
            if calculate_matching_for_user(conn, user['id']):
                success_count += 1
        
        print("\n" + "="*60)
        print(f"✅ Processing Complete!")
        print(f"   Total Users Processed: {len(users)}")
        print(f"   Bonuses Awarded: {success_count}")
        print(f"   Completed at: {datetime.now(IST).strftime('%Y-%m-%d %I:%M:%S %p IST')}")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    process_all_users_matching()
