"""
User Model
Database table structure for users
"""

USER_TABLE_SQL = """
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
"""

# User fields for registration
REGISTRATION_FIELDS = [
    'username',
    'email', 
    'password',
    'name',
    'mobile',
    'referral_code',
    'sponsor_id',
    'position'
]

# User fields for login
LOGIN_FIELDS = [
    'id',
    'username',
    'email',
    'name',
    'referral_code',
    'is_active'
]
