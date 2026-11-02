"""
Binary Matching Awards & Rewards Update
Add 2 new tiers at beginning and prize fields for BMW and Villa
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Update binary matching to awards & rewards system"""
    
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'avenzaweb'),
        user=os.getenv('DB_USER', 'avenzauser'),
        password=os.getenv('DB_PASSWORD', '123456'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("🚀 Starting Binary Matching Awards & Rewards Update...")
        
        # 1. Add new columns to binary_matching_tiers table
        print("\n📝 Adding prize columns to binary_matching_tiers table...")
        cursor.execute("""
            ALTER TABLE binary_matching_tiers 
            ADD COLUMN IF NOT EXISTS prize_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS prize_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS prize_description TEXT,
            ADD COLUMN IF NOT EXISTS prize_image_url TEXT;
        """)
        print("✅ Prize columns added")
        
        # 2. Update existing tier levels (shift by 2) - DESCENDING order to avoid conflicts
        print("\n🔄 Shifting existing tiers...")
        cursor.execute("""
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 10;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 9;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 8;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 7;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 6;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 5;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 4;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 3;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 2;
            UPDATE binary_matching_tiers SET level = level + 2 WHERE level = 1;
        """)
        print("✅ Existing tiers shifted")
        
        # 3. Insert 2 new tiers at the beginning
        print("\n💰 Inserting new starting tiers...")
        cursor.execute("""
            INSERT INTO binary_matching_tiers (level, required_match, bonus_amount, prize_type, prize_name) VALUES
            (1, 1000, 10, 'cash', 'Starting Bonus'),
            (2, 2500, 25, 'cash', 'Beginner Achievement')
            ON CONFLICT (level) DO NOTHING;
        """)
        print("✅ New tiers inserted")
        
        # 4. Update tier 11 (old tier 9) with BMW prize
        print("\n🚗 Adding BMW prize to tier 11...")
        cursor.execute("""
            UPDATE binary_matching_tiers 
            SET prize_type = 'vehicle',
                prize_name = 'BMW X5 M Sport',
                prize_description = 'Luxury BMW X5 M Sport - Premium SUV with all features',
                prize_image_url = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'
            WHERE level = 11;
        """)
        print("✅ BMW prize added to tier 11")
        
        # 5. Update tier 12 (old tier 10) with Dubai Villa prize
        print("\n🏡 Adding Dubai Villa prize to tier 12...")
        cursor.execute("""
            UPDATE binary_matching_tiers 
            SET prize_type = 'property',
                prize_name = 'Dubai Luxury Villa',
                prize_description = 'Waterfront villa in Palm Jumeirah, Dubai - 5 BHK, 8000 sq ft, private beach access',
                prize_image_url = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
            WHERE level = 12;
        """)
        print("✅ Dubai Villa prize added to tier 12")
        
        # 6. Add prize claim status column to binary_matching_claims
        print("\n🏆 Adding prize claim tracking...")
        cursor.execute("""
            ALTER TABLE binary_matching_claims 
            ADD COLUMN IF NOT EXISTS prize_claimed BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS prize_claim_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS prize_claim_notes TEXT;
        """)
        print("✅ Prize claim tracking added")
        
        # 7. Commit changes
        conn.commit()
        
        print("\n" + "="*50)
        print("✅ BINARY MATCHING AWARDS & REWARDS UPDATE COMPLETE!")
        print("="*50)
        print("\n📊 Summary:")
        print("  • 2 new tiers added: Level 1 ($1K) and Level 2 ($2.5K)")
        print("  • All existing tiers shifted up by 2 levels")
        print("  • Tier 11: BMW X5 M Sport prize added")
        print("  • Tier 12: Dubai Luxury Villa prize added")
        print("  • Prize tracking columns added")
        print("\n🎯 New Tier Structure:")
        
        cursor.execute("SELECT level, required_match, bonus_amount, prize_name FROM binary_matching_tiers ORDER BY level")
        tiers = cursor.fetchall()
        for tier in tiers:
            prize_info = f" + {tier['prize_name']}" if tier['prize_name'] else ""
            print(f"  Level {tier['level']:2d}: ${tier['required_match']:,} → ${tier['bonus_amount']:,}{prize_info}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during migration: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
