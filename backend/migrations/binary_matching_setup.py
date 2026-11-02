"""
Binary Matching Bonus System Setup
Creates tables and columns for binary tree matching bonus system
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Setup binary matching bonus system"""
    
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("🚀 Starting Binary Matching Bonus System Setup...")
        
        # 1. Add columns to users table
        print("\n📝 Adding columns to users table...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS position VARCHAR(10),
            ADD COLUMN IF NOT EXISTS left_business DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS right_business DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS total_matched DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS pending_left DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS pending_right DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS matching_bonus_earned DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_matched_at TIMESTAMP;
        """)
        print("✅ Users table updated")
        
        # 2. Create binary_matching_tiers table
        print("\n📊 Creating binary_matching_tiers table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS binary_matching_tiers (
                id SERIAL PRIMARY KEY,
                level INT UNIQUE NOT NULL,
                required_match DECIMAL(15,2) NOT NULL,
                bonus_amount DECIMAL(15,2) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        print("✅ binary_matching_tiers table created")
        
        # 3. Insert matching tiers
        print("\n💰 Inserting matching bonus tiers...")
        cursor.execute("""
            INSERT INTO binary_matching_tiers (level, required_match, bonus_amount) VALUES
            (1, 5000, 50),
            (2, 10000, 100),
            (3, 25000, 250),
            (4, 50000, 500),
            (5, 100000, 1000),
            (6, 500000, 5000),
            (7, 1000000, 10000),
            (8, 2500000, 25000),
            (9, 5000000, 50000),
            (10, 10000000, 100000)
            ON CONFLICT (level) DO NOTHING;
        """)
        print("✅ Matching tiers inserted")
        
        # 4. Create binary_matching_history table
        print("\n📜 Creating binary_matching_history table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS binary_matching_history (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                matched_amount DECIMAL(15,2) NOT NULL,
                left_volume DECIMAL(15,2) NOT NULL,
                right_volume DECIMAL(15,2) NOT NULL,
                bonus_earned DECIMAL(15,2) NOT NULL,
                level_achieved INT,
                tier_name VARCHAR(50),
                previous_left DECIMAL(15,2) DEFAULT 0,
                previous_right DECIMAL(15,2) DEFAULT 0,
                carry_forward_left DECIMAL(15,2) DEFAULT 0,
                carry_forward_right DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        print("✅ binary_matching_history table created")
        
        # 5. Create binary_matching_claims table (for tier achievements)
        print("\n🏆 Creating binary_matching_claims table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS binary_matching_claims (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                tier_level INT NOT NULL,
                required_match DECIMAL(15,2) NOT NULL,
                bonus_amount DECIMAL(15,2) NOT NULL,
                claimed_at TIMESTAMP DEFAULT NOW(),
                matching_history_id INT REFERENCES binary_matching_history(id),
                UNIQUE(user_id, tier_level)
            );
        """)
        print("✅ binary_matching_claims table created")
        
        # 6. Create binary_tree_structure table (for efficient tree queries)
        print("\n🌳 Creating binary_tree_structure table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS binary_tree_structure (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) UNIQUE,
                parent_id INT REFERENCES users(id),
                left_child_id INT REFERENCES users(id),
                right_child_id INT REFERENCES users(id),
                position VARCHAR(10),
                depth INT DEFAULT 0,
                path TEXT,
                total_left_team INT DEFAULT 0,
                total_right_team INT DEFAULT 0,
                active_left_team INT DEFAULT 0,
                active_right_team INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
        print("✅ binary_tree_structure table created")
        
        # 7. Create indexes for performance
        print("\n⚡ Creating indexes...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_sponsor ON users(sponsor_id);
            CREATE INDEX IF NOT EXISTS idx_users_position ON users(position);
            CREATE INDEX IF NOT EXISTS idx_users_left_child ON users(left_child_id);
            CREATE INDEX IF NOT EXISTS idx_users_right_child ON users(right_child_id);
            CREATE INDEX IF NOT EXISTS idx_binary_tree_parent ON binary_tree_structure(parent_id);
            CREATE INDEX IF NOT EXISTS idx_binary_tree_position ON binary_tree_structure(position);
            CREATE INDEX IF NOT EXISTS idx_matching_history_user_date ON binary_matching_history(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_matching_history_user ON binary_matching_history(user_id);
        """)
        print("✅ Indexes created")
        
        # 8. Commit changes
        conn.commit()
        
        print("\n" + "="*50)
        print("✅ BINARY MATCHING BONUS SYSTEM SETUP COMPLETE!")
        print("="*50)
        print("\n📊 Summary:")
        print("  • Users table: 8 new columns added")
        print("  • binary_matching_tiers: 10 tiers configured")
        print("  • binary_matching_history: History tracking ready")
        print("  • binary_matching_claims: Achievement tracking ready")
        print("  • binary_tree_structure: Tree optimization ready")
        print("  • Indexes: Performance optimized")
        print("\n🎯 Next Steps:")
        print("  1. Run backend scripts to sync existing users")
        print("  2. Update registration to capture position")
        print("  3. Update investment flow to trigger matching")
        print("  4. Setup cron job for matching calculations")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during migration: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
