from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.transfer import (
    ProfileResponse, ProfileUpdateRequest, SetWalletPinRequest, 
    ChangeWalletPinRequest, ChangePasswordRequest,
    UserSearchResult, TransferRequest, TransferResponse,
    ChatTransferHistory, RecentChatUser, InternalTransferListResponse,
    TransactionDetailResponse, TransferHistoryItem
)
from app.database.connection import get_db
from app.utils.auth import verify_token
from decimal import Decimal
from datetime import datetime
import pytz
from typing import List

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

# ==================== PROFILE MANAGEMENT ====================

@router.get("/user/profile", response_model=ProfileResponse)
def get_user_profile(authorization: str = Header(None), db=Depends(get_db)):
    """Get user profile"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT id, username, name, email, mobile, profile_photo_url, wallet_pin,
                   avenza_balance, income_balance, gaming_balance,
                   wallet_address, wallet_type, is_active
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        cursor.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return ProfileResponse(
            id=user['id'],
            username=user['username'],
            name=user['name'],
            email=user['email'],
            mobile=user['mobile'],
            profile_photo_url=user['profile_photo_url'],
            wallet_pin_set=bool(user['wallet_pin']),
            avenza_balance=Decimal(user['avenza_balance'] or 0),
            income_balance=Decimal(user['income_balance'] or 0),
            gaming_balance=Decimal(user['gaming_balance'] or 0),
            wallet_address=user['wallet_address'],
            wallet_type=user['wallet_type'],
            is_active=user['is_active']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/user/profile")
def update_user_profile(
    request: ProfileUpdateRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Update user profile"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Build update query dynamically
        updates = []
        params = []
        
        if request.name:
            updates.append("name = %s")
            params.append(request.name)
        
        if request.email:
            # Check if email already exists
            cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", 
                         (request.email, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already in use")
            updates.append("email = %s")
            params.append(request.email)
        
        if request.mobile:
            updates.append("mobile = %s")
            params.append(request.mobile)
        
        if request.profile_photo_url:
            updates.append("profile_photo_url = %s")
            params.append(request.profile_photo_url)
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        
        db.commit()
        cursor.close()
        
        return {"success": True, "message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/user/wallet-pin/set")
def set_wallet_pin(
    request: SetWalletPinRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Set wallet PIN for first time"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Check if PIN already set
        cursor.execute("SELECT wallet_pin FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user['wallet_pin']:
            raise HTTPException(status_code=400, detail="Wallet PIN already set. Use change PIN endpoint.")
        
        # Set PIN
        cursor.execute("UPDATE users SET wallet_pin = %s WHERE id = %s", 
                      (request.pin, user_id))
        
        db.commit()
        cursor.close()
        
        return {"success": True, "message": "Wallet PIN set successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/user/wallet-pin/change")
def change_wallet_pin(
    request: ChangeWalletPinRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Change wallet PIN"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Verify old PIN
        cursor.execute("SELECT wallet_pin FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user['wallet_pin']:
            raise HTTPException(status_code=400, detail="No PIN set. Use set PIN endpoint first.")
        
        if user['wallet_pin'] != request.old_pin:
            raise HTTPException(status_code=401, detail="Incorrect old PIN")
        
        # Update PIN
        cursor.execute("UPDATE users SET wallet_pin = %s WHERE id = %s", 
                      (request.new_pin, user_id))
        
        db.commit()
        cursor.close()
        
        return {"success": True, "message": "Wallet PIN changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/user/password/change")
def change_password(
    request: ChangePasswordRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Change user password"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Verify current password
        cursor.execute("SELECT password FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user['password'] != request.current_password:
            raise HTTPException(status_code=401, detail="Incorrect current password")
        
        # Update password
        cursor.execute("UPDATE users SET password = %s WHERE id = %s", 
                      (request.new_password, user_id))
        
        db.commit()
        cursor.close()
        
        return {"success": True, "message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== P2P TRANSFER ====================

@router.get("/transfer/suggested-users")
def get_suggested_users(authorization: str = Header(None), db=Depends(get_db)):
    """Get 5 random suggested users for transfer"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get 5 random users excluding self
        cursor.execute("""
            SELECT id, username, name, mobile, profile_photo_url
            FROM users
            WHERE id != %s AND is_active = true
            ORDER BY RANDOM()
            LIMIT 5
        """, (user_id,))
        
        users = cursor.fetchall()
        cursor.close()
        
        user_list = [
            UserSearchResult(
                id=u['id'],
                username=u['username'],
                name=u['name'],
                mobile=u['mobile'],
                profile_photo_url=u['profile_photo_url']
            ) for u in users
        ]
        
        return {"success": True, "users": user_list}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/transfer/recent-chats")
def get_recent_chats(authorization: str = Header(None), db=Depends(get_db)):
    """Get users with recent transfer history"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get users with transfer history
        cursor.execute("""
            WITH transfer_users AS (
                SELECT 
                    CASE 
                        WHEN sender_id = %s THEN receiver_id
                        ELSE sender_id
                    END as other_user_id,
                    MAX(created_at) as last_transfer_date,
                    MAX(amount) as last_amount,
                    COUNT(*) as total_transfers
                FROM internal_transfers
                WHERE sender_id = %s OR receiver_id = %s
                GROUP BY other_user_id
                ORDER BY last_transfer_date DESC
                LIMIT 10
            )
            SELECT 
                u.id, u.username, u.name, u.profile_photo_url,
                tu.last_transfer_date, tu.last_amount, tu.total_transfers
            FROM transfer_users tu
            JOIN users u ON u.id = tu.other_user_id
        """, (user_id, user_id, user_id))
        
        chats = cursor.fetchall()
        cursor.close()
        
        chat_list = [
            RecentChatUser(
                id=c['id'],
                username=c['username'],
                name=c['name'],
                profile_photo_url=c['profile_photo_url'],
                last_transfer_date=format_ist_time(c['last_transfer_date']),
                last_amount=Decimal(c['last_amount']),
                total_transfers=c['total_transfers']
            ) for c in chats
        ]
        
        return {"success": True, "chats": chat_list}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/transfer/search")
def search_users(
    query: str,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Search users by username or mobile"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Search by username or mobile
        cursor.execute("""
            SELECT id, username, name, mobile, profile_photo_url
            FROM users
            WHERE id != %s 
            AND is_active = true
            AND (username ILIKE %s OR mobile ILIKE %s)
            LIMIT 10
        """, (user_id, f'%{query}%', f'%{query}%'))
        
        users = cursor.fetchall()
        cursor.close()
        
        user_list = [
            UserSearchResult(
                id=u['id'],
                username=u['username'],
                name=u['name'],
                mobile=u['mobile'],
                profile_photo_url=u['profile_photo_url']
            ) for u in users
        ]
        
        return {"success": True, "users": user_list}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/transfer/chat/{other_user_id}", response_model=ChatTransferHistory)
def get_chat_transfer_history(
    other_user_id: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get transfer history with specific user (chat view)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get other user info
        cursor.execute("""
            SELECT id, username, name, mobile, profile_photo_url
            FROM users WHERE id = %s
        """, (other_user_id,))
        
        other_user = cursor.fetchone()
        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get transfer history
        cursor.execute("""
            SELECT id, sender_id, sender_username, receiver_id, receiver_username,
                   amount, currency, status, description, created_at
            FROM internal_transfers
            WHERE (sender_id = %s AND receiver_id = %s)
               OR (sender_id = %s AND receiver_id = %s)
            ORDER BY created_at ASC
        """, (user_id, other_user_id, other_user_id, user_id))
        
        transfers = cursor.fetchall()
        cursor.close()
        
        transfer_list = [
            TransferHistoryItem(
                id=t['id'],
                sender_id=t['sender_id'],
                sender_username=t['sender_username'],
                receiver_id=t['receiver_id'],
                receiver_username=t['receiver_username'],
                amount=Decimal(t['amount']),
                currency=t['currency'],
                status=t['status'],
                description=t['description'],
                created_at=format_ist_time(t['created_at']),
                is_sent=(t['sender_id'] == user_id)
            ) for t in transfers
        ]
        
        return ChatTransferHistory(
            success=True,
            user=UserSearchResult(
                id=other_user['id'],
                username=other_user['username'],
                name=other_user['name'],
                mobile=other_user['mobile'],
                profile_photo_url=other_user['profile_photo_url']
            ),
            transfers=transfer_list,
            total=len(transfer_list)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/transfer/send", response_model=TransferResponse)
def send_money(
    request: TransferRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Send money to another user (P2P transfer)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        sender_id = user_data.get('user_id')
        sender_username = user_data.get('username')
        
        # Cannot transfer to self
        if sender_id == request.receiver_id:
            raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
        
        cursor = db.cursor()
        
        # Verify wallet PIN
        cursor.execute("SELECT wallet_pin FROM users WHERE id = %s", (sender_id,))
        sender = cursor.fetchone()
        
        if not sender['wallet_pin']:
            raise HTTPException(status_code=400, detail="Please set your wallet PIN first")
        
        if sender['wallet_pin'] != request.wallet_pin:
            raise HTTPException(status_code=401, detail="Incorrect wallet PIN")
        
        # Get sender balance
        cursor.execute("SELECT avenza_balance, username FROM users WHERE id = %s", (sender_id,))
        sender_data = cursor.fetchone()
        sender_balance = Decimal(sender_data['avenza_balance'] or 0)
        
        if sender_balance < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient AVENZA balance")
        
        # Get receiver info
        cursor.execute("SELECT username, name FROM users WHERE id = %s", (request.receiver_id,))
        receiver = cursor.fetchone()
        
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        
        receiver_username = receiver['username']
        ist_now = get_ist_time()
        
        # Create internal transfer record
        cursor.execute("""
            INSERT INTO internal_transfers (
                sender_id, sender_username, receiver_id, receiver_username,
                amount, currency, status, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            sender_id, sender_username, request.receiver_id, receiver_username,
            request.amount, 'USD', 'completed', request.description or f'P2P transfer to {receiver_username}'
        ))
        
        transfer_id = cursor.fetchone()['id']
        
        # Deduct from sender AVENZA balance
        cursor.execute("""
            UPDATE users 
            SET avenza_balance = avenza_balance - %s
            WHERE id = %s
            RETURNING avenza_balance
        """, (request.amount, sender_id))
        
        sender_new_balance = cursor.fetchone()['avenza_balance']
        
        # Add to receiver AVENZA balance
        cursor.execute("""
            UPDATE users 
            SET avenza_balance = avenza_balance + %s
            WHERE id = %s
        """, (request.amount, request.receiver_id))
        
        # Record sender transaction
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            sender_id, 'p2p_transfer_out', request.amount, 'USD',
            f'Sent to {receiver_username}',
            transfer_id, 'internal_transfer', 'completed', 'avenza'
        ))
        
        # Record receiver transaction
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            request.receiver_id, 'p2p_transfer_in', request.amount, 'USD',
            f'Received from {sender_username}',
            transfer_id, 'internal_transfer', 'completed', 'avenza'
        ))
        
        db.commit()
        cursor.close()
        
        return TransferResponse(
            success=True,
            message=f"Successfully sent ${request.amount} to {receiver_username}",
            transfer_id=transfer_id,
            sender_new_balance=Decimal(sender_new_balance),
            receiver_username=receiver_username,
            amount=request.amount,
            timestamp=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/transfer/history", response_model=InternalTransferListResponse)
def get_transfer_history(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's internal transfer history"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total FROM internal_transfers
            WHERE sender_id = %s OR receiver_id = %s
        """, (user_id, user_id))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transfers
        cursor.execute("""
            SELECT id, sender_id, sender_username, receiver_id, receiver_username,
                   amount, currency, status, description, created_at
            FROM internal_transfers
            WHERE sender_id = %s OR receiver_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, user_id, per_page, offset))
        
        transfers = cursor.fetchall()
        cursor.close()
        
        transfer_list = [
            TransferHistoryItem(
                id=t['id'],
                sender_id=t['sender_id'],
                sender_username=t['sender_username'],
                receiver_id=t['receiver_id'],
                receiver_username=t['receiver_username'],
                amount=Decimal(t['amount']),
                currency=t['currency'],
                status=t['status'],
                description=t['description'],
                created_at=format_ist_time(t['created_at']),
                is_sent=(t['sender_id'] == user_id)
            ) for t in transfers
        ]
        
        return InternalTransferListResponse(
            success=True,
            transfers=transfer_list,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== TRANSACTION DETAIL ====================

@router.get("/transaction/{transaction_id}", response_model=TransactionDetailResponse)
def get_transaction_detail(
    transaction_id: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get detailed transaction information"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get transaction
        cursor.execute("""
            SELECT id, user_id, type, amount, currency, description,
                   reference_id, reference_type, status, wallet_type, created_at
            FROM transactions
            WHERE id = %s AND user_id = %s
        """, (transaction_id, user_id))
        
        transaction = cursor.fetchone()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        response_data = {
            'id': transaction['id'],
            'user_id': transaction['user_id'],
            'type': transaction['type'],
            'amount': Decimal(transaction['amount']),
            'currency': transaction['currency'],
            'description': transaction['description'],
            'reference_id': transaction['reference_id'],
            'reference_type': transaction['reference_type'],
            'status': transaction['status'],
            'wallet_type': transaction['wallet_type'],
            'created_at': format_ist_time(transaction['created_at'])
        }
        
        # If P2P transfer, get other party details
        if transaction['reference_type'] == 'internal_transfer' and transaction['reference_id']:
            cursor.execute("""
                SELECT sender_id, sender_username, receiver_id, receiver_username
                FROM internal_transfers
                WHERE id = %s
            """, (transaction['reference_id'],))
            
            transfer = cursor.fetchone()
            
            if transfer:
                other_user_id = transfer['receiver_id'] if transfer['sender_id'] == user_id else transfer['sender_id']
                other_username = transfer['receiver_username'] if transfer['sender_id'] == user_id else transfer['sender_username']
                
                # Get other user details
                cursor.execute("""
                    SELECT name, profile_photo_url FROM users WHERE id = %s
                """, (other_user_id,))
                
                other_user = cursor.fetchone()
                
                if other_user:
                    response_data['other_party_username'] = other_username
                    response_data['other_party_name'] = other_user['name']
                    response_data['other_party_photo'] = other_user['profile_photo_url']
        
        cursor.close()
        
        return TransactionDetailResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/internal-transfers")
def get_all_internal_transfers(
    page: int = 1,
    per_page: int = 20,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get all internal transfers (admin only)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Build query
        conditions = []
        params = []
        
        if search:
            conditions.append("(sender_username ILIKE %s OR receiver_username ILIKE %s)")
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) as total FROM internal_transfers{where_clause}", params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transfers
        query = f"""
            SELECT id, sender_id, sender_username, receiver_id, receiver_username,
                   amount, currency, status, description, created_at
            FROM internal_transfers
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        
        transfers = cursor.fetchall()
        
        # Get stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(amount) as total_volume,
                AVG(amount) as avg_amount
            FROM internal_transfers
            WHERE status = 'completed'
        """)
        stats = cursor.fetchone()
        
        cursor.close()
        
        transfer_list = []
        for t in transfers:
            transfer_list.append({
                'id': t['id'],
                'sender_id': t['sender_id'],
                'sender_username': t['sender_username'],
                'receiver_id': t['receiver_id'],
                'receiver_username': t['receiver_username'],
                'amount': float(t['amount']),
                'currency': t['currency'],
                'status': t['status'],
                'description': t['description'],
                'created_at': format_ist_time(t['created_at'])
            })
        
        return {
            'success': True,
            'transfers': transfer_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'stats': {
                'total_transfers': stats['total'],
                'total_volume': float(stats['total_volume'] or 0),
                'average_amount': float(stats['avg_amount'] or 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
