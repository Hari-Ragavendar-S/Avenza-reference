import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        cursor_factory=RealDictCursor
    )

def setup_investment_system():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🚀 Starting investment package system setup...")
    
    try:
        # 1. Create investment_packages table
        print("\nCreating investment_packages table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS investment_packages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                daily_profit_percentage DECIMAL(5, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Investment packages table created")
        
        # 2. Insert default 6 packages
        print("\nInserting default investment packages...")
        cursor.execute("""
            INSERT INTO investment_packages (name, amount, daily_profit_percentage, status)
            VALUES 
                ('Bronze', 50.00, 0.5, 'active'),
                ('Silver', 100.00, 0.6, 'active'),
                ('Gold', 300.00, 0.7, 'active'),
                ('Diamond', 1000.00, 0.8, 'active'),
                ('Platinum', 3000.00, 0.9, 'active'),
                ('Elite', 5000.00, 1.0, 'active')
            ON CONFLICT DO NOTHING
        """)
        print("✅ Default packages inserted")
        
        # 3. Create user_investments table
        print("\nCreating user_investments table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_investments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                package_id INTEGER NOT NULL REFERENCES investment_packages(id) ON DELETE CASCADE,
                invested_amount DECIMAL(15, 2) NOT NULL,
                total_earned DECIMAL(15, 2) DEFAULT 0.00,
                daily_profit DECIMAL(15, 2) NOT NULL,
                max_profit DECIMAL(15, 2) NOT NULL,
                enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_profit_date DATE,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ User investments table created")
        
        # 4. Create investment_transactions table
        print("\nCreating investment_transactions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS investment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                investment_id INTEGER NOT NULL REFERENCES user_investments(id) ON DELETE CASCADE,
                amount DECIMAL(15, 2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                wallet_type VARCHAR(20) DEFAULT 'income',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Investment transactions table created")
        
        # 5. Create indexes for better performance
        print("\nCreating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investments(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_investments_status ON user_investments(status);
            CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_investment_transactions_investment_id ON investment_transactions(investment_id);
        """)
        print("✅ Indexes created")
        
        # 6. Create IST timestamp trigger for investment tables
        print("\nCreating IST timestamp triggers...")
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_investment_timestamp_ist()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS update_investment_packages_timestamp ON investment_packages;
            CREATE TRIGGER update_investment_packages_timestamp
                BEFORE UPDATE ON investment_packages
                FOR EACH ROW
                EXECUTE FUNCTION update_investment_timestamp_ist();
            
            DROP TRIGGER IF EXISTS update_user_investments_timestamp ON user_investments;
            CREATE TRIGGER update_user_investments_timestamp
                BEFORE UPDATE ON user_investments
                FOR EACH ROW
                EXECUTE FUNCTION update_investment_timestamp_ist();
        """)
        print("✅ IST timestamp triggers created")
        
        # 7. Create function to automatically set IST for created_at
        print("\nCreating IST created_at default function...")
        cursor.execute("""
            ALTER TABLE investment_transactions 
            ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
            
            ALTER TABLE user_investments 
            ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
            ALTER COLUMN enrollment_date SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
            
            ALTER TABLE investment_packages 
            ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
        """)
        print("✅ IST created_at defaults set")
        
        conn.commit()
        print("\n✨ Investment package system setup complete!")
        
        # Display summary
        print("\n📋 Summary:")
        print("- Created investment_packages table with 6 default packages")
        print("- Created user_investments table")
        print("- Created investment_transactions table")
        print("- Created indexes for performance")
        print("- Created IST timestamp triggers")
        print("\n📦 Default Packages:")
        cursor.execute("SELECT name, amount, daily_profit_percentage, status FROM investment_packages ORDER BY amount")
        packages = cursor.fetchall()
        for pkg in packages:
            print(f"  - {pkg['name']}: ${pkg['amount']} | {pkg['daily_profit_percentage']}% daily | {pkg['status']}")
        
        print("\n⚠️  Next steps:")
        print("1. Upload schemas/investment.py to VPS")
        print("2. Upload routes/investment.py to VPS")
        print("3. Set up cron job for daily profit calculation")
        print("4. Restart backend: sudo systemctl restart avenza")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    setup_investment_system()
