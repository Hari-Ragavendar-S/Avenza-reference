from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.wallet import (
    DepositRequest, DepositResponse, WalletBalanceResponse,
    DepositHistoryResponse, AdminSettingUpdate, AdminSettingResponse,
    PaginatedDepositsResponse, WithdrawalRequest, WithdrawalResponse,
    WithdrawalHistoryResponse, WithdrawalSettingsUpdate, WithdrawalSettingsResponse,
    PaginatedWithdrawalsResponse
)
from app.database.connection import get_db
from app.utils.auth import verify_token
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

# ==================== USER WALLET ENDPOINTS ====================

@router.get("/wallet/balance")
def get_wallet_balance(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's wallet balances"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT avenza_balance, income_balance, gaming_balance 
            FROM users WHERE id = %s
        """, (user_id,))
        
        wallet = cursor.fetchone()
        if not wallet:
            raise HTTPException(status_code=404, detail="User not found")
        
        avenza_balance = Decimal(wallet['avenza_balance'] or 0)
        income_balance = Decimal(wallet['income_balance'] or 0)
        gaming_balance = Decimal(wallet['gaming_balance'] or 0)
        total = avenza_balance + income_balance + gaming_balance
        
        cursor.close()
        
        # Return same field names as profile endpoint for consistency
        return {
            "avenza_balance": float(avenza_balance),
            "income_balance": float(income_balance),
            "gaming_balance": float(gaming_balance),
            "total_balance": float(total)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== SIMPLE WITHDRAWAL ENDPOINT ====================

@router.post("/withdraw")
def create_withdrawal_request(
    request: dict,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Create withdrawal request - supports both automatic and manual modes"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = user_data.get('user_id')
        
        # Validate request
        amount = Decimal(str(request.get('amount', 0)))
        wallet_type = request.get('wallet_type', 'avenza')
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid amount")
        
        if wallet_type not in ['avenza', 'income', 'gaming']:
            raise HTTPException(status_code=400, detail="Invalid wallet type")
        
        cursor = db.cursor()
        
        # Get withdrawal mode
        cursor.execute("""
            SELECT setting_value 
            FROM system_settings 
            WHERE setting_key = 'withdrawal_mode'
        """)
        mode_result = cursor.fetchone()
        withdrawal_mode = mode_result['setting_value'] if mode_result else 'automatic'
        
        # Get user info
        cursor.execute("""
            SELECT username, avenza_balance, income_balance, gaming_balance,
                   wallet_address, wallet_type as user_wallet_type
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check wallet connected
        if not user['wallet_address']:
            raise HTTPException(status_code=400, detail="Please connect your wallet in Profile first")
        
        # Check balance
        balance_field = f'{wallet_type}_balance'
        current_balance = Decimal(user[balance_field] or 0)
        
        if current_balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Get withdrawal fee settings from admin
        cursor.execute("""
            SELECT setting_value FROM admin_settings 
            WHERE setting_key = 'withdrawal_fee_percentage'
        """)
        fee_setting = cursor.fetchone()
        fee_percentage = float(fee_setting['setting_value']) if fee_setting else 0
        
        # Calculate fee and net amount
        fee = Decimal(str(amount * Decimal(str(fee_percentage)) / 100))
        net_amount = amount - fee
        
        # Deduct from balance
        cursor.execute(f"""
            UPDATE users 
            SET {balance_field} = {balance_field} - %s
            WHERE id = %s
        """, (amount, user_id))
        
        # Determine status based on mode
        status = 'pending' if withdrawal_mode == 'manual' else 'completed'
        
        # Create withdrawal record
        cursor.execute("""
            INSERT INTO withdrawals (
                user_id, username, amount, currency, network, status,
                wallet_type, withdrawal_mode, destination_address, 
                destination_wallet_type, created_at, fee, fee_percentage, net_amount,
                to_address, from_address
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, user['username'], amount, 'USD', 'BEP20', status,
            wallet_type, withdrawal_mode, user['wallet_address'],
            user['user_wallet_type'], get_ist_time(), fee, fee_percentage, net_amount,
            user['wallet_address'], user['wallet_address']
        ))
        
        withdrawal_id = cursor.fetchone()['id']
        
        # Create transaction record
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'withdrawal', amount, 'USD',
            f"Withdrawal to {user['wallet_address'][:10]}...",
            withdrawal_id, 'withdrawal', status, wallet_type
        ))
        
        db.commit()
        cursor.close()
        
        return {
            "success": True,
            "message": "Withdrawal request submitted" if withdrawal_mode == 'manual' else "Withdrawal processed",
            "withdrawal_id": withdrawal_id,
            "amount": float(amount),
            "status": status,
            "mode": withdrawal_mode
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()

@router.get("/wallet/receiver-address")
def get_receiver_address(authorization: str = Header(None), db=Depends(get_db)):
    """Get USDT BEP20 receiver address (for frontend use - not shown to user)"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT setting_value FROM admin_settings 
            WHERE setting_key = 'usdt_bep20_receiver_address'
        """)
        
        setting = cursor.fetchone()
        cursor.close()
        
        if not setting:
            raise HTTPException(status_code=404, detail="Receiver address not configured")
        
        return {
            "success": True,
            "receiver_address": setting['setting_value']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/wallet/deposit", response_model=DepositResponse)
def record_deposit(request: DepositRequest, authorization: str = Header(None), db=Depends(get_db)):
    """Record a new deposit transaction"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = user_data.get('user_id')
        username = user_data.get('username')
        
        cursor = db.cursor()
        
        # Check if transaction already exists
        cursor.execute("""
            SELECT id, status FROM deposits WHERE transaction_hash = %s
        """, (request.transaction_hash,))
        
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Transaction already recorded")
        
        # Get receiver address
        cursor.execute("""
            SELECT setting_value FROM admin_settings 
            WHERE setting_key = 'usdt_bep20_receiver_address'
        """)
        receiver = cursor.fetchone()
        
        if not receiver:
            raise HTTPException(status_code=500, detail="Receiver address not configured")
        
        receiver_address = receiver['setting_value']
        ist_now = get_ist_time()
        
        # Insert deposit record
        cursor.execute("""
            INSERT INTO deposits (
                user_id, username, amount, currency, network,
                transaction_hash, from_address, to_address,
                status, wallet_type, block_number, confirmations,
                confirmed_at, ist_confirmed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, ist_created_at
        """, (
            user_id, username, request.amount, request.currency, request.network,
            request.transaction_hash, request.from_address, receiver_address,
            'completed', 'avenza', request.block_number, 12,
            ist_now, ist_now
        ))
        
        deposit = cursor.fetchone()
        deposit_id = deposit['id']
        
        # Update user's avenza wallet balance
        cursor.execute("""
            UPDATE users 
            SET avenza_balance = avenza_balance + %s
            WHERE id = %s
            RETURNING avenza_balance
        """, (request.amount, user_id))
        
        updated_user = cursor.fetchone()
        new_balance = updated_user['avenza_balance']
        
        # Create transaction record
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'deposit', request.amount, request.currency,
            f'Deposit via {request.network}', deposit_id, 'deposit',
            'completed', 'avenza'
        ))
        
        # Log deposit action
        cursor.execute("""
            INSERT INTO deposit_logs (
                deposit_id, user_id, action, new_status, message
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            deposit_id, user_id, 'deposit_completed', 'completed',
            f'Deposit of {request.amount} {request.currency} completed'
        ))
        
        db.commit()
        cursor.close()
        
        return DepositResponse(
            success=True,
            message="Deposit recorded successfully",
            deposit_id=deposit_id,
            transaction_hash=request.transaction_hash,
            amount=request.amount,
            status='completed',
            new_balance=Decimal(new_balance),
            timestamp=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/wallet/deposits")
def get_user_deposits(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's deposit history with pagination"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total FROM deposits WHERE user_id = %s
        """, (user_id,))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get deposits
        cursor.execute("""
            SELECT id, username, amount, currency, network, transaction_hash,
                   status, created_at, confirmed_at, ist_created_at, ist_confirmed_at
            FROM deposits
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, per_page, offset))
        
        deposits = cursor.fetchall()
        cursor.close()
        
        deposits_list = []
        for dep in deposits:
            deposits_list.append({
                'id': dep['id'],
                'username': dep['username'],
                'amount': float(dep['amount']),
                'currency': dep['currency'],
                'network': dep['network'],
                'transaction_hash': dep['transaction_hash'],
                'status': dep['status'],
                'ist_created_at': format_ist_time(dep['created_at']),
                'ist_confirmed_at': format_ist_time(dep['confirmed_at'])
            })
        
        return {
            'success': True,
            'deposits': deposits_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/transactions")
@router.get("/wallet/transactions")
def get_user_transactions(
    page: int = 1,
    per_page: int = 20,
    limit: int = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's transaction history with pagination"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = user_data.get('user_id')
        
        # If limit is provided, use it instead of per_page
        if limit:
            per_page = limit
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total FROM transactions WHERE user_id = %s
        """, (user_id,))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transactions
        cursor.execute("""
            SELECT id, type, amount, currency, description, 
                   status, wallet_type, created_at
            FROM transactions
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, per_page, offset))
        
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

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/wallet/settings")
def get_wallet_settings(authorization: str = Header(None), db=Depends(get_db)):
    """Get wallet settings (admin only)"""
    try:
        # Verify admin token
        print(f"DEBUG: Authorization header: {authorization}")
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        print(f"DEBUG: Token: {token[:20]}...")
        user_data = verify_token(token)
        print(f"DEBUG: User data: {user_data}")
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT setting_key, setting_value, description, updated_at
            FROM admin_settings
            WHERE setting_key = 'usdt_bep20_receiver_address'
        """)
        
        setting = cursor.fetchone()
        
        # Get total deposits received
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total_deposits
            FROM deposits WHERE status = 'completed'
        """)
        stats = cursor.fetchone()
        
        cursor.close()
        
        if not setting:
            raise HTTPException(status_code=404, detail="Settings not found")
        
        return {
            'success': True,
            'receiver_address': setting['setting_value'],
            'description': setting['description'],
            'last_updated': format_ist_time(setting['updated_at']),
            'total_deposits_received': float(stats['total_deposits'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/wallet/settings", response_model=AdminSettingResponse)
def update_wallet_settings(
    request: AdminSettingUpdate,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Update USDT BEP20 receiver address (admin only)"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = user_data.get('user_id')
        ist_now = get_ist_time()
        
        cursor = db.cursor()
        cursor.execute("""
            UPDATE admin_settings
            SET setting_value = %s, updated_by = %s, updated_at = %s
            WHERE setting_key = 'usdt_bep20_receiver_address'
            RETURNING setting_key, setting_value, updated_at
        """, (request.setting_value, admin_id, ist_now))
        
        updated = cursor.fetchone()
        db.commit()
        cursor.close()
        
        if not updated:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        return AdminSettingResponse(
            success=True,
            message="Receiver address updated successfully",
            setting_key=updated['setting_key'],
            setting_value=updated['setting_value'],
            updated_at=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/deposits")
def get_all_deposits(
    page: int = 1,
    per_page: int = 20,
    status: str = None,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get all deposits with pagination and filters (admin only)"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Build query with filters
        query_conditions = []
        query_params = []
        
        if status:
            query_conditions.append("status = %s")
            query_params.append(status)
        
        if search:
            query_conditions.append("username ILIKE %s")
            query_params.append(f'%{search}%')
        
        where_clause = " WHERE " + " AND ".join(query_conditions) if query_conditions else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM deposits{where_clause}"
        cursor.execute(count_query, query_params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get deposits
        query = f"""
            SELECT id, user_id, username, amount, currency, network,
                   transaction_hash, from_address, status,
                   created_at, confirmed_at, ist_created_at, ist_confirmed_at
            FROM deposits
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, query_params + [per_page, offset])
        
        deposits = cursor.fetchall()
        
        # Get status counts
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'completed') as completed
            FROM deposits
        """)
        stats = cursor.fetchone()
        
        cursor.close()
        
        deposits_list = []
        for dep in deposits:
            deposits_list.append({
                'id': dep['id'],
                'user_id': dep['user_id'],
                'username': dep['username'],
                'amount': float(dep['amount']),
                'currency': dep['currency'],
                'network': dep['network'],
                'transaction_hash': dep['transaction_hash'],
                'from_address': dep['from_address'],
                'status': dep['status'],
                'ist_created_at': format_ist_time(dep['created_at']),
                'ist_confirmed_at': format_ist_time(dep['confirmed_at'])
            })
        
        return {
            'success': True,
            'deposits': deposits_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'stats': {
                'total': stats['total'],
                'pending': stats['pending'],
                'completed': stats['completed']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ==================== WITHDRAWAL ENDPOINTS ====================

@router.get("/wallet/withdrawal-settings")
def get_withdrawal_settings(authorization: str = Header(None), db=Depends(get_db)):
    """Get withdrawal settings for user"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT setting_key, setting_value FROM admin_settings
            WHERE setting_key IN (
                'withdrawal_fee_percentage',
                'withdrawal_min_amount', 
                'withdrawal_max_amount',
                'withdrawal_daily_limit_count',
                'withdrawal_enabled'
            )
        """)
        
        settings = {}
        for row in cursor.fetchall():
            settings[row['setting_key']] = row['setting_value']
        
        cursor.close()
        
        return {
            'success': True,
            'fee_percentage': float(settings.get('withdrawal_fee_percentage', 5)),
            'min_amount': float(settings.get('withdrawal_min_amount', 1)),
            'max_amount': float(settings.get('withdrawal_max_amount', 1000)),
            'daily_limit_count': int(settings.get('withdrawal_daily_limit_count', 10)),
            'enabled': settings.get('withdrawal_enabled', 'true') == 'true'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/wallet/withdraw", response_model=WithdrawalResponse)
def process_withdrawal(request: WithdrawalRequest, authorization: str = Header(None), db=Depends(get_db)):
    """Process withdrawal request - Automatic via backend wallet"""
    try:
        from web3 import Web3
        import os
        
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = user_data.get('user_id')
        username = user_data.get('username')
        
        cursor = db.cursor()
        
        # Check if withdrawals are enabled
        cursor.execute("SELECT setting_value FROM admin_settings WHERE setting_key = 'withdrawal_enabled'")
        enabled = cursor.fetchone()
        if not enabled or enabled['setting_value'] != 'true':
            raise HTTPException(status_code=503, detail="Withdrawals are currently disabled")
        
        # Get withdrawal settings
        cursor.execute("""
            SELECT setting_key, setting_value FROM admin_settings
            WHERE setting_key IN (
                'withdrawal_fee_percentage',
                'withdrawal_min_amount',
                'withdrawal_max_amount',
                'withdrawal_daily_limit_count',
                'withdrawal_wallet_address'
            )
        """)
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        
        fee_percentage = float(settings.get('withdrawal_fee_percentage', 5))
        min_amount = float(settings.get('withdrawal_min_amount', 1))
        max_amount = float(settings.get('withdrawal_max_amount', 1000))
        daily_limit = int(settings.get('withdrawal_daily_limit_count', 10))
        withdrawal_wallet = settings.get('withdrawal_wallet_address')
        
        # Validate amount
        amount_float = float(request.amount)
        if amount_float < min_amount:
            raise HTTPException(status_code=400, detail=f"Minimum withdrawal is ${min_amount}")
        if amount_float > max_amount:
            raise HTTPException(status_code=400, detail=f"Maximum withdrawal is ${max_amount}")
        
        # Check daily limit
        today_start = get_ist_time().replace(hour=0, minute=0, second=0, microsecond=0)
        cursor.execute("""
            SELECT COUNT(*) as count FROM withdrawals
            WHERE user_id = %s AND created_at >= %s
        """, (user_id, today_start))
        today_count = cursor.fetchone()['count']
        if today_count >= daily_limit:
            raise HTTPException(status_code=429, detail=f"Daily withdrawal limit reached ({daily_limit} transactions)")
        
        # Calculate fee and net amount
        fee = Decimal(str(amount_float * fee_percentage / 100))
        net_amount = request.amount - fee
        
        # Get user balance
        wallet_balance_field = f'{request.wallet_type}_balance'
        cursor.execute(f"SELECT {wallet_balance_field} FROM users WHERE id = %s", (user_id,))
        user_wallet = cursor.fetchone()
        current_balance = Decimal(user_wallet[wallet_balance_field] or 0)
        
        if current_balance < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        ist_now = get_ist_time()
        
        # Create withdrawal record
        cursor.execute("""
            INSERT INTO withdrawals (
                user_id, username, amount, fee, fee_percentage, net_amount,
                currency, network, to_address, from_address, status,
                wallet_type, withdrawal_mode, destination_address, 
                destination_wallet_type, ist_processed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, username, request.amount, fee, fee_percentage, net_amount,
            'USDT', 'BEP20', request.to_address, withdrawal_wallet or request.to_address, 'processing',
            request.wallet_type, 'automatic', request.to_address, 
            request.destination_wallet_type, ist_now
        ))
        
        withdrawal_id = cursor.fetchone()['id']
        
        # Send actual blockchain transaction
        try:
            # Get private key from environment
            private_key = os.getenv('WITHDRAWAL_WALLET_PRIVATE_KEY')
            if not private_key:
                raise Exception("Withdrawal wallet private key not configured")
            
            # Connect to BSC network
            bsc_rpc = 'https://bsc-dataseed.binance.org/'
            w3 = Web3(Web3.HTTPProvider(bsc_rpc))
            
            if not w3.is_connected():
                raise Exception("Failed to connect to BSC network")
            
            # USDT contract on BSC
            usdt_contract_address = '0x55d398326f99059fF775485246999027B3197955'
            usdt_abi = [
                {
                    "constant": False,
                    "inputs": [
                        {"name": "_to", "type": "address"},
                        {"name": "_value", "type": "uint256"}
                    ],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "type": "function"
                },
                {
                    "constant": True,
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [{"name": "", "type": "uint8"}],
                    "type": "function"
                }
            ]
            
            # Create contract instance
            contract = w3.eth.contract(address=usdt_contract_address, abi=usdt_abi)
            
            # Get sender account from private key
            account = w3.eth.account.from_key(private_key)
            sender_address = account.address
            
            # Convert amount to Wei (USDT has 18 decimals on BSC)
            decimals = contract.functions.decimals().call()
            amount_in_wei = int(float(net_amount) * (10 ** decimals))
            
            # Build transaction
            nonce = w3.eth.get_transaction_count(sender_address)
            
            # Get current gas price
            gas_price = w3.eth.gas_price
            
            # Build the transfer transaction
            transaction = contract.functions.transfer(
                w3.to_checksum_address(request.to_address),
                amount_in_wei
            ).build_transaction({
                'from': sender_address,
                'gas': 100000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 56  # BSC Mainnet
            })
            
            # Sign transaction
            signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
            
            # Send transaction (handle different Web3.py versions)
            try:
                # Try rawTransaction first (newer versions)
                raw_tx = signed_txn.rawTransaction
            except AttributeError:
                # Fallback to raw_transaction (older versions)
                try:
                    raw_tx = signed_txn.raw_transaction
                except AttributeError:
                    # Some versions return the signed transaction directly
                    raw_tx = signed_txn
            
            tx_hash = w3.eth.send_raw_transaction(raw_tx)
            tx_hash_hex = w3.to_hex(tx_hash)
            
            # Wait for transaction receipt (with timeout)
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if tx_receipt['status'] != 1:
                raise Exception("Transaction failed on blockchain")
            
            # Update withdrawal with real tx hash
            cursor.execute("""
                UPDATE withdrawals
                SET transaction_hash = %s, status = 'completed', completed_at = %s, ist_completed_at = %s
                WHERE id = %s
            """, (tx_hash_hex, ist_now, ist_now, withdrawal_id))
            
            tx_hash_final = tx_hash_hex
            
        except Exception as tx_error:
            # Transaction failed, update status
            error_msg = str(tx_error)
            cursor.execute("""
                UPDATE withdrawals
                SET status = 'failed', error_message = %s
                WHERE id = %s
            """, (error_msg, withdrawal_id))
            
            db.commit()
            cursor.close()
            raise HTTPException(status_code=500, detail=f"Blockchain transaction failed: {error_msg}")
        
        # Deduct from user balance
        cursor.execute(f"""
            UPDATE users
            SET {wallet_balance_field} = {wallet_balance_field} - %s
            WHERE id = %s
            RETURNING {wallet_balance_field}
        """, (request.amount, user_id))
        
        new_balance = cursor.fetchone()[wallet_balance_field]
        
        # Create transaction record
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'withdrawal', request.amount, 'USDT',
            f'Withdrawal to {request.to_address[:10]}...', withdrawal_id, 'withdrawal',
            'completed', request.wallet_type
        ))
        
        # Log withdrawal
        cursor.execute("""
            INSERT INTO withdrawal_logs (
                withdrawal_id, user_id, action, new_status, message
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            withdrawal_id, user_id, 'withdrawal_completed', 'completed',
            f'Withdrawal of {net_amount} USDT (fee: {fee}) completed'
        ))
        
        db.commit()
        cursor.close()
        
        return WithdrawalResponse(
            success=True,
            message="Withdrawal processed successfully",
            withdrawal_id=withdrawal_id,
            transaction_hash=tx_hash_final,
            amount=request.amount,
            fee=fee,
            net_amount=net_amount,
            status='completed',
            new_balance=Decimal(new_balance),
            timestamp=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/wallet/withdrawals")
def get_user_withdrawals(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's withdrawal history"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM withdrawals WHERE user_id = %s", (user_id,))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get withdrawals
        cursor.execute("""
            SELECT id, username, amount, fee, net_amount, to_address,
                   transaction_hash, status, created_at, completed_at,
                   ist_created_at, ist_completed_at
            FROM withdrawals
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, per_page, offset))
        
        withdrawals = cursor.fetchall()
        cursor.close()
        
        withdrawals_list = []
        for w in withdrawals:
            withdrawals_list.append({
                'id': w['id'],
                'username': w['username'],
                'amount': float(w['amount']),
                'fee': float(w['fee']),
                'net_amount': float(w['net_amount']),
                'to_address': w['to_address'],
                'transaction_hash': w['transaction_hash'],
                'status': w['status'],
                'ist_created_at': format_ist_time(w['created_at']),
                'ist_completed_at': format_ist_time(w['completed_at'])
            })
        
        return {
            'success': True,
            'withdrawals': withdrawals_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN WITHDRAWAL ENDPOINTS ====================

@router.get("/admin/withdrawal/settings")
def get_admin_withdrawal_settings(authorization: str = Header(None), db=Depends(get_db)):
    """Get withdrawal settings (admin only)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT setting_key, setting_value FROM admin_settings
            WHERE setting_key LIKE 'withdrawal%'
        """)
        
        settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        
        # Get total withdrawals stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_count
            FROM withdrawals
        """)
        stats = cursor.fetchone()
        
        cursor.close()
        
        return {
            'success': True,
            'fee_percentage': float(settings.get('withdrawal_fee_percentage', 5)),
            'min_amount': float(settings.get('withdrawal_min_amount', 1)),
            'max_amount': float(settings.get('withdrawal_max_amount', 1000)),
            'daily_limit_count': int(settings.get('withdrawal_daily_limit_count', 10)),
            'enabled': settings.get('withdrawal_enabled', 'true') == 'true',
            'withdrawal_wallet': settings.get('withdrawal_wallet_address'),
            'stats': {
                'total_count': stats['total_count'],
                'total_amount': float(stats['total_amount']),
                'pending_count': stats['pending_count'],
                'completed_count': stats['completed_count']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.put("/admin/withdrawal/settings", response_model=WithdrawalSettingsResponse)
def update_withdrawal_settings(
    request: WithdrawalSettingsUpdate,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Update withdrawal settings (admin only)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Update min_amount if provided
        if request.min_amount is not None:
            cursor.execute("""
                INSERT INTO admin_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (setting_key) 
                DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    updated_at = EXCLUDED.updated_at
            """, ('withdrawal_min_amount', str(request.min_amount), 
                  'Minimum withdrawal amount in USD', ist_now, ist_now))
        
        # Update max_amount if provided
        if request.max_amount is not None:
            cursor.execute("""
                INSERT INTO admin_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (setting_key) 
                DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    updated_at = EXCLUDED.updated_at
            """, ('withdrawal_max_amount', str(request.max_amount), 
                  'Maximum withdrawal amount per day in USD', ist_now, ist_now))
        
        # Update daily_limit_count if provided
        if request.daily_limit_count is not None:
            cursor.execute("""
                INSERT INTO admin_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (setting_key) 
                DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    updated_at = EXCLUDED.updated_at
            """, ('withdrawal_daily_limit_count', str(request.daily_limit_count), 
                  'Daily withdrawal transaction limit', ist_now, ist_now))
        
        # Update fee_percentage if provided
        if request.fee_percentage is not None:
            cursor.execute("""
                INSERT INTO admin_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (setting_key) 
                DO UPDATE SET 
                    setting_value = EXCLUDED.setting_value,
                    updated_at = EXCLUDED.updated_at
            """, ('withdrawal_fee_percentage', str(request.fee_percentage), 
                  'Withdrawal fee percentage (deduction)', ist_now, ist_now))
        
        db.commit()
        
        # Get all current settings to return complete response
        cursor.execute("""
            SELECT setting_key, setting_value FROM admin_settings
            WHERE setting_key IN (
                'withdrawal_min_amount',
                'withdrawal_max_amount',
                'withdrawal_daily_limit_count',
                'withdrawal_fee_percentage'
            )
        """)
        
        all_settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        cursor.close()
        
        return WithdrawalSettingsResponse(
            success=True,
            message='Withdrawal settings updated successfully',
            min_amount=float(all_settings.get('withdrawal_min_amount', 10)),
            max_amount=float(all_settings.get('withdrawal_max_amount', 300)),
            daily_limit_count=int(all_settings.get('withdrawal_daily_limit_count', 1)),
            fee_percentage=float(all_settings.get('withdrawal_fee_percentage', 10)),
            updated_at=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/withdrawals")
def get_all_withdrawals(
    page: int = 1,
    per_page: int = 20,
    status: str = None,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get all withdrawals (admin only)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        if user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Build query
        conditions = []
        params = []
        
        if status:
            conditions.append("status = %s")
            params.append(status)
        
        if search:
            conditions.append("username ILIKE %s")
            params.append(f'%{search}%')
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total
        cursor.execute(f"SELECT COUNT(*) as total FROM withdrawals{where_clause}", params)
        total = cursor.fetchone()['total']
        
        # Get withdrawals
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        query = f"""
            SELECT id, user_id, username, amount, fee, fee_percentage, net_amount,
                   to_address, destination_address, destination_wallet_type,
                   withdrawal_mode, wallet_type, transaction_hash, status, 
                   created_at, completed_at, ist_created_at, ist_completed_at
            FROM withdrawals
            {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        
        withdrawals = cursor.fetchall()
        
        # Get stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'processing') as processing,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed
            FROM withdrawals
        """)
        stats = cursor.fetchone()
        
        cursor.close()
        
        withdrawals_list = []
        for w in withdrawals:
            withdrawals_list.append({
                'id': w['id'],
                'user_id': w['user_id'],
                'username': w['username'],
                'amount': float(w['amount']),
                'fee': float(w['fee']),
                'fee_percentage': float(w['fee_percentage'] or 0),
                'net_amount': float(w['net_amount']),
                'to_address': w['to_address'],
                'destination_address': w['destination_address'],
                'destination_wallet_type': w['destination_wallet_type'],
                'withdrawal_mode': w['withdrawal_mode'],
                'wallet_type': w['wallet_type'],
                'transaction_hash': w['transaction_hash'],
                'status': w['status'],
                'ist_created_at': format_ist_time(w['created_at']),
                'ist_completed_at': format_ist_time(w['completed_at'])
            })
        
        return {
            'success': True,
            'withdrawals': withdrawals_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'stats': {
                'total': stats['total'],
                'pending': stats['pending'],
                'processing': stats['processing'],
                'completed': stats['completed'],
                'failed': stats['failed']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ==================== REDEMPTION ENDPOINT ====================

@router.post("/wallet/redeem")
def redeem_wallet_balance(
    request: dict,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Redeem Income/ROI wallet balance to AVENZA Wallet for withdrawal
    
    Request body:
    {
        "from_wallet": "income" or "roi",
        "amount": 100.00
    }
    """
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        from_wallet = request.get('from_wallet')  # 'income' or 'gaming'
        amount = Decimal(str(request.get('amount', 0)))
        
        # Validation
        if from_wallet not in ['income', 'gaming']:
            raise HTTPException(status_code=400, detail="Invalid wallet type. Use 'income' or 'gaming'")
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
        cursor = db.cursor()
        
        # Get user's current balances
        cursor.execute("""
            SELECT avenza_balance, income_balance, gaming_balance, username
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check sufficient balance
        if from_wallet == 'income':
            source_balance = Decimal(str(user['income_balance'] or 0))
            wallet_name = "Income Wallet"
        else:  # gaming
            source_balance = Decimal(str(user['gaming_balance'] or 0))
            wallet_name = "Gaming Wallet"
        
        if source_balance < amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance in {wallet_name}. Available: ${source_balance}"
            )
        
        # Perform redemption (transfer)
        if from_wallet == 'income':
            cursor.execute("""
                UPDATE users
                SET income_balance = income_balance - %s,
                    avenza_balance = avenza_balance + %s
                WHERE id = %s
            """, (amount, amount, user_id))
        else:  # gaming
            cursor.execute("""
                UPDATE users
                SET gaming_balance = gaming_balance - %s,
                    avenza_balance = avenza_balance + %s
                WHERE id = %s
            """, (amount, amount, user_id))
        
        # Record in transactions table
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_type, status, wallet_type, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            user_id,
            'redemption',
            amount,
            'USD',
            f'Redeemed ${amount} from {wallet_name} to AVENZA Wallet',
            'redemption',
            'completed',
            'balance'
        ))
        
        db.commit()
        
        # Get updated balances
        cursor.execute("""
            SELECT avenza_balance, income_balance, gaming_balance
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        updated = cursor.fetchone()
        
        return {
            "success": True,
            "message": f"Successfully redeemed ${amount} from {wallet_name}",
            "redemption": {
                "amount": float(amount),
                "from_wallet": from_wallet,
                "wallet_name": wallet_name,
                "new_balances": {
                    "avenza_wallet": float(updated['avenza_balance']),
                    "income_wallet": float(updated['income_balance']),
                    "gaming_wallet": float(updated['gaming_balance'])
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during redemption: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Redemption failed: {str(e)}")
    finally:
        cursor.close()


# ==================== USER PUBLIC DEPOSIT HISTORY ====================

@router.get("/wallet/public-distribution-history")
def get_user_public_distribution_history(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's public deposit distribution history"""
    try:
        # Verify token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get user email for matching
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_info = cursor.fetchone()
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user_info['email']
        
        # Get total received and count
        cursor.execute("""
            SELECT 
                COUNT(*) as distribution_count,
                COALESCE(SUM(credited_amount), 0) as total_received
            FROM public_distribution_records
            WHERE user_email = %s AND status = 'completed'
        """, (user_email,))
        
        stats = cursor.fetchone()
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (stats['distribution_count'] + per_page - 1) // per_page if stats['distribution_count'] > 0 else 1
        
        # Get distribution history with transaction hash
        cursor.execute("""
            SELECT 
                pdr.id,
                pdr.source_type,
                pdr.credited_amount,
                pdr.status,
                pdr.credited_at,
                CASE 
                    WHEN pdr.source_type = 'website' THEN pdw.transaction_hash
                    WHEN pdr.source_type = 'external' THEN pde.transaction_hash
                END as transaction_hash
            FROM public_distribution_records pdr
            LEFT JOIN public_deposits_website pdw ON pdr.source_type = 'website' AND pdr.source_transaction_id = pdw.id
            LEFT JOIN public_deposits_external pde ON pdr.source_type = 'external' AND pdr.source_transaction_id = pde.id
            WHERE pdr.user_email = %s
            ORDER BY pdr.credited_at DESC
            LIMIT %s OFFSET %s
        """, (user_email, per_page, offset))
        
        distributions = cursor.fetchall()
        cursor.close()
        
        distributions_list = []
        for dist in distributions:
            distributions_list.append({
                'id': dist['id'],
                'source_type': dist['source_type'],
                'transaction_hash': dist['transaction_hash'],
                'credited_amount': float(dist['credited_amount']),
                'status': dist['status'],
                'credited_at': format_ist_time(dist['credited_at'])
            })
        
        return {
            'success': True,
            'distributions': distributions_list,
            'total_received': float(stats['total_received']),
            'distribution_count': stats['distribution_count'],
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
