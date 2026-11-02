#!/usr/bin/env python3
"""
Initialize Withdrawal Settings in Database
Sets default values: Min $10, Max $300, Daily Limit 1, Fee 10%
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
        print("INITIALIZING WITHDRAWAL SETTINGS")
        print("=" * 80)
        
        # Define the correct settings
        settings = [
            ('withdrawal_min_amount', '10', 'Minimum withdrawal amount in USD'),
            ('withdrawal_max_amount', '300', 'Maximum withdrawal amount per day in USD'),
            ('withdrawal_daily_limit_count', '1', 'Daily withdrawal transaction limit'),
            ('withdrawal_fee_percentage', '10', 'Withdrawal fee percentage (deduction)'),
            ('withdrawal_enabled', 'true', 'Withdrawal enabled status')
        ]
        
        print("\n📝 Inserting/Updating Settings:")
        for key, value, desc in settings:
            cursor.execute("""
                INSERT INTO admin_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                ON CONFLICT (setting_key) 
                DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    description = EXCLUDED.description,
                    updated_at = NOW()
                RETURNING setting_key, setting_value
            """, (key, value, desc))
            
            result = cursor.fetchone()
            print(f"  ✅ {result['setting_key']} = {result['setting_value']}")
        
        conn.commit()
        
        print("\n" + "=" * 80)
        print("VERIFICATION - FINAL VALUES")
        print("=" * 80)
        
        cursor.execute("""
            SELECT setting_key, setting_value, description
            FROM admin_settings 
            WHERE setting_key LIKE 'withdrawal%'
            ORDER BY setting_key
        """)
        
        verified = cursor.fetchall()
        print("\n✅ Current Withdrawal Settings in Database:")
        for s in verified:
            print(f"  • {s['setting_key']}: {s['setting_value']}")
            print(f"    → {s['description']}")
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS - Settings initialized!")
        print("=" * 80)
        print("\n🔄 NEXT STEP: Restart backend service")
        print("   sudo systemctl restart avenza")
        print("\n📋 Summary:")
        print("   • Minimum: $10")
        print("   • Maximum: $300 per day")
        print("   • Daily Limit: 1 transaction")
        print("   • Fee (Deduction): 10%")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
