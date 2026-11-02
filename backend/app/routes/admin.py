from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.admin import (
    AdminWalletTopupRequest, AdminWalletTopupResponse,
    UserBalanceAdjustRequest, UserBalanceAdjustResponse,
    AdminWalletBalanceResponse, UserDetailResponse, UserListItem,
    AdminChangePasswordRequest, AdminChangePasswordResponse,
    WithdrawalModeRequest, WithdrawalModeResponse,
    WithdrawalApproveRequest, WithdrawalRejectRequest, WithdrawalActionResponse
)
from app.database.connection import get_db
from app.utils.auth import create_token, verify_token
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

def format_ist_date(dt):
    """Format date/datetime to IST date string"""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    ist = pytz.timezone('Asia/Kolkata')
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    ist_time = dt.astimezone(ist)
    return ist_time.strftime('%b %d, %Y')

@router.post("/admin/login", response_model=LoginResponse)
def admin_login(request: LoginRequest, db=Depends(get_db)):
    """Admin login"""
    try:
        cursor = db.cursor()
        
        # Find admin by email/username
        cursor.execute("""
            SELECT id, email, password_hash, full_name, is_active, role 
            FROM admins WHERE email = %s
        """, (request.username,))
        admin = cursor.fetchone()
        
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check password (plain text)
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

# ==================== ADMIN PASSWORD CHANGE ====================

@router.put("/admin/password/change", response_model=AdminChangePasswordResponse)
def change_admin_password(
    request: AdminChangePasswordRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Change admin password"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        admin_data = verify_token(token)
        if not admin_data or admin_data.get('type') != 'admin':
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        admin_id = admin_data.get('user_id')
        
        # Validate passwords match
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=400, detail="New passwords do not match")
        
        # Validate password length
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        cursor = db.cursor()
        
        # Get current admin
        cursor.execute("""
            SELECT id, email, password_hash
            FROM admins
            WHERE id = %s
        """, (admin_id,))
        
        admin = cursor.fetchone()
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        
        # Verify current password
        if admin['password_hash'] != request.current_password:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update password
        cursor.execute("""
            UPDATE admins 
            SET password_hash = %s,
                updated_at = %s
            WHERE id = %s
        """, (request.new_password, get_ist_time(), admin_id))
        
        db.commit()
        cursor.close()
        
        return AdminChangePasswordResponse(
            success=True,
            message="Password changed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== WITHDRAWAL MODE MANAGEMENT ====================

@router.get("/admin/settings/withdrawal-mode", response_model=WithdrawalModeResponse)
def get_withdrawal_mode(authorization: str = Header(None), db=Depends(get_db)):
    """Get current withdrawal mode setting"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        admin_data = verify_token(token)
        if not admin_data or admin_data.get('type') != 'admin':
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        cursor = db.cursor()
        
        # Get withdrawal mode setting
        cursor.execute("""
            SELECT setting_value 
            FROM system_settings 
            WHERE setting_key = 'withdrawal_mode'
        """)
        
        result = cursor.fetchone()
        mode = result['setting_value'] if result else 'automatic'
        
        cursor.close()
        
        return WithdrawalModeResponse(
            success=True,
            message="Withdrawal mode retrieved",
            mode=mode
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/settings/withdrawal-mode", response_model=WithdrawalModeResponse)
def update_withdrawal_mode(
    request: WithdrawalModeRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Update withdrawal mode (automatic or manual)"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        admin_data = verify_token(token)
        if not admin_data or admin_data.get('type') != 'admin':
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        admin_id = admin_data.get('user_id')
        
        # Validate mode
        if request.mode not in ['automatic', 'manual']:
            raise HTTPException(status_code=400, detail="Mode must be 'automatic' or 'manual'")
        
        cursor = db.cursor()
        
        # Update or insert withdrawal mode setting
        cursor.execute("""
            INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
            VALUES ('withdrawal_mode', %s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET 
                setting_value = EXCLUDED.setting_value,
                updated_by = EXCLUDED.updated_by,
                updated_at = EXCLUDED.updated_at
        """, (request.mode, admin_id, get_ist_time()))
        
        db.commit()
        cursor.close()
        
        return WithdrawalModeResponse(
            success=True,
            message=f"Withdrawal mode changed to {request.mode}",
            mode=request.mode
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/withdrawal/{withdrawal_id}/approve", response_model=WithdrawalActionResponse)
def approve_withdrawal(
    withdrawal_id: int,
    request: WithdrawalApproveRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Approve a manual withdrawal request"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        admin_data = verify_token(token)
        if not admin_data or admin_data.get('type') != 'admin':
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        admin_id = admin_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get withdrawal details
        cursor.execute("""
            SELECT w.*, u.username
            FROM withdrawals w
            JOIN users u ON w.user_id = u.id
            WHERE w.id = %s
        """, (withdrawal_id,))
        
        withdrawal = cursor.fetchone()
        
        if not withdrawal:
            raise HTTPException(status_code=404, detail="Withdrawal not found")
        
        if withdrawal['status'] != 'pending':
            raise HTTPException(status_code=400, detail=f"Withdrawal is already {withdrawal['status']}")
        
        # Update withdrawal status to approved
        cursor.execute("""
            UPDATE withdrawals
            SET status = 'approved',
                admin_note = %s,
                processed_by = %s,
                processed_at = %s
            WHERE id = %s
        """, (request.admin_note, admin_id, get_ist_time(), withdrawal_id))
        
        db.commit()
        cursor.close()
        
        return WithdrawalActionResponse(
            success=True,
            message=f"Withdrawal approved for user @{withdrawal['username']}",
            withdrawal_id=withdrawal_id,
            status='approved'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/withdrawal/{withdrawal_id}/reject", response_model=WithdrawalActionResponse)
def reject_withdrawal(
    withdrawal_id: int,
    request: WithdrawalRejectRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Reject a manual withdrawal request and refund the amount"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        admin_data = verify_token(token)
        if not admin_data or admin_data.get('type') != 'admin':
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        admin_id = admin_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get withdrawal details
        cursor.execute("""
            SELECT w.*, u.username
            FROM withdrawals w
            JOIN users u ON w.user_id = u.id
            WHERE w.id = %s
        """, (withdrawal_id,))
        
        withdrawal = cursor.fetchone()
        
        if not withdrawal:
            raise HTTPException(status_code=404, detail="Withdrawal not found")
        
        if withdrawal['status'] != 'pending':
            raise HTTPException(status_code=400, detail=f"Withdrawal is already {withdrawal['status']}")
        
        # Refund the amount to user's avenza wallet
        cursor.execute("""
            UPDATE users
            SET avenza_balance = avenza_balance + %s
            WHERE id = %s
        """, (withdrawal['amount'], withdrawal['user_id']))
        
        # Update withdrawal status to rejected
        cursor.execute("""
            UPDATE withdrawals
            SET status = 'rejected',
                admin_note = %s,
                processed_by = %s,
                processed_at = %s
            WHERE id = %s
        """, (request.reason, admin_id, get_ist_time(), withdrawal_id))
        
        # Create refund transaction
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            withdrawal['user_id'], 'withdrawal_refund', withdrawal['amount'], 'USD',
            f"Withdrawal rejected - {request.reason or 'No reason provided'}",
            withdrawal_id, 'withdrawal', 'completed', 'avenza'
        ))
        
        db.commit()
        cursor.close()
        
        return WithdrawalActionResponse(
            success=True,
            message=f"Withdrawal rejected and refunded for user @{withdrawal['username']}",
            withdrawal_id=withdrawal_id,
            status='rejected'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN WALLET ENDPOINTS ====================

@router.get("/admin/wallet/settings")
def get_wallet_settings(authorization: str = Header(None), db=Depends(get_db)):
    """Get wallet settings (receiver address for deposits)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get receiver address from system_settings
        cursor.execute("""
            SELECT setting_value, updated_at
            FROM system_settings
            WHERE setting_key = 'receiver_address'
        """)
        
        result = cursor.fetchone()
        cursor.close()
        
        if result:
            return {
                'success': True,
                'receiver_address': result['setting_value'],
                'updated_at': format_ist_time(result['updated_at'])
            }
        else:
            return {
                'success': True,
                'receiver_address': None,
                'updated_at': None
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/wallet/settings")
def update_wallet_settings(
    request: dict,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Update wallet settings (receiver address for deposits)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = user_data.get('user_id')
        setting_value = request.get('setting_value')
        
        if not setting_value:
            raise HTTPException(status_code=400, detail="Setting value is required")
        
        # Validate address format (0x + 40 hex chars = 42 total)
        if not setting_value.startswith('0x') or len(setting_value) != 42:
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        
        cursor = db.cursor()
        
        # Update or insert receiver address
        cursor.execute("""
            INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
            VALUES ('receiver_address', %s, %s, %s)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by = EXCLUDED.updated_by,
                updated_at = EXCLUDED.updated_at
        """, (setting_value, admin_id, get_ist_time()))
        
        db.commit()
        cursor.close()
        
        return {
            'success': True,
            'message': 'Receiver address updated successfully',
            'receiver_address': setting_value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/wallet/balance", response_model=AdminWalletBalanceResponse)
def get_admin_wallet_balance(authorization: str = Header(None), db=Depends(get_db)):
    """Get admin wallet balance"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = user_data.get('user_id')
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT id, email, wallet_balance 
            FROM admins WHERE id = %s
        """, (admin_id,))
        
        admin = cursor.fetchone()
        cursor.close()
        
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        
        return AdminWalletBalanceResponse(
            admin_id=admin['id'],
            admin_username=admin['email'],
            wallet_balance=Decimal(admin['wallet_balance'] or 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/admin/wallet/topup", response_model=AdminWalletTopupResponse)
def admin_wallet_topup(request: AdminWalletTopupRequest, authorization: str = Header(None), db=Depends(get_db)):
    """Admin wallet top-up"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = user_data.get('user_id')
        admin_username = user_data.get('username')
        
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Get current balance
        cursor.execute("SELECT wallet_balance FROM admins WHERE id = %s", (admin_id,))
        admin = cursor.fetchone()
        balance_before = Decimal(admin['wallet_balance'] or 0)
        
        # Update admin wallet balance
        cursor.execute("""
            UPDATE admins 
            SET wallet_balance = wallet_balance + %s 
            WHERE id = %s
            RETURNING wallet_balance
        """, (request.amount, admin_id))
        
        balance_after = cursor.fetchone()['wallet_balance']
        
        # Record transaction
        cursor.execute("""
            INSERT INTO admin_wallet_transactions (
                admin_id, admin_username, transaction_type, 
                amount, balance_before, balance_after, 
                reason
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            admin_id, admin_username, 'topup',
            request.amount, balance_before, balance_after,
            'Admin wallet top-up'
        ))
        
        transaction_id = cursor.fetchone()['id']
        
        db.commit()
        cursor.close()
        
        return AdminWalletTopupResponse(
            success=True,
            message=f"Wallet topped up with ${request.amount}",
            new_balance=Decimal(balance_after),
            transaction_id=transaction_id,
            timestamp=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/admin/user/balance/adjust", response_model=UserBalanceAdjustResponse)
def adjust_user_balance(request: UserBalanceAdjustRequest, authorization: str = Header(None), db=Depends(get_db)):
    """Credit or debit user balance (admin wallet operation)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = user_data.get('user_id')
        admin_username = user_data.get('username')
        
        # Validate inputs
        if request.wallet_type not in ['avenza', 'income', 'gaming']:
            raise HTTPException(status_code=400, detail="Invalid wallet type")
        
        if request.action not in ['credit', 'debit']:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Get admin wallet balance
        cursor.execute("SELECT wallet_balance FROM admins WHERE id = %s", (admin_id,))
        admin = cursor.fetchone()
        admin_balance_before = Decimal(admin['wallet_balance'] or 0)
        
        # Check if admin has enough balance for credit operation
        if request.action == 'credit' and admin_balance_before < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient admin wallet balance")
        
        # Get user info
        cursor.execute(f"""
            SELECT username, {request.wallet_type}_balance 
            FROM users WHERE id = %s
        """, (request.user_id,))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        username = user['username']
        user_balance_before = Decimal(user[f'{request.wallet_type}_balance'] or 0)
        
        # Check if user has enough balance for debit operation
        if request.action == 'debit' and user_balance_before < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient user balance")
        
        # Perform the operation
        if request.action == 'credit':
            # Admin gives money to user: admin balance decreases, user balance increases
            cursor.execute("""
                UPDATE admins 
                SET wallet_balance = wallet_balance - %s 
                WHERE id = %s
                RETURNING wallet_balance
            """, (request.amount, admin_id))
            admin_balance_after = cursor.fetchone()['wallet_balance']
            
            cursor.execute(f"""
                UPDATE users 
                SET {request.wallet_type}_balance = {request.wallet_type}_balance + %s 
                WHERE id = %s
                RETURNING {request.wallet_type}_balance
            """, (request.amount, request.user_id))
            user_balance_after = cursor.fetchone()[f'{request.wallet_type}_balance']
            
        else:  # debit
            # Admin takes money from user: admin balance increases, user balance decreases
            cursor.execute("""
                UPDATE admins 
                SET wallet_balance = wallet_balance + %s 
                WHERE id = %s
                RETURNING wallet_balance
            """, (request.amount, admin_id))
            admin_balance_after = cursor.fetchone()['wallet_balance']
            
            cursor.execute(f"""
                UPDATE users 
                SET {request.wallet_type}_balance = {request.wallet_type}_balance - %s 
                WHERE id = %s
                RETURNING {request.wallet_type}_balance
            """, (request.amount, request.user_id))
            user_balance_after = cursor.fetchone()[f'{request.wallet_type}_balance']
        
        # Record transaction
        cursor.execute("""
            INSERT INTO admin_wallet_transactions (
                admin_id, admin_username, transaction_type,
                user_id, username, wallet_type, action,
                amount, balance_before, balance_after, reason
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            admin_id, admin_username, 'balance_adjustment',
            request.user_id, username, request.wallet_type, request.action,
            request.amount, admin_balance_before, admin_balance_after, request.reason
        ))
        
        transaction_id = cursor.fetchone()['id']
        
        # Also record in user's transactions
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            request.user_id, 
            'admin_credit' if request.action == 'credit' else 'admin_debit',
            request.amount, 'USD',
            f'Admin {request.action}: {request.reason}',
            transaction_id, 'admin_adjustment', 'completed',
            request.wallet_type
        ))
        
        db.commit()
        cursor.close()
        
        action_msg = "credited to" if request.action == 'credit' else "debited from"
        
        return UserBalanceAdjustResponse(
            success=True,
            message=f"${request.amount} {action_msg} user {username}",
            user_new_balance=Decimal(user_balance_after),
            admin_new_balance=Decimal(admin_balance_after),
            transaction_id=transaction_id,
            timestamp=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== USER MANAGEMENT ENDPOINTS ====================

@router.get("/admin/users")
def get_all_users(
    page: int = 1,
    per_page: int = 20,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get all users with pagination and search"""
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
            conditions.append("""
                (username ILIKE %s OR email ILIKE %s OR name ILIKE %s OR mobile ILIKE %s)
            """)
            search_param = f'%{search}%'
            params.extend([search_param, search_param, search_param, search_param])
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) as total FROM users{where_clause}", params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get users
        query = f"""
            SELECT id, username, email, name, mobile, referral_code,
                   avenza_balance, income_balance, gaming_balance,
                   created_at
            FROM users
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        
        users = cursor.fetchall()
        cursor.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'name': user['name'],
                'mobile': user['mobile'],
                'referral_code': user['referral_code'],
                'avenza_balance': float(user['avenza_balance'] or 0),
                'income_balance': float(user['income_balance'] or 0),
                'gaming_balance': float(user['gaming_balance'] or 0),
                'status': 'active',
                'created_at': format_ist_time(user['created_at'])
            })
        
        return {
            'success': True,
            'users': users_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/user/{user_id}", response_model=UserDetailResponse)
def get_user_detail(user_id: int, authorization: str = Header(None), db=Depends(get_db)):
    """Get detailed user information"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get user details
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.name, u.mobile, u.password,
                   u.referral_code, u.sponsor_id, u.position, u.wallet_pin,
                   u.avenza_balance, u.income_balance, u.gaming_balance,
                   u.created_at, u.last_login_1, u.last_login_2, u.last_login_3,
                   s.username as sponsor_username
            FROM users u
            LEFT JOIN users s ON u.sponsor_id = s.id
            WHERE u.id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        cursor.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserDetailResponse(
            id=user['id'],
            username=user['username'],
            email=user['email'],
            name=user['name'],
            mobile=user['mobile'],
            password=user['password'],
            referral_code=user['referral_code'],
            sponsor_id=user['sponsor_id'],
            sponsor_username=user['sponsor_username'],
            position=user['position'],
            wallet_pin_set=bool(user['wallet_pin']),
            avenza_balance=Decimal(user['avenza_balance'] or 0),
            income_balance=Decimal(user['income_balance'] or 0),
            gaming_balance=Decimal(user['gaming_balance'] or 0),
            status='active',
            created_at=format_ist_time(user['created_at']),
            last_login_1=format_ist_time(user['last_login_1']),
            last_login_2=format_ist_time(user['last_login_2']),
            last_login_3=format_ist_time(user['last_login_3'])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/wallet/transactions")
def get_admin_wallet_transactions(
    page: int = 1,
    per_page: int = 20,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get admin wallet transaction history"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Build query
        conditions = ["admin_id = %s"]
        params = [admin_id]
        
        if search:
            conditions.append("(username ILIKE %s OR reason ILIKE %s)")
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        where_clause = " WHERE " + " AND ".join(conditions)
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) as total FROM admin_wallet_transactions{where_clause}", params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transactions
        query = f"""
            SELECT id, transaction_type, user_id, username, wallet_type, action,
                   amount, reason, balance_before, balance_after, created_at
            FROM admin_wallet_transactions
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        
        transactions = cursor.fetchall()
        cursor.close()
        
        trans_list = []
        for trans in transactions:
            trans_list.append({
                'id': trans['id'],
                'type': trans['transaction_type'],
                'user_id': trans['user_id'],
                'username': trans['username'],
                'wallet_type': trans['wallet_type'],
                'action': trans['action'],
                'amount': float(trans['amount']),
                'reason': trans['reason'],
                'balance_before': float(trans['balance_before'] or 0),
                'balance_after': float(trans['balance_after'] or 0),
                'created_at': format_ist_time(trans['created_at'])
            })
        
        return {
            'success': True,
            'transactions': trans_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.get("/admin/user/{user_id}/transactions")
def get_user_transactions(
    user_id: int,
    limit: int = 5,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's recent transactions"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT id, type, amount, currency, description, status, wallet_type, created_at
            FROM transactions
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (user_id, limit))
        
        transactions = cursor.fetchall()
        cursor.close()
        
        trans_list = []
        for trans in transactions:
            trans_list.append({
                'id': trans['id'],
                'type': trans['type'],
                'amount': float(trans['amount']),
                'currency': trans['currency'],
                'description': trans['description'],
                'status': trans['status'],
                'wallet_type': trans['wallet_type'],
                'created_at': format_ist_time(trans['created_at'])
            })
        
        return {
            'success': True,
            'transactions': trans_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/user/{user_id}/team")
def get_user_team(user_id: int, authorization: str = Header(None), db=Depends(get_db)):
    """Get user's team (left and right)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get left and right children
        cursor.execute("""
            SELECT left_child_id, right_child_id FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        team = {'left': None, 'right': None}
        
        if user and user['left_child_id']:
            cursor.execute("""
                SELECT id, username, name, email FROM users WHERE id = %s
            """, (user['left_child_id'],))
            left = cursor.fetchone()
            if left:
                team['left'] = {
                    'id': left['id'],
                    'username': left['username'],
                    'name': left['name'],
                    'email': left['email']
                }
        
        if user and user['right_child_id']:
            cursor.execute("""
                SELECT id, username, name, email FROM users WHERE id = %s
            """, (user['right_child_id'],))
            right = cursor.fetchone()
            if right:
                team['right'] = {
                    'id': right['id'],
                    'username': right['username'],
                    'name': right['name'],
                    'email': right['email']
                }
        
        cursor.close()
        
        return {
            'success': True,
            'team': team
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/user/{user_id}/investments")
def get_user_investments(user_id: int, authorization: str = Header(None), db=Depends(get_db)):
    """Get user's active investments (Admin)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get user's investments with package details
        cursor.execute("""
            SELECT 
                ui.id, ui.invested_amount, ui.total_earned,
                ui.daily_profit, ui.max_profit, ui.enrollment_date,
                ui.status, ui.last_profit_date,
                ip.name as package_name, ip.daily_profit_percentage
            FROM user_investments ui
            JOIN investment_packages ip ON ui.package_id = ip.id
            WHERE ui.user_id = %s
            ORDER BY ui.enrollment_date DESC
        """, (user_id,))
        
        investments = cursor.fetchall()
        cursor.close()
        
        investment_list = []
        for inv in investments:
            invested_amount = float(inv['invested_amount'])
            total_earned = float(inv['total_earned'])
            max_profit = float(inv['max_profit'])
            progress = (total_earned / max_profit * 100) if max_profit > 0 else 0
            
            investment_list.append({
                'id': inv['id'],
                'package_name': inv['package_name'],
                'invested_amount': invested_amount,
                'total_earned': total_earned,
                'daily_profit': float(inv['daily_profit']),
                'max_profit': max_profit,
                'progress_percentage': progress,
                'enrollment_date': format_ist_time(inv['enrollment_date']),
                'last_profit_date': format_ist_date(inv['last_profit_date']),
                'status': inv['status'],
                'daily_profit_percentage': float(inv['daily_profit_percentage'])
            })
        
        return {
            'success': True,
            'investments': investment_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
