#!/usr/bin/env python3
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='avenzaweb',
    user='avenzauser',
    password='123456'
)
cursor = conn.cursor()

try:
    # Clear existing
    cursor.execute("DELETE FROM investment_packages")
    print("✅ Cleared existing plans")
    
    # Insert 6 plans with correct profit percentages
    cursor.execute("""
        INSERT INTO investment_packages (name, amount, daily_profit_percentage, status)
        VALUES 
            ('Bronze', 50.00, 0.5, 'active'),
            ('Silver', 100.00, 0.6, 'active'),
            ('Gold', 300.00, 0.7, 'active'),
            ('Platinum', 1000.00, 0.8, 'active'),
            ('Diamond', 3000.00, 1.0, 'active'),
            ('Elite', 5000.00, 1.2, 'active')
    """)
    
    conn.commit()
    print("✅ Inserted 6 investment plans")
    
    # Show results
    cursor.execute("SELECT * FROM investment_packages ORDER BY amount")
    plans = cursor.fetchall()
    print("\n📦 Investment Plans:")
    for p in plans:
        print(f"  {p[0]}. {p[1]}: ${p[2]} | {p[3]}% daily | {p[4]}")
    
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()
