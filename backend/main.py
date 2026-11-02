from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import jwt

load_dotenv()

app = FastAPI(title="Avenza API")

# CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'avenzaweb'),
    'user': os.getenv('DB_USER', 'avenzauser'),
    'password': os.getenv('DB_PASSWORD', '123456')
}

JWT_SECRET = os.getenv('JWT_SECRET', 'your-jwt-secret-change-this')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def get_db():
    """Get database connection"""
    conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

def create_token(user_id: int, email: str, user_type: str):
    """Create JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'type': user_type,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Request Models
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    name: str
    email: str
    phone: str
    password: str
    confirm_password: str
    referral_id: str = None

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str = None
    user: dict = None

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Avenza API is running", "version": "1.0.0"}

# User Login
@app.post("/login", response_model=LoginResponse)
@app.post("/api/login", response_model=LoginResponse)
def user_login(request: LoginRequest, db = Depends(get_db)):
    """User login endpoint"""
    try:
        cursor = db.cursor()
        
        # Find user by email (username is email)
        cursor.execute(
            "SELECT id, email, password_hash, full_name, is_active FROM users WHERE email = %s",
            (request.username,)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check password (plain text comparison - no hashing as requested)
        if user['password_hash'] != request.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check if user is active
        if not user['is_active']:
            raise HTTPException(status_code=403, detail="Account is inactive. Contact support.")
        
        # Create token
        token = create_token(user['id'], user['email'], 'user')
        
        return LoginResponse(
            success=True,
            message="Login successful",
            token=token,
            user={
                'id': user['id'],
                'email': user['email'],
                'name': user['full_name'] or user['email'].split('@')[0],
                'type': 'user'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

# User Registration
@app.post("/register", response_model=LoginResponse)
@app.post("/api/register", response_model=LoginResponse)
def user_register(request: RegisterRequest, db = Depends(get_db)):
    """User registration endpoint"""
    try:
        cursor = db.cursor()
        
        # Validate passwords match
        if request.password != request.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (request.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (request.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Generate unique 4-digit referral code
        import random
        while True:
            referral_code = str(random.randint(1000, 9999))
            cursor.execute("SELECT id FROM users WHERE referral_code = %s", (referral_code,))
            if not cursor.fetchone():
                break
        
        # Find sponsor by referral ID (if provided)
        sponsor_id = None
        if request.referral_id:
            cursor.execute("SELECT id FROM users WHERE referral_code = %s", (request.referral_id,))
            sponsor = cursor.fetchone()
            if sponsor:
                sponsor_id = sponsor['id']
        
        # If no referral_id or invalid, use admin as sponsor (id = 1)
        if not sponsor_id:
            cursor.execute("SELECT id FROM admins LIMIT 1")
            admin = cursor.fetchone()
            # Create a dummy admin user entry if needed for binary tree
            cursor.execute("SELECT id FROM users WHERE email = 'admin@avenza.live'")
            admin_user = cursor.fetchone()
            if not admin_user:
                cursor.execute("""
                    INSERT INTO users (username, email, password_hash, full_name, referral_code, is_active)
                    VALUES ('admin', 'admin@avenza.live', 'avenza', 'Admin', '0000', true)
                    RETURNING id
                """)
                admin_user = cursor.fetchone()
            sponsor_id = admin_user['id']
        
        # Binary MLM: Find position (left or right) under sponsor
        cursor.execute("""
            SELECT left_child_id, right_child_id FROM users WHERE id = %s
        """, (sponsor_id,))
        sponsor_data = cursor.fetchone()
        
        position = None
        if sponsor_data:
            if not sponsor_data['left_child_id']:
                position = 'left'
            elif not sponsor_data['right_child_id']:
                position = 'right'
            else:
                # Find available position in the tree (level-order traversal)
                position = 'left'  # Default for full tree
        else:
            position = 'left'
        
        # Create user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, phone, referral_code, sponsor_id, position, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true)
            RETURNING id, username, email, full_name
        """, (request.username, request.email, request.password, request.name, request.phone, referral_code, sponsor_id, position))
        
        new_user = cursor.fetchone()
        
        # Update sponsor's left or right child
        if position == 'left':
            cursor.execute("UPDATE users SET left_child_id = %s WHERE id = %s", (new_user['id'], sponsor_id))
        else:
            cursor.execute("UPDATE users SET right_child_id = %s WHERE id = %s", (new_user['id'], sponsor_id))
        
        db.commit()
        
        # Create token
        token = create_token(new_user['id'], new_user['email'], 'user')
        
        return LoginResponse(
            success=True,
            message="Registration successful! Welcome to Avenza.",
            token=token,
            user={
                'id': new_user['id'],
                'email': new_user['email'],
                'username': new_user['username'],
                'name': new_user['full_name'],
                'referral_code': referral_code,
                'type': 'user'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

# Admin Login
@app.post("/admin/login", response_model=LoginResponse)
@app.post("/api/admin/login", response_model=LoginResponse)
def admin_login(request: LoginRequest, db = Depends(get_db)):
    """Admin login endpoint"""
    try:
        cursor = db.cursor()
        
        # Find admin by email
        cursor.execute(
            "SELECT id, email, password_hash, full_name, is_active, role FROM admins WHERE email = %s",
            (request.username,)
        )
        admin = cursor.fetchone()
        
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check password (plain text comparison - no hashing as requested)
        if admin['password_hash'] != request.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check if admin is active
        if not admin['is_active']:
            raise HTTPException(status_code=403, detail="Account is inactive")
        
        # Create token
        token = create_token(admin['id'], admin['email'], 'admin')
        
        return LoginResponse(
            success=True,
            message="Admin login successful",
            token=token,
            user={
                'id': admin['id'],
                'email': admin['email'],
                'name': admin['full_name'] or 'Admin',
                'role': admin['role'],
                'type': 'admin'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

# Health check
@app.get("/health")
@app.get("/api/health")
def health_check():
    """Check if API and database are healthy"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8028)
