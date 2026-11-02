"""
User Top-Up Routes
Public endpoint - anyone can top up any AVENZA user by username
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database.connection import get_db
from decimal import Decimal
from datetime import datetime
import pytz

router = APIRouter()

def get_ist_time():
    """Get current time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

def format_ist_time(dt):
    """Format datetime to IST string"""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    ist = pytz.timezone('Asia/Kolkata')
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    ist_time = dt.astimezone(ist)
    return ist_time.strftime('%b %d, %Y - %I:%M:%S %p IST')

# ==================== SCHEMAS ====================

class UserLookupRequest(BaseModel):
    username: str

class UserLookupResponse(BaseModel):
    success: bool
    user_id: int
    username: str
    name: str
    email: str

class UserTopUpRequest(BaseModel):
    username: str
    sender_name: str
    sender_phone: str
    sender_wallet_address: str
    amount: float
    network: str
    token_type: str
    transaction_hash: str

class UserTopUpResponse(BaseModel):
    success: bool
    message: str
    topup_id: int
    transaction_hash: str
    username: str
    amount: float

# ==================== USER LOOKUP ====================

@router.post("/public/user-topup/lookup", response_model=UserLookupResponse)
async def lookup_user(request: UserLookupRequest, db=Depends(get_db)):
    """
    Public endpoint - Check if AVENZA username exists
    Returns user details for confirmation
    """
    try:
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT id, username, name, email
            FROM users
            WHERE username = %s AND is_active = TRUE
        """, (request.username.lower(),))
        
        user = cursor.fetchone()
        cursor.close()
        
        if not user:
            raise HTTPException(status_code=404, detail=f"User '{request.username}' not found")
        
        return UserLookupResponse(
            success=True,
            user_id=user['id'],
            username=user['username'],
            name=user['name'],
            email=user['email']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== USER TOP-UP ====================

@router.post("/public/user-topup/submit", response_model=UserTopUpResponse)
async def submit_user_topup(request: UserTopUpRequest, db=Depends(get_db)):
    """
    Public endpoint - Submit top-up for specific AVENZA user
    Credits amount directly to user's AVENZA wallet
    """
    try:
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Check if transaction already exists
        cursor.execute("""
            SELECT id FROM user_topups 
            WHERE transaction_hash = %s
        """, (request.transaction_hash,))
        
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Transaction already recorded")
        
        # Get user details
        cursor.execute("""
            SELECT id, username, name, email, avenza_balance
            FROM users
            WHERE username = %s AND is_active = TRUE
            FOR UPDATE
        """, (request.username.lower(),))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail=f"User '{request.username}' not found")
        
        user_id = user['id']
        old_balance = Decimal(user['avenza_balance'] or 0)
        
        # Insert top-up record
        cursor.execute("""
            INSERT INTO user_topups
            (user_id, username, user_name, user_email, 
             sender_name, sender_phone, sender_wallet_address, 
             amount_received, network, token_type,
             amount_bep20_equivalent, transaction_hash, status, topped_up_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', %s)
            RETURNING id
        """, (
            user_id, user['username'], user['name'], user['email'],
            request.sender_name, request.sender_phone, request.sender_wallet_address,
            request.amount, request.network, request.token_type, 
            request.amount, request.transaction_hash, ist_now
        ))
        
        topup_id = cursor.fetchone()['id']
        
        # Credit user's AVENZA wallet
        new_balance = old_balance + Decimal(str(request.amount))
        cursor.execute("""
            UPDATE users
            SET avenza_balance = %s
            WHERE id = %s
        """, (new_balance, user_id))
        
        # Create transaction record with tag
        cursor.execute("""
            INSERT INTO transactions
            (user_id, type, amount, currency, description,
             reference_id, reference_type, status, wallet_type, tag, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'deposit', request.amount, 'USDT',
            f'Public top-up from {request.sender_wallet_address[:10]}...',
            topup_id, 'user_topup', 'completed', 'avenza', 'user_topup',
            ist_now
        ))
        
        # Update public stats
        cursor.execute("""
            INSERT INTO public_stats (id, total_deposits_count, total_user_topups, 
                                     total_amount_received, last_deposit_at)
            VALUES (1, 1, 1, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                total_deposits_count = public_stats.total_deposits_count + 1,
                total_user_topups = public_stats.total_user_topups + 1,
                total_amount_received = public_stats.total_amount_received + %s,
                last_deposit_at = %s
        """, (request.amount, ist_now, request.amount, ist_now))
        
        db.commit()
        cursor.close()
        
        print(f"\n{'='*60}")
        print(f"💰 USER TOP-UP SUCCESSFUL")
        print(f"{'='*60}")
        print(f"Sender: {request.sender_name} ({request.sender_phone})")
        print(f"User: {user['username']} ({user['name']})")
        print(f"Amount: ${request.amount} USDT")
        print(f"Old Balance: ${old_balance}")
        print(f"New Balance: ${new_balance}")
        print(f"TX: {request.transaction_hash}")
        print(f"{'='*60}\n")
        
        return UserTopUpResponse(
            success=True,
            message=f"Successfully topped up {user['username']} with ${request.amount}",
            topup_id=topup_id,
            transaction_hash=request.transaction_hash,
            username=user['username'],
            amount=request.amount
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
