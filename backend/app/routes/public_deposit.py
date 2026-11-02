"""
Public Deposit Routes
No authentication required - anyone can deposit and see public address
"""

from fastapi import APIRouter, HTTPException, Depends
from app.schemas.public_wallet import (
    WebsiteDepositCreate, WebsiteDepositResponse,
    PublicWalletAddressResponse, PublicStatsResponse
)
from app.database.connection import get_db
from app.services.distribution_engine import get_distribution_engine
from decimal import Decimal
from datetime import datetime
import pytz
import asyncio

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

# ==================== PUBLIC WALLET ADDRESS ====================

@router.get("/public/wallet-address", response_model=PublicWalletAddressResponse)
async def get_public_wallet_address(db=Depends(get_db)):
    """
    Public endpoint - Get public deposit address
    No authentication required
    """
    try:
        cursor = db.cursor()
        
        # Get active wallet config
        cursor.execute("""
            SELECT wallet_address, network
            FROM public_wallet_config
            WHERE is_active = TRUE
        """)
        
        config = cursor.fetchone()
        
        if not config:
            raise HTTPException(status_code=404, detail="Public wallet not configured")
        
        # Get supported networks
        cursor.execute("""
            SELECT network_name
            FROM supported_networks
            WHERE is_active = TRUE
            ORDER BY network_name
        """)
        
        networks = [row['network_name'] for row in cursor.fetchall()]
        cursor.close()
        
        return PublicWalletAddressResponse(
            success=True,
            wallet_address=config['wallet_address'],
            network=config['network'],
            supported_networks=networks
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== WEBSITE DEPOSIT ====================

@router.post("/public/deposit/website", response_model=WebsiteDepositResponse)
async def create_website_deposit(
    deposit: WebsiteDepositCreate,
    db=Depends(get_db)
):
    """
    Public endpoint - Submit website deposit
    User provides: Name, Phone, connects wallet, sends payment
    Triggers instant equal distribution to all users
    """
    try:
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Check if transaction already exists
        cursor.execute("""
            SELECT id FROM public_deposits_website 
            WHERE transaction_hash = %s
        """, (deposit.transaction_hash,))
        
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Transaction already recorded")
        
        # Insert deposit record
        cursor.execute("""
            INSERT INTO public_deposits_website
            (name, phone, wallet_address, amount_received, network, 
             token_type, amount_bep20_equivalent, transaction_hash, 
             wallet_status, deposited_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'success', %s)
            RETURNING id
        """, (
            deposit.name, deposit.phone, deposit.wallet_address,
            deposit.amount, deposit.network, deposit.token_type,
            deposit.amount_bep20_equivalent, deposit.transaction_hash,
            ist_now
        ))
        
        deposit_id = cursor.fetchone()['id']
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"💰 NEW WEBSITE DEPOSIT")
        print(f"{'='*60}")
        print(f"Name: {deposit.name}")
        print(f"Phone: {deposit.phone}")
        print(f"Amount: ${deposit.amount_bep20_equivalent} BEP20 USDT")
        print(f"TX: {deposit.transaction_hash}")
        print(f"{'='*60}\n")
        
        # Queue distribution
        distribution_engine = get_distribution_engine(db)
        await distribution_engine.queue_distribution(
            deposit.transaction_hash,
            deposit.amount_bep20_equivalent,
            'website'
        )
        
        # Process distribution immediately (async)
        result = await distribution_engine.process_distribution(
            deposit.transaction_hash,
            deposit.amount_bep20_equivalent,
            'website'
        )
        
        cursor.close()
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result['message'])
        
        return WebsiteDepositResponse(
            success=True,
            message="Deposit successful! Amount distributed to all users.",
            deposit_id=deposit_id,
            transaction_hash=deposit.transaction_hash,
            name=deposit.name,
            phone=deposit.phone,
            amount_bep20=deposit.amount_bep20_equivalent,
            distributed_to_count=result['users_count'],
            per_user_amount=Decimal(str(result['per_user_amount']))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== PUBLIC STATS ====================

@router.get("/public/stats", response_model=PublicStatsResponse)
async def get_public_stats(db=Depends(get_db)):
    """
    Public endpoint - Get public deposit statistics for homepage
    No authentication required
    """
    try:
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
            return PublicStatsResponse(
                success=True,
                total_deposits_count=0,
                total_website_deposits=0,
                total_external_deposits=0,
                total_amount_received=Decimal('0'),
                total_distributed=Decimal('0'),
                total_participants=0,
                last_deposit_at=None
            )
        
        return PublicStatsResponse(
            success=True,
            total_deposits_count=stats['total_deposits_count'],
            total_website_deposits=stats['total_website_deposits'],
            total_external_deposits=stats['total_external_deposits'],
            total_amount_received=Decimal(str(stats['total_amount_received'])),
            total_distributed=Decimal(str(stats['total_distributed'])),
            total_participants=stats['total_participants'],
            last_deposit_at=format_ist_time(stats['last_deposit_at'])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
