"""
Level Income System Setup
- Creates tables for level income tracking (ROI to ROI)
- 20 levels: L1=10%, L2-3=5%, L4-6=3%, L7-10=2%, L11-20=1%
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
        
        print("🚀 Starting Level Income System Migration...")
        
        # Create level_income_config table
        print("📊 Creating level_income_config table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS level_income_config (
                id SERIAL PRIMARY KEY,
                level INTEGER NOT NULL UNIQUE,
                percentage DECIMAL(5,2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default level configuration
        print("📝 Inserting default level percentages...")
        levels_config = [
            (1, 10.00, 'Level 1 - Direct referrals ROI'),
            (2, 5.00, 'Level 2 - Second level ROI'),
            (3, 5.00, 'Level 3 - Third level ROI'),
            (4, 3.00, 'Level 4 - Fourth level ROI'),
            (5, 3.00, 'Level 5 - Fifth level ROI'),
            (6, 3.00, 'Level 6 - Sixth level ROI'),
            (7, 2.00, 'Level 7 - Seventh level ROI'),
            (8, 2.00, 'Level 8 - Eighth level ROI'),
            (9, 2.00, 'Level 9 - Ninth level ROI'),
            (10, 2.00, 'Level 10 - Tenth level ROI'),
        ]
        
        # Add levels 11-20 with 1%
        for level in range(11, 21):
            levels_config.append((level, 1.00, f'Level {level} - ROI income'))
        
        for level, percentage, description in levels_config:
            cursor.execute("""
                INSERT INTO level_income_config (level, percentage, description)
                VALUES (%s, %s, %s)
                ON CONFLICT (level) DO UPDATE 
                SET percentage = EXCLUDED.percentage,
                    description = EXCLUDED.description
            """, (level, percentage, description))
        
        # Create level_income_transactions table
        print("📊 Creating level_income_transactions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS level_income_transactions (
                id SERIAL PRIMARY KEY,
                recipient_id INTEGER NOT NULL REFERENCES users(id),
                from_user_id INTEGER NOT NULL REFERENCES users(id),
                level INTEGER NOT NULL,
                percentage DECIMAL(5,2) NOT NULL,
                roi_amount DECIMAL(15,2) NOT NULL,
                income_amount DECIMAL(15,2) NOT NULL,
                investment_id INTEGER REFERENCES user_investments(id),
                transaction_type VARCHAR(50) DEFAULT 'level_income',
                status VARCHAR(20) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        print("🔍 Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_level_income_recipient 
            ON level_income_transactions(recipient_id, created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_level_income_from_user 
            ON level_income_transactions(from_user_id, created_at DESC)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_level_income_date 
            ON level_income_transactions(created_at DESC)
        """)
        
        conn.commit()
        print("✅ Level Income System Migration Completed Successfully!")
        print("\n📊 Level Income Configuration:")
        cursor.execute("SELECT level, percentage, description FROM level_income_config ORDER BY level")
        for row in cursor.fetchall():
            print(f"   Level {row['level']}: {row['percentage']}% - {row['description']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    run_migration()
