"""
Recalculate Binary Matching History
Fixes the double-counting bug in previous matches
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')

DB_CONFIG = {
    'dbname': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456',
    'host': 'localhost',
    'port': 5432
}

def get_db():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def recalculate_matches():
    """Recalculate all binary matching values with correct logic"""
    db = get_db()
    cursor = db.cursor()
    
    try:
        print("=" * 60)
        print("🔧 FIXING BINARY MATCHING CALCULATIONS")
        print("=" * 60)
        print()
        
        # Get all users who have business volumes
        cursor.execute("""
            SELECT id, username, left_business, right_business, 
                   total_matched, pending_left, pending_right,
                   matching_bonus_earned
            FROM users 
            WHERE left_business > 0 OR right_business > 0
            ORDER BY id
        """)
        users = cursor.fetchall()
        
        print(f"📊 Found {len(users)} users with business volumes")
        print()
        
        fixed_count = 0
        
        for user in users:
            user_id = user['id']
            username = user['username']
            
            # Current values
            left = Decimal(user['left_business'] or 0)
            right = Decimal(user['right_business'] or 0)
            old_matched = Decimal(user['total_matched'] or 0)
            old_pending_left = Decimal(user['pending_left'] or 0)
            old_pending_right = Decimal(user['pending_right'] or 0)
            
            # Calculate CORRECT values
            # The matched amount should be min(left, right)
            correct_matched = min(left, right)
            
            # Pending is the difference
            correct_pending_left = max(Decimal(0), left - correct_matched)
            correct_pending_right = max(Decimal(0), right - correct_matched)
            
            # Check if values need fixing
            needs_fix = (
                old_matched != correct_matched or
                old_pending_left != correct_pending_left or
                old_pending_right != correct_pending_right
            )
            
            if needs_fix:
                print(f"👤 @{username} (ID: {user_id})")
                print(f"   Current  : L=${left} R=${right}")
                print(f"   Old      : Matched=${old_matched} | Pending L=${old_pending_left} R=${old_pending_right}")
                print(f"   Correct  : Matched=${correct_matched} | Pending L=${correct_pending_left} R=${correct_pending_right}")
                
                # Update user record
                cursor.execute("""
                    UPDATE users 
                    SET total_matched = %s,
                        pending_left = %s,
                        pending_right = %s
                    WHERE id = %s
                """, (correct_matched, correct_pending_left, correct_pending_right, user_id))
                
                print(f"   ✅ Fixed")
                print()
                fixed_count += 1
        
        db.commit()
        
        print("=" * 60)
        print(f"✅ FIXED {fixed_count} users")
        print("=" * 60)
        print()
        print("📝 What was fixed:")
        print("   • total_matched = min(left_business, right_business)")
        print("   • pending_left = left_business - total_matched")
        print("   • pending_right = right_business - total_matched")
        print()
        print("⚠️  NOTE:")
        print("   • Existing match history NOT deleted (bonuses already paid)")
        print("   • New matches will use correct calculation")
        print("   • Dashboard will show correct pending values")
        print()
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        db.close()

if __name__ == "__main__":
    print()
    print("🔧 This script will fix binary matching calculations:")
    print()
    print("   BEFORE (BUGGY):")
    print("   • total_matched was adding pending (double-counting)")
    print("   • pending values were incorrect")
    print()
    print("   AFTER (FIXED):")
    print("   • total_matched = min(left_business, right_business)")
    print("   • pending = unmatched portion of larger leg")
    print()
    print("   Safe to run: Does NOT delete history or change earned bonuses!")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    
    if response == 'yes':
        recalculate_matches()
    else:
        print("❌ Cancelled")
