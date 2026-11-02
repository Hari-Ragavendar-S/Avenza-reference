"""
Referral Bonus System Setup
- Creates tables for one-time referral bonuses
- Progressive rates: 1st=5%, 2nd=6%, 3rd=7%, 4th=8%, 5th=9%, 6+=10%
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'avenzaweb',
    'user': 'avenzauser',
    'password': '123456'
}

def run_migration():
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("🚀 Starting Referral Bonus System Migration...")
        
        # Create referral_bonus_config table
        print("📊 Creating referral_bonus_config table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS referral_bonus_config (
                id SERIAL PRIMARY KEY,
                referral_number INTEGER NOT NULL UNIQUE,
                percentage DECIMAL(5,2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default referral bonus configuration
        print("📝 Inserting default referral bonus percentages...")
        bonus_config = [
            (1, 5.00, '1st Direct Referral - 5% of investment'),
            (2, 6.00, '2nd Direct Referral - 6% of investment'),
            (3, 7.00, '3rd Direct Referral - 7% of investment'),
            (4, 8.00, '4th Direct Referral - 8% of investment'),
            (5, 9.00, '5th Direct Referral - 9% of investment'),
            (6, 10.00, '6th+ Direct Referral - 10% of investment (MAX)'),
        ]
        
        for ref_num, percentage, description in bonus_config:
            cursor.execute("""
                INSERT INTO referral_bonus_config (referral_number, percentage, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (referral_number) DO UPDATE 
                SET percentage = EXCLUDED.percentage,
                    description = EXCLUDED.description
            """, (ref_num, percentage, description))
        
        # Create referral_bonuses table
        print("📊 Creating referral_bonuses table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS referral_bonuses (
                id SERIAL PRIMARY KEY,
                referrer_id INTEGER NOT NULL REFERENCES users(id),
                referral_id INTEGER NOT NULL REFERENCES users(id),
                investment_id INTEGER NOT NULL REFERENCES user_investments(id),
                referral_number INTEGER NOT NULL,
                investment_amount DECIMAL(15,2) NOT NULL,
                bonus_percentage DECIMAL(5,2) NOT NULL,
                bonus_amount DECIMAL(15,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                claimed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(referrer_id, investment_id)
            )
        """)
        
        # Create referral_bonus_claims table (for history)
        print("📊 Creating referral_bonus_claims table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS referral_bonus_claims (
                id SERIAL PRIMARY KEY,
                bonus_id INTEGER NOT NULL REFERENCES referral_bonuses(id),
                referrer_id INTEGER NOT NULL REFERENCES users(id),
                amount DECIMAL(15,2) NOT NULL,
                old_balance DECIMAL(15,2),
                new_balance DECIMAL(15,2),
                claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        print("🔍 Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_referral_bonus_referrer 
            ON referral_bonuses(referrer_id, status, created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_referral_bonus_referral 
            ON referral_bonuses(referral_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_referral_bonus_status 
            ON referral_bonuses(status, created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_bonus_claims_referrer 
            ON referral_bonus_claims(referrer_id, claimed_at DESC)
        """)
        
        conn.commit()
        print("✅ Referral Bonus System Migration Completed Successfully!")
        print("\n🎁 Referral Bonus Configuration:")
        cursor.execute("SELECT referral_number, percentage, description FROM referral_bonus_config ORDER BY referral_number")
        for row in cursor.fetchall():
            ref_label = f"{row['referral_number']}+" if row['referral_number'] == 6 else f"{row['referral_number']}"
            print(f"   {ref_label} Referral: {row['percentage']}% - {row['description']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    run_migration()
