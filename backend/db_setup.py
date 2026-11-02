import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'avenzaweb'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', '123456')
}

def create_database():
    """Create database if not exists"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database='postgres',
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG['database'],))
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(
                sql.Identifier(DB_CONFIG['database'])
            ))
            print(f"✅ Database '{DB_CONFIG['database']}' created successfully")
        else:
            print(f"ℹ️  Database '{DB_CONFIG['database']}' already exists")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def get_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def run_migrations():
    """Run all database migrations"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("🔄 Running migrations...")
        
        # Migration 1: Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                phone VARCHAR(20),
                wallet_address VARCHAR(255),
                balance DECIMAL(20, 8) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_verified BOOLEAN DEFAULT false,
                kyc_status VARCHAR(50) DEFAULT 'pending',
                referral_code VARCHAR(10) UNIQUE,
                referred_by INTEGER REFERENCES users(id),
                sponsor_id INTEGER REFERENCES users(id),
                left_child_id INTEGER REFERENCES users(id),
                right_child_id INTEGER REFERENCES users(id),
                position VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Users table created")
        
        # Migration 2: Create admins table
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
        
        # Migration 3: Create deposits table
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
        
        # Migration 4: Create withdrawals table
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
        
        # Migration 5: Create investments table
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
        
        # Migration 6: Create transactions table (general ledger)
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
        
        # Migration 7: Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)")
        print("✅ Indexes created")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n🎉 All migrations completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        conn.rollback()
        return False

def seed_admin():
    """Create default admin user"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if admin exists
        cursor.execute("SELECT id FROM admins WHERE email = %s", ('admin@avenza.live',))
        if cursor.fetchone():
            print("ℹ️  Admin user already exists")
            cursor.close()
            conn.close()
            return
        
        # Create admin with plain text password (no hashing)
        cursor.execute("""
            INSERT INTO admins (email, password_hash, full_name, role)
            VALUES (%s, %s, %s, %s)
        """, ('admin@avenza.live', 'avenza', 'Avenza Admin', 'superadmin'))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Default admin created:")
        print("   Email: admin@avenza.live")
        print("   Password: avenza")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")

if __name__ == '__main__':
    print("🚀 Starting database setup...\n")
    
    if create_database():
        if run_migrations():
            seed_admin()
            print("\n✨ Database setup complete!")
        else:
            print("\n❌ Setup failed at migrations")
    else:
        print("\n❌ Setup failed at database creation")
