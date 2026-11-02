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

def create_avenza_user():
    """Create Avenza mother ID user with admin as referrer"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🚀 Setting up Avenza Mother ID...\n")
        
        # Get admin ID
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        admin_user = cursor.fetchone()
        
        if not admin_user:
            print("❌ Admin user not found! Run migrations/setup.py first.")
            return False
        
        admin_id = admin_user[0]
        print(f"✅ Admin user found with ID: {admin_id}")
        
        # Delete old mother user if exists
        cursor.execute("SELECT id FROM users WHERE username IN ('mother', 'avenza')")
        old_user = cursor.fetchone()
        if old_user:
            print(f"🗑️  Deleting old user (ID: {old_user[0]})...")
            
            # First, remove all references to this user
            cursor.execute("UPDATE users SET sponsor_id = NULL WHERE sponsor_id = %s", (old_user[0],))
            cursor.execute("UPDATE users SET referred_by = NULL WHERE referred_by = %s", (old_user[0],))
            cursor.execute("UPDATE users SET left_child_id = NULL WHERE left_child_id = %s", (old_user[0],))
            cursor.execute("UPDATE users SET right_child_id = NULL WHERE right_child_id = %s", (old_user[0],))
            
            # Now delete the user
            cursor.execute("DELETE FROM users WHERE id = %s", (old_user[0],))
            conn.commit()
            print("✅ Old user deleted")
        
        # Reset admin's children
        cursor.execute("UPDATE users SET left_child_id = NULL, right_child_id = NULL WHERE id = %s", (admin_id,))
        conn.commit()
        
        # Create Avenza Mother ID user
        print("\nCreating Avenza Mother ID user...")
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
                'avenza',
                'avenza@avenza.live',
                'avenzatop',
                'Avenza Mother ID',
                '+1234567890',
                '9999',
                %s,
                %s,
                'left',
                true
            )
            RETURNING id, username, email, mobile, referral_code
        """, (admin_id, admin_id))
        
        avenza_user = cursor.fetchone()
        
        # Update admin's left child to point to avenza
        cursor.execute("""
            UPDATE users SET left_child_id = %s WHERE id = %s
        """, (avenza_user[0], admin_id))
        
        conn.commit()
        
        print("\n✅ Avenza Mother ID created successfully!")
        print(f"\n{'='*60}")
        print("AVENZA MOTHER ID CREDENTIALS:")
        print(f"{'='*60}")
        print(f"Username:      avenza")
        print(f"Email:         {avenza_user[2]}")
        print(f"Password:      avenzatop")
        print(f"Mobile:        {avenza_user[3]}")
        print(f"Referral Code: {avenza_user[4]}")
        print(f"Referral Link: https://avenza.live/avenza")
        print(f"Sponsor:       admin (ID: {admin_id})")
        print(f"Position:      Left child of admin")
        print(f"{'='*60}\n")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == '__main__':
    create_avenza_user()
