#!/usr/bin/env python3
"""
Check and Update Withdrawal Settings in Database
"""
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def main():
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("=" * 80)
        print("CHECKING WITHDRAWAL SETTINGS IN DATABASE")
        print("=" * 80)
        
        # Check current settings
        cursor.execute("""
            SELECT setting_key, setting_value, description 
            FROM admin_settings 
            WHERE setting_key LIKE 'withdrawal%' 
            ORDER BY setting_key
        """)
        
        settings = cursor.fetchall()
        
        if not settings:
            print("\n❌ No withdrawal settings found in admin_settings table!")
            print("\nAttempting to check if settings exist at all...")
            
            cursor.execute("SELECT COUNT(*) as count FROM admin_settings")
            count = cursor.fetchone()['count']
            print(f"Total settings in admin_settings: {count}")
            
            if count == 0:
                print("\n⚠️  admin_settings table is empty. Need to run migration.")
            
        else:
            print("\n✅ Current Withdrawal Settings in Database:")
            print("-" * 80)
            for setting in settings:
                print(f"  {setting['setting_key']}: {setting['setting_value']}")
                if setting['description']:
                    print(f"    → {setting['description']}")
                print()
        
        print("\n" + "=" * 80)
        print("UPDATING TO CORRECT VALUES")
        print("=" * 80)
        print("Target values:")
        print("  - withdrawal_min_amount: 10")
        print("  - withdrawal_max_amount: 300")
        print("  - withdrawal_fee_percentage: 10")
        print("  - withdrawal_daily_limit_count: 300")
        print()
        
        # Update settings
        updates = [
            ('withdrawal_min_amount', '10', 'Minimum withdrawal amount in USD'),
            ('withdrawal_max_amount', '300', 'Maximum withdrawal amount per day in USD'),
            ('withdrawal_fee_percentage', '10', 'Withdrawal fee percentage'),
            ('withdrawal_daily_limit_count', '300', 'Daily withdrawal limit count')
        ]
        
        for key, value, desc in updates:
            cursor.execute("""
                INSERT INTO admin_settings (setting_key, setting_value, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (setting_key) 
                DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    description = EXCLUDED.description,
                    updated_at = NOW()
                RETURNING setting_key, setting_value
            """, (key, value, desc))
            
            result = cursor.fetchone()
            print(f"  ✅ Updated {result['setting_key']} = {result['setting_value']}")
        
        conn.commit()
        
        print("\n" + "=" * 80)
        print("VERIFICATION - CHECKING UPDATED VALUES")
        print("=" * 80)
        
        # Verify updates
        cursor.execute("""
            SELECT setting_key, setting_value 
            FROM admin_settings 
            WHERE setting_key IN (
                'withdrawal_min_amount',
                'withdrawal_max_amount', 
                'withdrawal_fee_percentage',
                'withdrawal_daily_limit_count'
            )
            ORDER BY setting_key
        """)
        
        verified = cursor.fetchall()
        print("\nVerified Settings:")
        for s in verified:
            print(f"  {s['setting_key']}: {s['setting_value']}")
        
        print("\n✅ All settings updated successfully!")
        print("\n🔄 Please restart the backend service:")
        print("   sudo systemctl restart avenza")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
