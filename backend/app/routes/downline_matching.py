"""
Downline Matching Bonus Routes
Handles downline matching bonus stats and history
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.downline_matching import (
    DownlineMatchingStatsResponse, DownlineMatchingStats,
    DownlineMatchingHistoryResponse, DownlineMatchingHistory
)
from app.database.connection import get_db
from app.utils.auth import verify_token
from decimal import Decimal
import pytz

router = APIRouter()

IST = pytz.timezone('Asia/Kolkata')

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
    return ist_time.strftime('%b %d, %Y - %I:%M %p IST')

def get_current_user(authorization: str = Header(None)):
    """Get current user from token"""
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_data

# ==================== STATS ENDPOINT ====================

@router.get("/downline-matching/stats", response_model=DownlineMatchingStatsResponse)
def get_downline_matching_stats(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's downline matching bonus statistics"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get user's highest package and bonus rate
        cursor.execute("""
            SELECT ui.invested_amount 
            FROM user_investments ui
            WHERE ui.user_id = %s AND ui.status = 'active'
            ORDER BY ui.invested_amount DESC
            LIMIT 1
        """, (user_id,))
        
        package_result = cursor.fetchone()
        highest_package = Decimal(package_result['invested_amount']) if package_result else None
        
        # Get bonus percentage (Bronze $50→5%, Silver $100→6%, Gold $300→7%, Platinum $1K→8%, Diamond $3K→9%, Elite $5K→10%)
        bonus_rates = {
            Decimal('50'): Decimal('5'),
            Decimal('100'): Decimal('6'),
            Decimal('300'): Decimal('7'),
            Decimal('1000'): Decimal('8'),
            Decimal('3000'): Decimal('9'),
            Decimal('5000'): Decimal('10'),
        }
        bonus_percentage = bonus_rates.get(highest_package) if highest_package else None
        
        # Get statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_matches,
                COALESCE(SUM(user_received), 0) as total_earned,
                COALESCE(SUM(admin_received), 0) as total_sent_to_admin,
                COALESCE(AVG(user_received), 0) as average_per_match
            FROM downline_matching_bonus_history
            WHERE user_id = %s
        """, (user_id,))
        
        stats_data = cursor.fetchone()
        
        # Get recent matches (last 5)
        cursor.execute("""
            SELECT 
                h.id, h.downline_user_id, h.match_amount,
                h.user_package_amount, h.bonus_percentage,
                h.calculated_bonus, h.user_received, h.admin_received,
                h.created_at, u.username as downline_username
            FROM downline_matching_bonus_history h
            JOIN users u ON h.downline_user_id = u.id
            WHERE h.user_id = %s
            ORDER BY h.created_at DESC
            LIMIT 5
        """, (user_id,))
        
        recent_data = cursor.fetchall()
        
        cursor.close()
        
        stats = DownlineMatchingStats(
            total_earned=Decimal(stats_data['total_earned'] or 0),
            total_matches=stats_data['total_matches'] or 0,
            total_sent_to_admin=Decimal(stats_data['total_sent_to_admin'] or 0),
            lowest_package_amount=highest_package,
            bonus_percentage=bonus_percentage,
            average_per_match=Decimal(stats_data['average_per_match'] or 0)
        )
        
        recent_matches = [
            DownlineMatchingHistory(
                id=h['id'],
                downline_user_id=h['downline_user_id'],
                downline_username=h['downline_username'],
                match_amount=Decimal(h['match_amount']),
                user_package_amount=Decimal(h['user_package_amount']),
                bonus_percentage=Decimal(h['bonus_percentage']),
                calculated_bonus=Decimal(h['calculated_bonus']),
                user_received=Decimal(h['user_received']),
                admin_received=Decimal(h['admin_received']),
                created_at=format_ist_time(h['created_at'])
            ) for h in recent_data
        ]
        
        return DownlineMatchingStatsResponse(
            success=True,
            stats=stats,
            recent_matches=recent_matches
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== HISTORY ENDPOINT ====================

@router.get("/downline-matching/history", response_model=DownlineMatchingHistoryResponse)
def get_downline_matching_history(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's complete downline matching bonus history"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM downline_matching_bonus_history 
            WHERE user_id = %s
        """, (user_id,))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get history
        cursor.execute("""
            SELECT 
                h.id, h.downline_user_id, h.match_amount,
                h.user_package_amount, h.bonus_percentage,
                h.calculated_bonus, h.user_received, h.admin_received,
                h.created_at, u.username as downline_username
            FROM downline_matching_bonus_history h
            JOIN users u ON h.downline_user_id = u.id
            WHERE h.user_id = %s
            ORDER BY h.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, per_page, offset))
        
        history_data = cursor.fetchall()
        cursor.close()
        
        history = [
            DownlineMatchingHistory(
                id=h['id'],
                downline_user_id=h['downline_user_id'],
                downline_username=h['downline_username'],
                match_amount=Decimal(h['match_amount']),
                user_package_amount=Decimal(h['user_package_amount']),
                bonus_percentage=Decimal(h['bonus_percentage']),
                calculated_bonus=Decimal(h['calculated_bonus']),
                user_received=Decimal(h['user_received']),
                admin_received=Decimal(h['admin_received']),
                created_at=format_ist_time(h['created_at'])
            ) for h in history_data
        ]
        
        return DownlineMatchingHistoryResponse(
            success=True,
            history=history,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
