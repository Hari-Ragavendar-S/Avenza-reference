from datetime import datetime, timedelta
import jwt
import os

JWT_SECRET = os.getenv('JWT_SECRET', 'your-jwt-secret-change-this')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def create_token(user_id: int, username: str, user_type: str = 'user'):
    """Create JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'type': user_type,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
