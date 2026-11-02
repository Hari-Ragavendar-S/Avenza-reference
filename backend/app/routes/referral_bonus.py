from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.referral_bonus import (
    ReferralBonusOverviewResponse, ReferralBonusStats, ReferralRateProgress,
    PendingBonus, ClaimedBonus, ClaimBonusRequest, ClaimBonusResponse,
    AdminReferralBonusResponse, AdminReferralBonusStats, AdminBonusTransaction,
    TopReferrer, RateDistribution
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
    return ist_time.strftime('%b %d, %Y - %I:%M %p')

# ==================== USER ENDPOINTS ====================

@router.get("/referral-bonus/overview", response_model=ReferralBonusOverviewResponse)
def get_referral_bonus_overview(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's referral bonus overview"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get total unclaimed
        cursor.execute("""
            SELECT COALESCE(SUM(bonus_amount), 0) as total, COUNT(*) as count
            FROM referral_bonuses
            WHERE referrer_id = %s AND status = 'pending'
        """, (user_id,))
        unclaimed = cursor.fetchone()
        
        # Get total claimed
        cursor.execute("""
            SELECT COALESCE(SUM(bonus_amount), 0) as total, COUNT(*) as count
            FROM referral_bonuses
            WHERE referrer_id = %s AND status = 'claimed'
        """, (user_id,))
        claimed = cursor.fetchone()
        
        # Get direct referrals count
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM users
            WHERE sponsor_id = %s
        """, (user_id,))
        direct_referrals = cursor.fetchone()['count']
        
        # Get current rate based on how many have invested
        cursor.execute("""
            SELECT COUNT(DISTINCT referral_id) as count
            FROM referral_bonuses
            WHERE referrer_id = %s
        """, (user_id,))
        invested_refs = cursor.fetchone()['count']
        
        # Determine current rate
        if invested_refs == 0:
            current_rate = Decimal('5.00')
        elif invested_refs == 1:
            current_rate = Decimal('6.00')
        elif invested_refs == 2:
            current_rate = Decimal('7.00')
        elif invested_refs == 3:
            current_rate = Decimal('8.00')
        elif invested_refs == 4:
            current_rate = Decimal('9.00')
        else:
            current_rate = Decimal('10.00')
        
        # Next rate
        next_rate = None
        if invested_refs < 5:
            rate_map = [Decimal('6.00'), Decimal('7.00'), Decimal('8.00'), Decimal('9.00'), Decimal('10.00')]
            next_rate = rate_map[invested_refs] if invested_refs < len(rate_map) else None
        
        stats = ReferralBonusStats(
            total_unclaimed=Decimal(unclaimed['total']),
            unclaimed_count=unclaimed['count'],
            total_claimed=Decimal(claimed['total']),
            claimed_count=claimed['count'],
            direct_referrals=direct_referrals,
            current_rate=current_rate,
            next_referral_rate=next_rate
        )
        
        # Get rate progress
        cursor.execute("""
            SELECT referral_number, percentage, description
            FROM referral_bonus_config
            ORDER BY referral_number
        """)
        
        rate_progress = []
        for row in cursor.fetchall():
            is_unlocked = invested_refs >= row['referral_number'] or (row['referral_number'] == 6 and invested_refs >= 5)
            rate_progress.append(ReferralRateProgress(
                referral_number=row['referral_number'],
                percentage=Decimal(row['percentage']),
                is_unlocked=is_unlocked,
                description=row['description']
            ))
        
        # Get pending bonuses
        cursor.execute("""
            SELECT 
                rb.id,
                rb.referral_id,
                u.username as referral_username,
                u.name as referral_name,
                rb.referral_number,
                rb.investment_amount,
                rb.bonus_percentage,
                rb.bonus_amount,
                rb.created_at
            FROM referral_bonuses rb
            JOIN users u ON rb.referral_id = u.id
            WHERE rb.referrer_id = %s AND rb.status = 'pending'
            ORDER BY rb.created_at DESC
        """, (user_id,))
        
        pending_bonuses = []
        for row in cursor.fetchall():
            pending_bonuses.append(PendingBonus(
                id=row['id'],
                referral_id=row['referral_id'],
                referral_username=row['referral_username'],
                referral_name=row['referral_name'],
                referral_number=row['referral_number'],
                investment_amount=Decimal(row['investment_amount']),
                bonus_percentage=Decimal(row['bonus_percentage']),
                bonus_amount=Decimal(row['bonus_amount']),
                created_at=format_ist_time(row['created_at'])
            ))
        
        # Get claimed bonuses
        cursor.execute("""
            SELECT 
                rb.id,
                u.username as referral_username,
                rb.investment_amount,
                rb.bonus_amount,
                rb.bonus_percentage,
                rb.claimed_at
            FROM referral_bonuses rb
            JOIN users u ON rb.referral_id = u.id
            WHERE rb.referrer_id = %s AND rb.status = 'claimed'
            ORDER BY rb.claimed_at DESC
            LIMIT 20
        """, (user_id,))
        
        claimed_bonuses = []
        for row in cursor.fetchall():
            claimed_bonuses.append(ClaimedBonus(
                id=row['id'],
                referral_username=row['referral_username'],
                investment_amount=Decimal(row['investment_amount']),
                bonus_amount=Decimal(row['bonus_amount']),
                bonus_percentage=Decimal(row['bonus_percentage']),
                claimed_at=format_ist_time(row['claimed_at'])
            ))
        
        cursor.close()
        
        return ReferralBonusOverviewResponse(
            success=True,
            stats=stats,
            rate_progress=rate_progress,
            pending_bonuses=pending_bonuses,
            claimed_bonuses=claimed_bonuses
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.post("/referral-bonus/claim", response_model=ClaimBonusResponse)
def claim_referral_bonus(
    request: ClaimBonusRequest,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Claim a pending referral bonus"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        ist_now = get_ist_time()
        
        # Get bonus details
        cursor.execute("""
            SELECT 
                rb.id,
                rb.referrer_id,
                rb.bonus_amount,
                rb.status,
                u.username as referral_username
            FROM referral_bonuses rb
            JOIN users u ON rb.referral_id = u.id
            WHERE rb.id = %s
        """, (request.bonus_id,))
        
        bonus = cursor.fetchone()
        
        if not bonus:
            raise HTTPException(status_code=404, detail="Bonus not found")
        
        if bonus['referrer_id'] != user_id:
            raise HTTPException(status_code=403, detail="This bonus does not belong to you")
        
        if bonus['status'] == 'claimed':
            raise HTTPException(status_code=400, detail="Bonus already claimed")
        
        bonus_amount = Decimal(bonus['bonus_amount'])
        
        # Get current income balance
        cursor.execute("""
            SELECT income_balance FROM users WHERE id = %s
        """, (user_id,))
        old_balance = Decimal(cursor.fetchone()['income_balance'] or 0)
        new_balance = old_balance + bonus_amount
        
        # Update income wallet
        cursor.execute("""
            UPDATE users
            SET income_balance = income_balance + %s
            WHERE id = %s
        """, (bonus_amount, user_id))
        
        # Update bonus status
        cursor.execute("""
            UPDATE referral_bonuses
            SET status = 'claimed', claimed_at = %s
            WHERE id = %s
        """, (ist_now, request.bonus_id))
        
        # Record claim history
        cursor.execute("""
            INSERT INTO referral_bonus_claims (
                bonus_id, referrer_id, amount, old_balance, new_balance
            ) VALUES (%s, %s, %s, %s, %s)
        """, (request.bonus_id, user_id, bonus_amount, old_balance, new_balance))
        
        # Record in transactions table
        cursor.execute("""
            INSERT INTO transactions (
                user_id, type, amount, currency, description,
                reference_id, reference_type, status, wallet_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, 'referral_bonus', bonus_amount, 'USD',
            f'Referral bonus from {bonus["referral_username"]}',
            request.bonus_id, 'referral_bonus', 'completed', 'income'
        ))
        
        db.commit()
        cursor.close()
        
        return ClaimBonusResponse(
            success=True,
            message="Referral bonus claimed successfully!",
            bonus_id=request.bonus_id,
            amount=bonus_amount,
            referral_username=bonus['referral_username'],
            new_income_balance=new_balance,
            claimed_at=format_ist_time(ist_now)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/referral-bonus", response_model=AdminReferralBonusResponse)
def admin_get_referral_bonus(
    page: int = 1,
    per_page: int = 50,
    status: str = None,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Admin: Get platform-wide referral bonus statistics"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        
        # Platform stats
        cursor.execute("""
            SELECT COALESCE(SUM(bonus_amount), 0) as total, COUNT(*) as count
            FROM referral_bonuses
            WHERE status = 'pending'
        """)
        unclaimed = cursor.fetchone()
        
        cursor.execute("""
            SELECT COALESCE(SUM(bonus_amount), 0) as total, COUNT(*) as count
            FROM referral_bonuses
            WHERE status = 'claimed'
        """)
        claimed = cursor.fetchone()
        
        cursor.execute("""
            SELECT COALESCE(SUM(bonus_amount), 0) as total
            FROM referral_bonuses
        """)
        total_paid = cursor.fetchone()['total']
        
        stats = AdminReferralBonusStats(
            total_unclaimed=Decimal(unclaimed['total']),
            unclaimed_count=unclaimed['count'],
            total_claimed=Decimal(claimed['total']),
            claimed_count=claimed['count'],
            total_paid_all_time=Decimal(total_paid)
        )
        
        # Build query
        conditions = []
        params = []
        
        if status:
            conditions.append("rb.status = %s")
            params.append(status)
        
        if search:
            conditions.append("(u1.username ILIKE %s OR u2.username ILIKE %s)")
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM referral_bonuses rb
            JOIN users u1 ON rb.referrer_id = u1.id
            JOIN users u2 ON rb.referral_id = u2.id
            {where_clause}
        """, params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transactions
        cursor.execute(f"""
            SELECT 
                rb.id,
                rb.referrer_id,
                u1.username as referrer_username,
                rb.referral_id,
                u2.username as referral_username,
                rb.referral_number,
                rb.investment_amount,
                rb.bonus_percentage,
                rb.bonus_amount,
                rb.status,
                rb.claimed_at,
                rb.created_at
            FROM referral_bonuses rb
            JOIN users u1 ON rb.referrer_id = u1.id
            JOIN users u2 ON rb.referral_id = u2.id
            {where_clause}
            ORDER BY rb.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])
        
        transactions = []
        for row in cursor.fetchall():
            transactions.append(AdminBonusTransaction(
                id=row['id'],
                referrer_username=row['referrer_username'],
                referrer_id=row['referrer_id'],
                referral_username=row['referral_username'],
                referral_id=row['referral_id'],
                referral_number=row['referral_number'],
                investment_amount=Decimal(row['investment_amount']),
                bonus_percentage=Decimal(row['bonus_percentage']),
                bonus_amount=Decimal(row['bonus_amount']),
                status=row['status'],
                claimed_at=format_ist_time(row['claimed_at']) if row['claimed_at'] else None,
                created_at=format_ist_time(row['created_at'])
            ))
        
        # Get top referrers
        cursor.execute("""
            SELECT 
                rb.referrer_id,
                u.username,
                COUNT(*) as ref_count,
                SUM(rb.bonus_amount) as total_bonus,
                MAX(rb.bonus_percentage) as current_rate
            FROM referral_bonuses rb
            JOIN users u ON rb.referrer_id = u.id
            WHERE rb.status = 'claimed'
            GROUP BY rb.referrer_id, u.username
            ORDER BY total_bonus DESC
            LIMIT 10
        """)
        
        top_referrers = []
        rank = 1
        for row in cursor.fetchall():
            top_referrers.append(TopReferrer(
                rank=rank,
                username=row['username'],
                user_id=row['referrer_id'],
                direct_referrals=row['ref_count'],
                total_bonus=Decimal(row['total_bonus']),
                current_rate=Decimal(row['current_rate'])
            ))
            rank += 1
        
        # Get rate distribution
        cursor.execute("""
            SELECT 
                rb.bonus_percentage as rate,
                rb.referral_number,
                COUNT(*) as bonus_count,
                SUM(rb.bonus_amount) as total_amount
            FROM referral_bonuses rb
            GROUP BY rb.bonus_percentage, rb.referral_number
            ORDER BY rb.referral_number
        """)
        
        rate_distribution = []
        for row in cursor.fetchall():
            rate_distribution.append(RateDistribution(
                rate=Decimal(row['rate']),
                referral_number=row['referral_number'],
                bonus_count=row['bonus_count'],
                total_amount=Decimal(row['total_amount'])
            ))
        
        cursor.close()
        
        return AdminReferralBonusResponse(
            success=True,
            stats=stats,
            transactions=transactions,
            top_referrers=top_referrers,
            rate_distribution=rate_distribution,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
