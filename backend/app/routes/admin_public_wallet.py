"""
Admin Routes for Public Wallet Management
Handles wallet configuration, transaction viewing, and distribution history
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.public_wallet import (
    PublicWalletConfigCreate, PublicWalletConfigResponse,
    WebsiteDepositsResponse, ExternalDepositsResponse,
    DistributionDetailResponse
)
from app.database.connection import get_db
from app.utils.auth import verify_token
from app.utils.encryption import get_encryption_service
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

# ==================== ADMIN WALLET CONFIGURATION ====================

@router.post("/admin/public-wallet/configure", response_model=PublicWalletConfigResponse)
async def configure_public_wallet(
    config: PublicWalletConfigCreate,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Admin: Set or update public wallet address and secret phrase
    Premium center confirmation screen required on frontend
    """
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get encryption service
        encryption_service = get_encryption_service()
        
        # Validate secret phrase
        is_valid, error_msg = encryption_service.validate_secret_phrase(config.secret_phrase)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Encrypt secret phrase
        encrypted_phrase = encryption_service.encrypt(config.secret_phrase)
        
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Check if config exists
        cursor.execute("SELECT id FROM public_wallet_config WHERE is_active = TRUE")
        existing = cursor.fetchone()
        
        if existing:
            # Update existing
            cursor.execute("""
                UPDATE public_wallet_config
                SET wallet_address = %s,
                    encrypted_secret_phrase = %s,
                    network = %s,
                    updated_at = %s
                WHERE is_active = TRUE
                RETURNING id
            """, (config.wallet_address, encrypted_phrase, config.network, ist_now))
            
            message = "Public wallet configuration updated successfully"
        else:
            # Insert new
            cursor.execute("""
                INSERT INTO public_wallet_config
                (wallet_address, encrypted_secret_phrase, network, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, TRUE, %s, %s)
                RETURNING id
            """, (config.wallet_address, encrypted_phrase, config.network, ist_now, ist_now))
            
            message = "Public wallet configured successfully"
        
        db.commit()
        cursor.close()
        
        return PublicWalletConfigResponse(
            success=True,
            message=message,
            wallet_address=config.wallet_address,
            network=config.network,
            updated_at=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/admin/public-wallet/config")
async def get_public_wallet_config(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Admin: Get current public wallet configuration (shows encrypted secret)"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT wallet_address, network, created_at, updated_at
            FROM public_wallet_config
            WHERE is_active = TRUE
        """)
        
        config = cursor.fetchone()
        cursor.close()
        
        if not config:
            raise HTTPException(status_code=404, detail="Public wallet not configured")
        
        return {
            'success': True,
            'wallet_address': config['wallet_address'],
            'network': config['network'],
            'created_at': format_ist_time(config['created_at']),
            'updated_at': format_ist_time(config['updated_at'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== WEBSITE DEPOSITS (4 COLUMNS) ====================

@router.get("/admin/public-wallet/transactions/website")
async def get_website_deposits(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Admin: Get website deposits with 4 columns
    Columns: Name, Phone, Amount (BEP20), TX Hash
    Pagination: 20 per page
    """
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM public_deposits_website")
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get deposits
        cursor.execute("""
            SELECT id, name, phone, wallet_address, amount_bep20_equivalent,
                   transaction_hash, wallet_status, is_distributed, 
                   distributed_to_count, deposited_at
            FROM public_deposits_website
            ORDER BY deposited_at DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))
        
        deposits = cursor.fetchall()
        cursor.close()
        
        deposits_list = []
        for dep in deposits:
            deposits_list.append({
                'id': dep['id'],
                'name': dep['name'],
                'phone': dep['phone'],
                'wallet_address': dep['wallet_address'],
                'amount_bep20_equivalent': float(dep['amount_bep20_equivalent']),
                'transaction_hash': dep['transaction_hash'],
                'wallet_status': dep['wallet_status'],
                'is_distributed': dep['is_distributed'],
                'distributed_to_count': dep['distributed_to_count'],
                'deposited_at': format_ist_time(dep['deposited_at'])
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

# ==================== EXTERNAL DEPOSITS (3 COLUMNS) ====================

@router.get("/admin/public-wallet/transactions/external")
async def get_external_deposits(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Admin: Get external deposits with 3 columns
    Columns: Sender Address, Amount (BEP20), TX Hash
    Pagination: 20 per page
    """
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM public_deposits_external")
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get deposits
        cursor.execute("""
            SELECT id, sender_address, amount_bep20_equivalent, transaction_hash,
                   network, token_type, is_distributed, distributed_to_count, 
                   detected_at
            FROM public_deposits_external
            ORDER BY detected_at DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))
        
        deposits = cursor.fetchall()
        cursor.close()
        
        deposits_list = []
        for dep in deposits:
            deposits_list.append({
                'id': dep['id'],
                'sender_address': dep['sender_address'],
                'amount_bep20_equivalent': float(dep['amount_bep20_equivalent']),
                'transaction_hash': dep['transaction_hash'],
                'network': dep['network'],
                'token_type': dep['token_type'],
                'is_distributed': dep['is_distributed'],
                'distributed_to_count': dep['distributed_to_count'],
                'detected_at': format_ist_time(dep['detected_at'])
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

# ==================== DISTRIBUTION DETAILS ====================

@router.get("/admin/public-wallet/distribution/{source_type}/{transaction_hash}")
async def get_distribution_details(
    source_type: str,
    transaction_hash: str,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Admin: Get distribution details - who received from this transaction
    Shows: Name, Email, Phone, Amount Credited
    Clicked from transaction list
    """
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if source_type not in ['website', 'external']:
            raise HTTPException(status_code=400, detail="Invalid source type")
        
        cursor = db.cursor()
        
        # Get source transaction
        table_name = f'public_deposits_{source_type}'
        cursor.execute(f"""
            SELECT id, amount_bep20_equivalent, distributed_to_count
            FROM {table_name}
            WHERE transaction_hash = %s
        """, (transaction_hash,))
        
        source = cursor.fetchone()
        if not source:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get all recipients
        cursor.execute("""
            SELECT id, user_name, user_email, user_phone, 
                   credited_amount, status, credited_at
            FROM public_distribution_records
            WHERE source_type = %s AND source_transaction_id = %s
            ORDER BY credited_at DESC
        """, (source_type, source['id']))
        
        recipients = cursor.fetchall()
        cursor.close()
        
        recipients_list = []
        for rec in recipients:
            recipients_list.append({
                'id': rec['id'],
                'user_name': rec['user_name'],
                'user_email': rec['user_email'],
                'user_phone': rec['user_phone'],
                'credited_amount': float(rec['credited_amount']),
                'status': rec['status'],
                'credited_at': format_ist_time(rec['credited_at'])
            })
        
        return {
            'success': True,
            'source_type': source_type,
            'transaction_hash': transaction_hash,
            'total_amount': float(source['amount_bep20_equivalent']),
            'recipients_count': source['distributed_to_count'],
            'recipients': recipients_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN STATS ====================

@router.get("/admin/public-wallet/stats")
async def get_admin_stats(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Admin: Get overall public wallet statistics"""
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        cursor.execute("""
            SELECT total_deposits_count, total_website_deposits, 
                   total_external_deposits, total_amount_received,
                   total_distributed, total_participants, last_deposit_at
            FROM public_stats
            WHERE id = 1
        """)
        
        stats = cursor.fetchone()
        cursor.close()
        
        if not stats:
            # Initialize if not exists
            return {
                'success': True,
                'total_deposits_count': 0,
                'total_website_deposits': 0,
                'total_external_deposits': 0,
                'total_amount_received': 0,
                'total_distributed': 0,
                'total_participants': 0,
                'last_deposit_at': None
            }
        
        return {
            'success': True,
            'total_deposits_count': stats['total_deposits_count'],
            'total_website_deposits': stats['total_website_deposits'],
            'total_external_deposits': stats['total_external_deposits'],
            'total_amount_received': float(stats['total_amount_received']),
            'total_distributed': float(stats['total_distributed']),
            'total_participants': stats['total_participants'],
            'last_deposit_at': format_ist_time(stats['last_deposit_at'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ==================== USER TOP-UPS ====================

@router.get("/admin/public-wallet/transactions/user-topups")
async def get_user_topups(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """
    Admin: Get user top-up transactions
    Shows who topped up which user and how much
    """
    try:
        # Verify admin token
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as total FROM user_topups")
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get top-ups
        cursor.execute("""
            SELECT id, user_id, username, user_name, user_email,
                   sender_name, sender_phone, sender_wallet_address, 
                   amount_bep20_equivalent, transaction_hash, status, topped_up_at
            FROM user_topups
            ORDER BY topped_up_at DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))
        
        topups = cursor.fetchall()
        cursor.close()
        
        topups_list = []
        for topup in topups:
            topups_list.append({
                'id': topup['id'],
                'recipient_user_id': topup['user_id'],
                'recipient_username': topup['username'],
                'recipient_name': topup['user_name'],
                'recipient_email': topup['user_email'],
                'sender_name': topup['sender_name'],
                'sender_phone': topup['sender_phone'],
                'sender_address': topup['sender_wallet_address'],
                'amount_bep20': float(topup['amount_bep20_equivalent']),
                'transaction_hash': topup['transaction_hash'],
                'status': topup['status'],
                'topped_up_at': format_ist_time(topup['topped_up_at'])
            })
        
        return {
            'success': True,
            'topups': topups_list,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
