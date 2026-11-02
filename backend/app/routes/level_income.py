from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.level_income import (
    LevelIncomeStatsResponse, LevelIncomeStats, LevelBreakdown,
    TeamMemberEarning, LevelIncomeHistoryResponse, LevelIncomeTransaction,
    TeamTreeResponse, TeamMember,
    AdminLevelIncomeResponse, AdminLevelIncomeStats, AdminLevelTransaction,
    TopEarner
)
from app.database.connection import get_db
from app.utils.auth import verify_token
from decimal import Decimal
from datetime import datetime, date, timedelta
import pytz

router = APIRouter()

def calculate_unlocked_levels(direct_referrals):
    """Calculate how many levels are unlocked based on direct referrals"""
    if direct_referrals == 0:
        return 0
    if direct_referrals >= 10:
        return 20  # Max levels
    return direct_referrals * 2

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

@router.get("/level-income/your-level")
def get_your_level_status(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's level unlock status and potential earnings"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get TOTAL direct referrals count
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM users
            WHERE sponsor_id = %s
        """, (user_id,))
        total_direct_referrals = cursor.fetchone()['count']
        
        # Get ACTIVE direct referrals count (with active investments)
        cursor.execute("""
            SELECT COUNT(DISTINCT u.id) as count
            FROM users u
            INNER JOIN user_investments ui ON u.id = ui.user_id
            WHERE u.sponsor_id = %s AND ui.status = 'active'
        """, (user_id,))
        active_direct_referrals = cursor.fetchone()['count']
        
        # Calculate unlocked levels based on ACTIVE referrals only
        unlocked_levels = calculate_unlocked_levels(active_direct_referrals)
        
        # Get level breakdown with earnings (only for unlocked levels)
        if unlocked_levels > 0:
            cursor.execute("""
                SELECT 
                    level,
                    COUNT(DISTINCT from_user_id) as member_count,
                    COALESCE(SUM(CASE 
                        WHEN DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE 
                        THEN income_amount ELSE 0 END), 0) as today_earned
                FROM level_income_transactions
                WHERE recipient_id = %s AND level <= %s
                GROUP BY level
                ORDER BY level
            """, (user_id, unlocked_levels))
            
            level_breakdown = []
            for row in cursor.fetchall():
                level_breakdown.append({
                    'level': row['level'],
                    'member_count': row['member_count'],
                    'today_earned': float(row['today_earned'])
                })
        else:
            level_breakdown = []
        
        # Calculate locked potential (simplified - count team beyond unlocked levels)
        if unlocked_levels < 20:
            cursor.execute("""
                WITH RECURSIVE downline AS (
                    SELECT id, sponsor_id, 0 as level FROM users WHERE id = %s
                    UNION ALL
                    SELECT u.id, u.sponsor_id, d.level + 1
                    FROM users u
                    INNER JOIN downline d ON u.sponsor_id = d.id
                    WHERE d.level < 20
                )
                SELECT COUNT(*) as locked_members
                FROM downline
                WHERE level > %s AND level <= 20
            """, (user_id, unlocked_levels))
            
            locked_members = cursor.fetchone()['locked_members']
            # Estimate: Assume $1 per member per day as locked potential
            locked_potential = locked_members * 1.0
        else:
            locked_potential = 0
        
        cursor.close()
        
        return {
            "success": True,
            "total_direct_referrals": total_direct_referrals,
            "active_direct_referrals": active_direct_referrals,
            "direct_referrals": active_direct_referrals,  # For backward compatibility
            "unlocked_levels": unlocked_levels,
            "level_breakdown": level_breakdown,
            "locked_potential": locked_potential
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/level-income/stats", response_model=LevelIncomeStatsResponse)
def get_level_income_stats(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's level income statistics and breakdown"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        # Get today's total
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total
            FROM level_income_transactions
            WHERE recipient_id = %s AND DATE(created_at) = %s
        """, (user_id, today))
        today_total = cursor.fetchone()['total']
        
        # Get week total
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total
            FROM level_income_transactions
            WHERE recipient_id = %s AND DATE(created_at) >= %s
        """, (user_id, week_start))
        week_total = cursor.fetchone()['total']
        
        # Get month total
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total
            FROM level_income_transactions
            WHERE recipient_id = %s AND DATE(created_at) >= %s
        """, (user_id, month_start))
        month_total = cursor.fetchone()['total']
        
        # Get all time total
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total
            FROM level_income_transactions
            WHERE recipient_id = %s
        """, (user_id,))
        all_time_total = cursor.fetchone()['total']
        
        # Get total team members
        cursor.execute("""
            SELECT COUNT(DISTINCT from_user_id) as count
            FROM level_income_transactions
            WHERE recipient_id = %s
        """, (user_id,))
        total_team = cursor.fetchone()['count']
        
        # Get active today count
        cursor.execute("""
            SELECT COUNT(DISTINCT from_user_id) as count
            FROM level_income_transactions
            WHERE recipient_id = %s AND DATE(created_at) = %s
        """, (user_id, today))
        active_today = cursor.fetchone()['count']
        
        # Get level breakdown
        cursor.execute("""
            SELECT 
                lit.level,
                lic.percentage,
                COUNT(DISTINCT lit.from_user_id) as member_count,
                COALESCE(SUM(CASE WHEN DATE(lit.created_at) = %s THEN lit.income_amount ELSE 0 END), 0) as today_earned
            FROM level_income_transactions lit
            JOIN level_income_config lic ON lit.level = lic.level
            WHERE lit.recipient_id = %s
            GROUP BY lit.level, lic.percentage
            ORDER BY lit.level
        """, (today, user_id))
        
        level_breakdown = []
        for row in cursor.fetchall():
            level_breakdown.append(LevelBreakdown(
                level=row['level'],
                percentage=Decimal(row['percentage']),
                member_count=row['member_count'],
                today_earned=Decimal(row['today_earned'])
            ))
        
        # Get today's team performance
        cursor.execute("""
            SELECT 
                lit.from_user_id,
                u.username,
                u.name,
                lit.level,
                lit.roi_amount,
                lit.income_amount,
                lit.created_at
            FROM level_income_transactions lit
            JOIN users u ON lit.from_user_id = u.id
            WHERE lit.recipient_id = %s AND DATE(lit.created_at) = %s
            ORDER BY lit.created_at DESC
            LIMIT 10
        """, (user_id, today))
        
        team_performance = []
        for row in cursor.fetchall():
            team_performance.append(TeamMemberEarning(
                user_id=row['from_user_id'],
                username=row['username'],
                name=row['name'],
                level=row['level'],
                roi_received=Decimal(row['roi_amount']),
                your_earning=Decimal(row['income_amount']),
                earned_at=format_ist_time(row['created_at'])
            ))
        
        cursor.close()
        
        stats = LevelIncomeStats(
            today_total=Decimal(today_total),
            week_total=Decimal(week_total),
            month_total=Decimal(month_total),
            all_time_total=Decimal(all_time_total),
            total_team_members=total_team,
            active_today=active_today
        )
        
        return LevelIncomeStatsResponse(
            success=True,
            stats=stats,
            level_breakdown=level_breakdown,
            today_team_performance=team_performance
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/level-income/history", response_model=LevelIncomeHistoryResponse)
def get_level_income_history(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's level income transaction history"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM level_income_transactions
            WHERE recipient_id = %s
        """, (user_id,))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transactions
        cursor.execute("""
            SELECT 
                lit.id,
                lit.from_user_id,
                u.username as from_username,
                lit.level,
                lit.percentage,
                lit.roi_amount,
                lit.income_amount,
                lit.created_at
            FROM level_income_transactions lit
            JOIN users u ON lit.from_user_id = u.id
            WHERE lit.recipient_id = %s
            ORDER BY lit.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, per_page, offset))
        
        transactions = []
        for row in cursor.fetchall():
            transactions.append(LevelIncomeTransaction(
                id=row['id'],
                from_username=row['from_username'],
                from_user_id=row['from_user_id'],
                level=row['level'],
                percentage=Decimal(row['percentage']),
                roi_amount=Decimal(row['roi_amount']),
                income_amount=Decimal(row['income_amount']),
                created_at=format_ist_time(row['created_at'])
            ))
        
        cursor.close()
        
        return LevelIncomeHistoryResponse(
            success=True,
            transactions=transactions,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/level-income/team-tree", response_model=TeamTreeResponse)
def get_team_tree(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's team tree with earnings info"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        today = date.today()
        
        # Get all team members with their info
        cursor.execute("""
            SELECT DISTINCT
                lit.from_user_id,
                u.username,
                u.name,
                lit.level,
                COALESCE(SUM(CASE WHEN DATE(lit.created_at) = %s THEN lit.income_amount ELSE 0 END), 0) as today_earned
            FROM level_income_transactions lit
            JOIN users u ON lit.from_user_id = u.id
            WHERE lit.recipient_id = %s
            GROUP BY lit.from_user_id, u.username, u.name, lit.level
            ORDER BY lit.level, today_earned DESC
            LIMIT 50
        """, (today, user_id))
        
        team_members = []
        for row in cursor.fetchall():
            # Count direct referrals of this member
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM users
                WHERE sponsor_id = %s
            """, (row['from_user_id'],))
            direct_refs = cursor.fetchone()['count']
            
            team_members.append(TeamMember(
                user_id=row['from_user_id'],
                username=row['username'],
                name=row['name'],
                level=row['level'],
                direct_referrals=direct_refs,
                total_team=0,  # Can be calculated with recursive query if needed
                today_earned_from_them=Decimal(row['today_earned'])
            ))
        
        cursor.close()
        
        return TeamTreeResponse(
            success=True,
            team_members=team_members,
            total_members=len(team_members)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/level-income", response_model=AdminLevelIncomeResponse)
def admin_get_level_income(
    page: int = 1,
    per_page: int = 50,
    search: str = None,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Admin: Get platform-wide level income statistics"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data or user_data.get('type') != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        cursor = db.cursor()
        today = date.today()
        month_start = today.replace(day=1)
        
        # Platform stats
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total
            FROM level_income_transactions
            WHERE DATE(created_at) = %s
        """, (today,))
        today_total = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT COUNT(DISTINCT recipient_id) as count
            FROM level_income_transactions
            WHERE DATE(created_at) = %s
        """, (today,))
        today_recipients = cursor.fetchone()['count']
        
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total
            FROM level_income_transactions
            WHERE DATE(created_at) >= %s
        """, (month_start,))
        month_total = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT COALESCE(SUM(income_amount), 0) as total, COUNT(*) as count
            FROM level_income_transactions
        """)
        all_time = cursor.fetchone()
        
        stats = AdminLevelIncomeStats(
            today_total=Decimal(today_total),
            today_recipients=today_recipients,
            month_total=Decimal(month_total),
            all_time_total=Decimal(all_time['total']),
            total_transactions=all_time['count']
        )
        
        # Build query with search
        conditions = []
        params = []
        
        if search:
            conditions.append("""
                (u1.username ILIKE %s OR u2.username ILIKE %s)
            """)
            search_param = f'%{search}%'
            params.extend([search_param, search_param])
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) as total
            FROM level_income_transactions lit
            JOIN users u1 ON lit.recipient_id = u1.id
            JOIN users u2 ON lit.from_user_id = u2.id
            {where_clause}
        """, params)
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get transactions
        cursor.execute(f"""
            SELECT 
                lit.id,
                lit.recipient_id,
                u1.username as recipient_username,
                lit.from_user_id,
                u2.username as from_username,
                lit.level,
                lit.percentage,
                lit.roi_amount,
                lit.income_amount,
                lit.created_at
            FROM level_income_transactions lit
            JOIN users u1 ON lit.recipient_id = u1.id
            JOIN users u2 ON lit.from_user_id = u2.id
            {where_clause}
            ORDER BY lit.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])
        
        transactions = []
        for row in cursor.fetchall():
            transactions.append(AdminLevelTransaction(
                id=row['id'],
                recipient_username=row['recipient_username'],
                recipient_id=row['recipient_id'],
                from_username=row['from_username'],
                from_user_id=row['from_user_id'],
                level=row['level'],
                percentage=Decimal(row['percentage']),
                roi_amount=Decimal(row['roi_amount']),
                income_amount=Decimal(row['income_amount']),
                created_at=format_ist_time(row['created_at'])
            ))
        
        # Get top earners today
        cursor.execute("""
            SELECT 
                lit.recipient_id,
                u.username,
                COUNT(DISTINCT lit.from_user_id) as team_size,
                SUM(lit.income_amount) as earned_today
            FROM level_income_transactions lit
            JOIN users u ON lit.recipient_id = u.id
            WHERE DATE(lit.created_at) = %s
            GROUP BY lit.recipient_id, u.username
            ORDER BY earned_today DESC
            LIMIT 10
        """, (today,))
        
        top_earners = []
        rank = 1
        for row in cursor.fetchall():
            top_earners.append(TopEarner(
                rank=rank,
                username=row['username'],
                user_id=row['recipient_id'],
                team_size=row['team_size'],
                earned_today=Decimal(row['earned_today'])
            ))
            rank += 1
        
        # Get level breakdown
        cursor.execute("""
            SELECT 
                lit.level,
                lic.percentage,
                COUNT(*) as transaction_count,
                COALESCE(SUM(CASE WHEN DATE(lit.created_at) = %s THEN lit.income_amount ELSE 0 END), 0) as today_earned
            FROM level_income_transactions lit
            JOIN level_income_config lic ON lit.level = lic.level
            GROUP BY lit.level, lic.percentage
            ORDER BY lit.level
        """, (today,))
        
        level_breakdown = []
        for row in cursor.fetchall():
            level_breakdown.append(LevelBreakdown(
                level=row['level'],
                percentage=Decimal(row['percentage']),
                member_count=row['transaction_count'],
                today_earned=Decimal(row['today_earned'])
            ))
        
        cursor.close()
        
        return AdminLevelIncomeResponse(
            success=True,
            stats=stats,
            transactions=transactions,
            top_earners=top_earners,
            level_breakdown=level_breakdown,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
