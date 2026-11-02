#!/usr/bin/env python3
"""
Restore Investment Plans for Avenza
Recreates the 6 default investment plans
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def restore_plans():
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("=" * 60)
        print("RESTORING INVESTMENT PLANS")
        print("=" * 60)
        print()
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'investment_packages'
            )
        """)
        
        if not cursor.fetchone()['exists']:
            # Create table if it doesn't exist
            cursor.execute("""
                CREATE TABLE investment_packages (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    min_amount DECIMAL(20, 8) NOT NULL,
                    max_amount DECIMAL(20, 8) NOT NULL,
                    daily_profit_percentage DECIMAL(5, 2) NOT NULL,
                    duration_days INTEGER NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("✅ Created investment_packages table")
        
        # Investment plans
        plans = [
            {
                'name': 'Bronze',
                'min_amount': 50,
                'max_amount': 499,
                'daily_profit_percentage': 0.5,
                'duration_days': 365,
                'description': 'Entry level investment plan with 0.5% daily profit'
            },
            {
                'name': 'Silver',
                'min_amount': 500,
                'max_amount': 2499,
                'daily_profit_percentage': 0.7,
                'duration_days': 365,
                'description': 'Silver tier with 0.7% daily profit'
            },
            {
                'name': 'Gold',
                'min_amount': 2500,
                'max_amount': 9999,
                'daily_profit_percentage': 1.0,
                'duration_days': 365,
                'description': 'Gold tier with 1% daily profit'
            },
            {
                'name': 'Platinum',
                'min_amount': 10000,
                'max_amount': 49999,
                'daily_profit_percentage': 1.25,
                'duration_days': 365,
                'description': 'Platinum tier with 1.25% daily profit'
            },
            {
                'name': 'Diamond',
                'min_amount': 50000,
                'max_amount': 99999,
                'daily_profit_percentage': 1.5,
                'duration_days': 365,
                'description': 'Diamond tier with 1.5% daily profit'
            },
            {
                'name': 'Elite',
                'min_amount': 100000,
                'max_amount': 999999999,
                'daily_profit_percentage': 2.0,
                'duration_days': 365,
                'description': 'Elite tier with 2% daily profit'
            }
        ]
        
        # Clear existing plans
        cursor.execute("DELETE FROM investment_packages")
        print("✅ Cleared existing plans")
        print()
        
        # Insert plans
        for plan in plans:
            cursor.execute("""
                INSERT INTO investment_packages 
                (name, min_amount, max_amount, daily_profit_percentage, duration_days, description, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, true)
            """, (
                plan['name'],
                plan['min_amount'],
                plan['max_amount'],
                plan['daily_profit_percentage'],
                plan['duration_days'],
                plan['description']
            ))
            print(f"✅ Created {plan['name']} plan (${plan['min_amount']} - ${plan['max_amount']}, {plan['daily_profit_percentage']}% daily)")
        
        conn.commit()
        
        print()
        print("=" * 60)
        print("✅ All 6 investment plans restored successfully!")
        print("=" * 60)
        
        # Show summary
        cursor.execute("SELECT * FROM investment_packages ORDER BY min_amount")
        plans = cursor.fetchall()
        
        print()
        print("Investment Plans:")
        print("-" * 60)
        for p in plans:
            print(f"{p['id']}. {p['name']}: ${p['min_amount']} - ${p['max_amount']} ({p['daily_profit_percentage']}% daily)")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    restore_plans()
