import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'avenzaweb'),
    'user': os.getenv('DB_USER', 'avenzauser'),
    'password': os.getenv('DB_PASSWORD', '123456')
}

def create_mother_id():
    """Create mother ID user with admin as referrer"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🚀 Creating Mother ID user...\n")
        
        # First, create admin user entry if not exists
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        admin_user = cursor.fetchone()
        
        if not admin_user:
            print("Creating admin user entry in users table...")
            cursor.execute("""
                INSERT INTO users (username, email, password, name, mobile, referral_code, is_active)
                VALUES ('admin', 'admin@avenza.live', 'avenza', 'Admin', '+0000000000', '0000', true)
                RETURNING id
            """)
            admin_user = cursor.fetchone()
            conn.commit()
            print(f"✅ Admin user created with ID: {admin_user[0]}")
        else:
            print(f"ℹ️  Admin user already exists with ID: {admin_user[0]}")
        
        admin_id = admin_user[0]
        
        # Check if mother ID already exists
        cursor.execute("SELECT id FROM users WHERE username = 'mother'")
        if cursor.fetchone():
            print("\n⚠️  Mother ID user already exists!")
            cursor.close()
            conn.close()
            return
        
        # Create Mother ID user
        print("\nCreating Mother ID user...")
        cursor.execute("""
            INSERT INTO users (
                username, 
                email, 
                password, 
                name, 
                mobile, 
                referral_code, 
                sponsor_id,
                referred_by,
                position,
                is_active
            )
            VALUES (
                'mother',
                'mother@avenza.live',
                'mother123',
                'Mother ID',
                '+0000000001',
                '9999',
                %s,
                %s,
                'left',
                true
            )
            RETURNING id, username, email, referral_code
        """, (admin_id, admin_id))
        
        mother_user = cursor.fetchone()
        
        # Update admin's left child to point to mother
        cursor.execute("""
            UPDATE users SET left_child_id = %s WHERE id = %s
        """, (mother_user[0], admin_id))
        
        conn.commit()
        
        print("\n✅ Mother ID created successfully!")
        print(f"\n{'='*50}")
        print("MOTHER ID CREDENTIALS:")
        print(f"{'='*50}")
        print(f"Username:      mother")
        print(f"Email:         {mother_user[2]}")
        print(f"Password:      mother123")
        print(f"Referral Code: {mother_user[3]}")
        print(f"Referral Link: https://avenza.live/mother")
        print(f"Sponsor:       admin (ID: {admin_id})")
        print(f"Position:      Left child of admin")
        print(f"{'='*50}\n")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == '__main__':
    create_mother_id()
