import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'avenzaweb'),
    'user': os.getenv('DB_USER', 'avenzauser'),
    'password': os.getenv('DB_PASSWORD', '123456')
}

def get_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def setup_database():
    """Setup all database tables"""
    print("🚀 Starting database setup...\n")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Users table
        print("Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                mobile VARCHAR(20) NOT NULL,
                referral_code VARCHAR(10) UNIQUE NOT NULL,
                referred_by INTEGER REFERENCES users(id),
                sponsor_id INTEGER REFERENCES users(id),
                left_child_id INTEGER REFERENCES users(id),
                right_child_id INTEGER REFERENCES users(id),
                position VARCHAR(10),
                balance DECIMAL(20, 8) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Users table created")
        
        # Admins table
        print("Creating admins table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Admins table created")
        
        # Deposits table
        print("Creating deposits table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deposits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(20, 8) NOT NULL,
                currency VARCHAR(20) DEFAULT 'USDT',
                transaction_hash VARCHAR(255),
                wallet_address VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                network VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP
            )
        """)
        print("✅ Deposits table created")
        
        # Withdrawals table
        print("Creating withdrawals table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS withdrawals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(20, 8) NOT NULL,
                currency VARCHAR(20) DEFAULT 'USDT',
                wallet_address VARCHAR(255) NOT NULL,
                transaction_hash VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                network VARCHAR(50),
                fee DECIMAL(20, 8) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP
            )
        """)
        print("✅ Withdrawals table created")
        
        # Investments table
        print("Creating investments table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS investments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                plan_name VARCHAR(100),
                amount DECIMAL(20, 8) NOT NULL,
                roi_percentage DECIMAL(5, 2),
                duration_days INTEGER,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        print("✅ Investments table created")
        
        # Transactions table
        print("Creating transactions table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                amount DECIMAL(20, 8) NOT NULL,
                currency VARCHAR(20) DEFAULT 'USDT',
                description TEXT,
                reference_id INTEGER,
                reference_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Transactions table created")
        
        # Create indexes
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)")
        print("✅ Indexes created")
        
        # Create default admin
        print("\nCreating default admin...")
        cursor.execute("SELECT id FROM admins WHERE email = %s", ('admin@avenza.live',))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO admins (email, password_hash, full_name, role)
                VALUES (%s, %s, %s, %s)
            """, ('admin@avenza.live', 'avenza', 'Avenza Admin', 'superadmin'))
            print("✅ Default admin created:")
            print("   Email: admin@avenza.live")
            print("   Password: avenza")
        else:
            print("ℹ️  Admin already exists")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n✨ Database setup complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == '__main__':
    setup_database()
