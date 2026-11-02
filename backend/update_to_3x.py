#!/usr/bin/env python3
"""
Update existing investments from 2x to 3x max_profit
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def main():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=" * 80)
        print("UPDATING INVESTMENTS FROM 2X TO 3X")
        print("=" * 80)
        
        # Get current investments
        print("\n1. Checking current investments...")
        cursor.execute("""
            SELECT id, user_id, invested_amount, max_profit, total_earned, status
            FROM user_investments
            ORDER BY id
        """)
        
        investments = cursor.fetchall()
        print(f"   Found {len(investments)} investments")
        
        # Show before state
        print("\n2. Current state:")
        for inv in investments[:5]:  # Show first 5
            print(f"   ID {inv['id']}: Invested ${inv['invested_amount']} → Max ${inv['max_profit']} (Current)")
        if len(investments) > 5:
            print(f"   ... and {len(investments) - 5} more")
        
        # Update to 3x
        print("\n3. Updating to 3x...")
        cursor.execute("""
            UPDATE user_investments
            SET max_profit = invested_amount * 3
            WHERE status IN ('active', 'completed')
        """)
        
        updated_count = cursor.rowcount
        print(f"   ✅ Updated {updated_count} investments")
        
        conn.commit()
        
        # Verify
        print("\n4. Verifying updates...")
        cursor.execute("""
            SELECT id, user_id, invested_amount, max_profit, total_earned, status
            FROM user_investments
            ORDER BY id
        """)
        
        investments = cursor.fetchall()
        print("\n   After update:")
        for inv in investments[:5]:  # Show first 5
            ratio = float(inv['max_profit']) / float(inv['invested_amount'])
            print(f"   ID {inv['id']}: Invested ${inv['invested_amount']} → Max ${inv['max_profit']} ({ratio:.1f}x) ✅")
        if len(investments) > 5:
            print(f"   ... and {len(investments) - 5} more")
        
        # Check if any need status update (completed → active if under new limit)
        print("\n5. Checking if any completed investments should be reactivated...")
        cursor.execute("""
            SELECT id, user_id, invested_amount, max_profit, total_earned, status
            FROM user_investments
            WHERE status = 'completed' AND total_earned < max_profit
        """)
        
        reactivate = cursor.fetchall()
        if reactivate:
            print(f"   Found {len(reactivate)} investments that can be reactivated")
            for inv in reactivate:
                print(f"   ID {inv['id']}: Earned ${inv['total_earned']} / ${inv['max_profit']} - Can continue earning!")
            
            # Reactivate them
            cursor.execute("""
                UPDATE user_investments
                SET status = 'active'
                WHERE status = 'completed' AND total_earned < max_profit
            """)
            print(f"   ✅ Reactivated {cursor.rowcount} investments")
            conn.commit()
        else:
            print("   No investments need reactivation")
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS!")
        print("=" * 80)
        print(f"\nSummary:")
        print(f"  - Updated {updated_count} investments to 3x max_profit")
        print(f"  - All investments now: invested_amount × 3 = max_profit")
        print(f"\nExample:")
        print(f"  - Invested: $1,000")
        print(f"  - Old Max (2x): $2,000")
        print(f"  - New Max (3x): $3,000 ✅")
        print(f"\nNote: Users can now earn an extra 1x on existing investments!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
