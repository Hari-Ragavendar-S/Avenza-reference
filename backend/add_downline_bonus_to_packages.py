#!/usr/bin/env python3
"""
Add downline_matching_bonus column to investment_packages table
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
        print("ADDING DOWNLINE MATCHING BONUS TO PACKAGES")
        print("=" * 80)
        
        # Add column
        print("\n1. Adding downline_matching_bonus column...")
        cursor.execute("""
            ALTER TABLE investment_packages 
            ADD COLUMN IF NOT EXISTS downline_matching_bonus DECIMAL(5, 2) DEFAULT 0
        """)
        print("   ✅ Column added")
        
        # Set default values based on package amounts
        print("\n2. Setting default bonus percentages...")
        updates = [
            (50, 5),      # Bronze: 5%
            (100, 6),     # Silver: 6%
            (300, 7),     # Gold: 7%
            (1000, 8),    # Platinum: 8%
            (3000, 9),    # Diamond: 9%
            (5000, 10),   # Elite: 10%
        ]
        
        for amount, bonus in updates:
            cursor.execute("""
                UPDATE investment_packages
                SET downline_matching_bonus = %s
                WHERE amount = %s
            """, (bonus, amount))
            print(f"   ✅ ${amount} package → {bonus}% bonus")
        
        conn.commit()
        
        # Verify
        print("\n3. Verifying updates...")
        cursor.execute("""
            SELECT name, amount, daily_profit_percentage, downline_matching_bonus
            FROM investment_packages
            ORDER BY amount
        """)
        
        packages = cursor.fetchall()
        print("\n   Package Summary:")
        for pkg in packages:
            print(f"   • {pkg['name']}: ${pkg['amount']} - Daily {pkg['daily_profit_percentage']}% - Downline {pkg['downline_matching_bonus']}%")
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS!")
        print("=" * 80)
        print("\nNext step: Restart backend service")
        print("   sudo systemctl restart avenza")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
