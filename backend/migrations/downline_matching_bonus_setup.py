"""
Downline Matching Bonus System Setup
Creates table for tracking downline matching bonuses (max $220 per match)
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Setup downline matching bonus system"""
    
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("🚀 Starting Downline Matching Bonus System Setup...")
        
        # 1. Create downline_matching_bonus_history table
        print("\n📊 Creating downline_matching_bonus_history table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS downline_matching_bonus_history (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                downline_user_id INT REFERENCES users(id),
                match_amount DECIMAL(15,2) NOT NULL,
                user_package_amount DECIMAL(15,2) NOT NULL,
                bonus_percentage DECIMAL(5,2) NOT NULL,
                calculated_bonus DECIMAL(15,2) NOT NULL,
                user_received DECIMAL(15,2) NOT NULL,
                admin_received DECIMAL(15,2) DEFAULT 0,
                user_wallet_type VARCHAR(20) DEFAULT 'income',
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        print("✅ downline_matching_bonus_history table created")
        
        # 2. Create indexes for performance
        print("\n⚡ Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_downline_bonus_user ON downline_matching_bonus_history(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_downline_bonus_downline_user ON downline_matching_bonus_history(downline_user_id);
            CREATE INDEX IF NOT EXISTS idx_downline_bonus_created ON downline_matching_bonus_history(created_at DESC);
        """)
        print("✅ Indexes created")
        
        # 3. Add column to users table for tracking total downline bonus earned
        print("\n📝 Adding tracking column to users table...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS downline_matching_earned DECIMAL(15,2) DEFAULT 0;
        """)
        print("✅ Tracking column added")
        
        # 4. Commit changes
        conn.commit()
        
        print("\n" + "="*50)
        print("✅ DOWNLINE MATCHING BONUS SYSTEM SETUP COMPLETE!")
        print("="*50)
        print("\n📊 Summary:")
        print("  • downline_matching_bonus_history table created")
        print("  • Indexes created for performance")
        print("  • users.downline_matching_earned column added")
        print("\n🎯 System Features:")
        print("  • Earn bonus on ALL downline matches")
        print("  • Bonus % based on LOWEST active package")
        print("  • Maximum $220 per match to user")
        print("  • Excess goes to admin wallet")
        print("  • Applies to entire upline (no depth limit)")
        print("\n💰 Bonus Rates:")
        print("  • $50 Bronze    → 5%")
        print("  • $100 Silver   → 6%")
        print("  • $300 Gold     → 7%")
        print("  • $1,000 Diamond → 8%")
        print("  • $3,000 Platinum → 9%")
        print("  • $5,000 Elite  → 10%")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during migration: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
