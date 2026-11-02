"""
Binary Matching Bonus Routes
Handles binary tree, matching calculations, and bonus distribution
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.binary_matching import (
    MatchingTiersResponse, MatchingTier,
    BinaryTreeResponse, BinaryTreeNode,
    MatchingHistoryResponse, MatchingHistoryItem,
    MatchingHistoryDetail, MatchContributor,
    BinaryDashboardResponse, BinaryStatistics,
    ReferralLinksResponse, TeamVolumeResponse
)
from app.database.connection import get_db
from app.utils.auth import verify_token
from decimal import Decimal
from datetime import datetime
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
    return ist_time.strftime('%b %d, %Y - %I:%M:%S %p IST')

def get_current_user(authorization: str = Header(None)):
    """Get current user from token"""
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_data

# ==================== BINARY TREE ENDPOINTS ====================

@router.get("/binary/tree", response_model=BinaryTreeResponse)
def get_binary_tree(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's binary tree structure"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get current user data
        cursor.execute("""
            SELECT id, username, name, position, left_child_id, right_child_id,
                   left_business, right_business, total_matched, pending_left, pending_right,
                   profile_photo_url, is_active
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get left child
        left_child = None
        if user['left_child_id']:
            cursor.execute("""
                SELECT id, username, name, position, left_business, right_business,
                       profile_photo_url, is_active
                FROM users WHERE id = %s
            """, (user['left_child_id'],))
            left_data = cursor.fetchone()
            if left_data:
                # Count team under left child
                cursor.execute("""
                    WITH RECURSIVE tree AS (
                        SELECT id, left_child_id, right_child_id FROM users WHERE id = %s
                        UNION ALL
                        SELECT u.id, u.left_child_id, u.right_child_id 
                        FROM users u
                        INNER JOIN tree t ON u.id = t.left_child_id OR u.id = t.right_child_id
                    )
                    SELECT COUNT(*) as total FROM tree WHERE id != %s
                """, (user['left_child_id'], user['left_child_id']))
                team_count = cursor.fetchone()['total']
                
                left_child = BinaryTreeNode(
                    user_id=left_data['id'],
                    username=left_data['username'],
                    name=left_data['name'],
                    position=left_data['position'],
                    left_business=Decimal(left_data['left_business'] or 0),
                    right_business=Decimal(left_data['right_business'] or 0),
                    total_team=team_count,
                    profile_photo_url=left_data['profile_photo_url'],
                    is_active=left_data['is_active']
                )
        
        # Get right child
        right_child = None
        if user['right_child_id']:
            cursor.execute("""
                SELECT id, username, name, position, left_business, right_business,
                       profile_photo_url, is_active
                FROM users WHERE id = %s
            """, (user['right_child_id'],))
            right_data = cursor.fetchone()
            if right_data:
                # Count team under right child
                cursor.execute("""
                    WITH RECURSIVE tree AS (
                        SELECT id, left_child_id, right_child_id FROM users WHERE id = %s
                        UNION ALL
                        SELECT u.id, u.left_child_id, u.right_child_id 
                        FROM users u
                        INNER JOIN tree t ON u.id = t.left_child_id OR u.id = t.right_child_id
                    )
                    SELECT COUNT(*) as total FROM tree WHERE id != %s
                """, (user['right_child_id'], user['right_child_id']))
                team_count = cursor.fetchone()['total']
                
                right_child = BinaryTreeNode(
                    user_id=right_data['id'],
                    username=right_data['username'],
                    name=right_data['name'],
                    position=right_data['position'],
                    left_business=Decimal(right_data['left_business'] or 0),
                    right_business=Decimal(right_data['right_business'] or 0),
                    total_team=team_count,
                    profile_photo_url=right_data['profile_photo_url'],
                    is_active=right_data['is_active']
                )
        
        # Count total team for current user
        cursor.execute("""
            WITH RECURSIVE tree AS (
                SELECT id, left_child_id, right_child_id FROM users WHERE id = %s
                UNION ALL
                SELECT u.id, u.left_child_id, u.right_child_id 
                FROM users u
                INNER JOIN tree t ON u.id = t.left_child_id OR u.id = t.right_child_id
            )
            SELECT COUNT(*) as total FROM tree WHERE id != %s
        """, (user_id, user_id))
        total_team = cursor.fetchone()['total']
        
        cursor.close()
        
        current_user_node = BinaryTreeNode(
            user_id=user['id'],
            username=user['username'],
            name=user['name'],
            position=user['position'],
            left_business=Decimal(user['left_business'] or 0),
            right_business=Decimal(user['right_business'] or 0),
            total_team=total_team,
            profile_photo_url=user['profile_photo_url'],
            is_active=user['is_active']
        )
        
        return BinaryTreeResponse(
            success=True,
            user=current_user_node,
            left_child=left_child,
            right_child=right_child,
            left_business=Decimal(user['left_business'] or 0),
            right_business=Decimal(user['right_business'] or 0),
            matched_amount=Decimal(user['total_matched'] or 0),
            pending_left=Decimal(user['pending_left'] or 0),
            pending_right=Decimal(user['pending_right'] or 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== MATCHING TIERS ENDPOINTS ====================

@router.get("/binary/tiers", response_model=MatchingTiersResponse)
def get_matching_tiers(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get all matching bonus tiers with user's progress"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get user's current matched amount
        cursor.execute("""
            SELECT total_matched FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        current_matched = Decimal(user['total_matched'] or 0)
        
        # Get all tiers with prize information
        cursor.execute("""
            SELECT level, required_match, bonus_amount, is_active,
                   prize_type, prize_name, prize_description, prize_image_url
            FROM binary_matching_tiers
            WHERE is_active = true
            ORDER BY level ASC
        """)
        tiers_data = cursor.fetchall()
        
        # Get claimed tiers with prize claim status
        cursor.execute("""
            SELECT tier_level, claimed_at, prize_claimed, prize_claim_date
            FROM binary_matching_claims
            WHERE user_id = %s
        """, (user_id,))
        claimed_data = cursor.fetchall()
        claimed_tiers = {row['tier_level']: {
            'claimed_at': row['claimed_at'],
            'prize_claimed': row['prize_claimed'],
            'prize_claim_date': row['prize_claim_date']
        } for row in claimed_data}
        
        cursor.close()
        
        tiers = []
        next_tier_level = None
        next_tier_bonus = None
        
        for tier in tiers_data:
            is_claimed = tier['level'] in claimed_tiers
            claim_info = claimed_tiers.get(tier['level'], {})
            progress = min(100.0, (float(current_matched) / float(tier['required_match'])) * 100)
            
            tiers.append(MatchingTier(
                level=tier['level'],
                required_match=Decimal(tier['required_match']),
                bonus_amount=Decimal(tier['bonus_amount']),
                is_active=tier['is_active'],
                is_claimed=is_claimed,
                claimed_at=format_ist_time(claim_info.get('claimed_at')) if is_claimed else None,
                progress_percentage=progress,
                prize_type=tier['prize_type'],
                prize_name=tier['prize_name'],
                prize_description=tier['prize_description'],
                prize_image_url=tier['prize_image_url'],
                prize_claimed=claim_info.get('prize_claimed', False) if is_claimed else False,
                prize_claim_date=format_ist_time(claim_info.get('prize_claim_date')) if is_claimed and claim_info.get('prize_claim_date') else None
            ))
            
            # Find next unclaimed tier
            if not is_claimed and next_tier_level is None and current_matched < tier['required_match']:
                next_tier_level = tier['level']
                next_tier_bonus = Decimal(tier['bonus_amount'])
        
        return MatchingTiersResponse(
            success=True,
            tiers=tiers,
            current_matched=current_matched,
            next_tier_level=next_tier_level,
            next_tier_bonus=next_tier_bonus
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== MATCHING HISTORY ENDPOINTS ====================

@router.get("/binary/history", response_model=MatchingHistoryResponse)
def get_matching_history(
    page: int = 1,
    per_page: int = 20,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's matching bonus history"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(*) as total FROM binary_matching_history WHERE user_id = %s
        """, (user_id,))
        total = cursor.fetchone()['total']
        
        # Calculate pagination
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # Get history
        cursor.execute("""
            SELECT id, matched_amount, left_volume, right_volume, bonus_earned,
                   level_achieved, tier_name, carry_forward_left, carry_forward_right, created_at
            FROM binary_matching_history
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, per_page, offset))
        
        history_data = cursor.fetchall()
        cursor.close()
        
        history = [
            MatchingHistoryItem(
                id=h['id'],
                matched_amount=Decimal(h['matched_amount']),
                left_volume=Decimal(h['left_volume']),
                right_volume=Decimal(h['right_volume']),
                bonus_earned=Decimal(h['bonus_earned']),
                level_achieved=h['level_achieved'],
                tier_name=h['tier_name'],
                carry_forward_left=Decimal(h['carry_forward_left'] or 0),
                carry_forward_right=Decimal(h['carry_forward_right'] or 0),
                created_at=format_ist_time(h['created_at'])
            ) for h in history_data
        ]
        
        return MatchingHistoryResponse(
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

# ==================== DASHBOARD ENDPOINT ====================

@router.get("/binary/dashboard", response_model=BinaryDashboardResponse)
def get_binary_dashboard(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get complete binary matching dashboard data"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get user statistics
        cursor.execute("""
            SELECT left_business, right_business, total_matched, pending_left, pending_right,
                   matching_bonus_earned, last_matched_at
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        # Count team members
        cursor.execute("""
            WITH RECURSIVE left_tree AS (
                SELECT id, left_child_id, right_child_id, is_active FROM users WHERE id = (SELECT left_child_id FROM users WHERE id = %s)
                UNION ALL
                SELECT u.id, u.left_child_id, u.right_child_id, u.is_active
                FROM users u
                INNER JOIN left_tree lt ON u.id = lt.left_child_id OR u.id = lt.right_child_id
            )
            SELECT 
                COUNT(*) as total_left,
                COUNT(*) FILTER (WHERE is_active = true) as active_left
            FROM left_tree
        """, (user_id,))
        left_team = cursor.fetchone()
        
        cursor.execute("""
            WITH RECURSIVE right_tree AS (
                SELECT id, left_child_id, right_child_id, is_active FROM users WHERE id = (SELECT right_child_id FROM users WHERE id = %s)
                UNION ALL
                SELECT u.id, u.left_child_id, u.right_child_id, u.is_active
                FROM users u
                INNER JOIN right_tree rt ON u.id = rt.left_child_id OR u.id = rt.right_child_id
            )
            SELECT 
                COUNT(*) as total_right,
                COUNT(*) FILTER (WHERE is_active = true) as active_right
            FROM right_tree
        """, (user_id,))
        right_team = cursor.fetchone()
        
        statistics = BinaryStatistics(
            total_left_business=Decimal(user['left_business'] or 0),
            total_right_business=Decimal(user['right_business'] or 0),
            total_matched=Decimal(user['total_matched'] or 0),
            pending_left=Decimal(user['pending_left'] or 0),
            pending_right=Decimal(user['pending_right'] or 0),
            matching_bonus_earned=Decimal(user['matching_bonus_earned'] or 0),
            total_left_team=left_team['total_left'] or 0,
            total_right_team=right_team['total_right'] or 0,
            active_left_team=left_team['active_left'] or 0,
            active_right_team=right_team['active_right'] or 0,
            last_matched_at=format_ist_time(user['last_matched_at'])
        )
        
        # Get available tiers (not claimed)
        cursor.execute("""
            SELECT t.level, t.required_match, t.bonus_amount, t.is_active
            FROM binary_matching_tiers t
            LEFT JOIN binary_matching_claims c ON t.level = c.tier_level AND c.user_id = %s
            WHERE t.is_active = true AND c.id IS NULL
            ORDER BY t.level ASC
            LIMIT 5
        """, (user_id,))
        tiers_data = cursor.fetchall()
        
        current_matched = Decimal(user['total_matched'] or 0)
        available_tiers = []
        for tier in tiers_data:
            progress = min(100.0, (float(current_matched) / float(tier['required_match'])) * 100)
            available_tiers.append(MatchingTier(
                level=tier['level'],
                required_match=Decimal(tier['required_match']),
                bonus_amount=Decimal(tier['bonus_amount']),
                is_active=tier['is_active'],
                is_claimed=False,
                progress_percentage=progress
            ))
        
        # Get recent matches
        cursor.execute("""
            SELECT id, matched_amount, left_volume, right_volume, bonus_earned,
                   level_achieved, tier_name, carry_forward_left, carry_forward_right, created_at
            FROM binary_matching_history
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 5
        """, (user_id,))
        recent_data = cursor.fetchall()
        
        recent_matches = [
            MatchingHistoryItem(
                id=h['id'],
                matched_amount=Decimal(h['matched_amount']),
                left_volume=Decimal(h['left_volume']),
                right_volume=Decimal(h['right_volume']),
                bonus_earned=Decimal(h['bonus_earned']),
                level_achieved=h['level_achieved'],
                tier_name=h['tier_name'],
                carry_forward_left=Decimal(h['carry_forward_left'] or 0),
                carry_forward_right=Decimal(h['carry_forward_right'] or 0),
                created_at=format_ist_time(h['created_at'])
            ) for h in recent_data
        ]
        
        cursor.close()
        
        # Calculate next milestone
        next_milestone = None
        if available_tiers:
            next_tier = available_tiers[0]
            remaining = float(next_tier.required_match) - float(current_matched)
            next_milestone = {
                'level': next_tier.level,
                'required_match': float(next_tier.required_match),
                'bonus_amount': float(next_tier.bonus_amount),
                'remaining': remaining,
                'progress_percentage': next_tier.progress_percentage
            }
        
        return BinaryDashboardResponse(
            success=True,
            statistics=statistics,
            available_tiers=available_tiers,
            recent_matches=recent_matches,
            next_milestone=next_milestone
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== REFERRAL LINKS ENDPOINT ====================

@router.get("/binary/referral-links", response_model=ReferralLinksResponse)
def get_referral_links(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get binary referral links for left and right placement"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        username = user['username']
        base_url = "https://avenza.live/register"
        
        return ReferralLinksResponse(
            success=True,
            username=username,
            left_link=f"{base_url}?ref={username}&position=left",
            right_link=f"{base_url}?ref={username}&position=right",
            left_qr_code=None,  # Can implement QR code generation later
            right_qr_code=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ==================== TEAM VOLUME ENDPOINT ====================

@router.get("/binary/team-volume", response_model=TeamVolumeResponse)
def get_team_volume(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get team volume statistics"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT username, left_business, right_business
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        # Count left team
        cursor.execute("""
            WITH RECURSIVE left_tree AS (
                SELECT id FROM users WHERE id = (SELECT left_child_id FROM users WHERE id = %s)
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN left_tree lt ON u.id IN (
                    SELECT left_child_id FROM users WHERE id = lt.id
                    UNION
                    SELECT right_child_id FROM users WHERE id = lt.id
                )
            )
            SELECT COUNT(*) as total FROM left_tree
        """, (user_id,))
        left_count = cursor.fetchone()['total']
        
        # Count right team
        cursor.execute("""
            WITH RECURSIVE right_tree AS (
                SELECT id FROM users WHERE id = (SELECT right_child_id FROM users WHERE id = %s)
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN right_tree rt ON u.id IN (
                    SELECT left_child_id FROM users WHERE id = rt.id
                    UNION
                    SELECT right_child_id FROM users WHERE id = rt.id
                )
            )
            SELECT COUNT(*) as total FROM right_tree
        """, (user_id,))
        right_count = cursor.fetchone()['total']
        
        cursor.close()
        
        left_business = Decimal(user['left_business'] or 0)
        right_business = Decimal(user['right_business'] or 0)
        
        return TeamVolumeResponse(
            success=True,
            user_id=user_id,
            username=user['username'],
            left_business=left_business,
            right_business=right_business,
            left_team_count=left_count,
            right_team_count=right_count,
            total_business=left_business + right_business
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ==================== CLAIMS ENDPOINTS ====================

@router.get("/binary/claims")
def get_user_claims(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's claimed tiers"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get all claimed tiers for user
        cursor.execute("""
            SELECT tier_level, claimed_at, prize_claimed, prize_claim_date
            FROM binary_matching_claims
            WHERE user_id = %s
            ORDER BY tier_level ASC
        """, (user_id,))
        
        claims_data = cursor.fetchall()
        cursor.close()
        
        claims = [
            {
                'tier_level': claim['tier_level'],
                'claimed_at': format_ist_time(claim['claimed_at']),
                'prize_claimed': claim['prize_claimed'],
                'prize_claim_date': format_ist_time(claim['prize_claim_date']) if claim['prize_claim_date'] else None
            } for claim in claims_data
        ]
        
        return {
            'success': True,
            'claims': claims
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.post("/binary/claim/{tier_level}")
def claim_tier_bonus(
    tier_level: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Claim cash bonus for unlocked tier"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get user's current matched amount
        cursor.execute("""
            SELECT total_matched, matching_bonus_earned, income_wallet
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_matched = Decimal(user['total_matched'] or 0)
        
        # Get tier information
        cursor.execute("""
            SELECT level, required_match, bonus_amount, prize_type, prize_name
            FROM binary_matching_tiers
            WHERE level = %s AND is_active = true
        """, (tier_level,))
        tier = cursor.fetchone()
        
        if not tier:
            raise HTTPException(status_code=404, detail="Tier not found")
        
        # Check if user has enough matched volume
        if current_matched < tier['required_match']:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient matched volume. Need {tier['required_match']}, have {current_matched}"
            )
        
        # Check if already claimed
        cursor.execute("""
            SELECT id FROM binary_matching_claims
            WHERE user_id = %s AND tier_level = %s
        """, (user_id, tier_level))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Tier already claimed")
        
        # Create claim record
        from datetime import datetime
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        
        cursor.execute("""
            INSERT INTO binary_matching_claims 
            (user_id, tier_level, bonus_amount, matched_volume_at_claim, claimed_at, prize_claimed)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, tier_level, tier['bonus_amount'], current_matched, now, False))
        
        # Update user's wallet and bonus earned
        new_income_wallet = Decimal(user['income_wallet'] or 0) + tier['bonus_amount']
        new_bonus_earned = Decimal(user['matching_bonus_earned'] or 0) + tier['bonus_amount']
        
        cursor.execute("""
            UPDATE users
            SET income_wallet = %s,
                matching_bonus_earned = %s
            WHERE id = %s
        """, (new_income_wallet, new_bonus_earned, user_id))
        
        # Add transaction record
        cursor.execute("""
            INSERT INTO wallet_transactions
            (user_id, transaction_type, amount, description, balance_after, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            'matching_bonus',
            tier['bonus_amount'],
            f"Binary Matching Level {tier_level} Bonus Claimed",
            new_income_wallet,
            now
        ))
        
        db.commit()
        cursor.close()
        
        return {
            'success': True,
            'message': f"Congratulations! Level {tier_level} bonus claimed successfully!",
            'tier_level': tier_level,
            'bonus_earned': float(tier['bonus_amount']),
            'new_income_wallet': float(new_income_wallet),
            'prize_name': tier['prize_name'] if tier['prize_type'] and tier['prize_type'] != 'cash' else None,
            'claimed_at': format_ist_time(now)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ==================== DETAILED MATCHING HISTORY ENDPOINT ====================

@router.get("/binary/history/{history_id}/details")
def get_match_details(
    history_id: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get detailed breakdown of a specific match showing contributing members"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Get the match history record
        cursor.execute("""
            SELECT 
                id, user_id, matched_amount, left_volume, right_volume,
                bonus_earned, level_achieved, tier_name,
                previous_left, previous_right, created_at
            FROM binary_matching_history
            WHERE id = %s AND user_id = %s
        """, (history_id, user_id))
        
        match = cursor.fetchone()
        if not match:
            raise HTTPException(status_code=404, detail="Match history not found")
        
        print(f"DEBUG: Match found - ID: {match['id']}, Time: {match['created_at']}")
        
        # Get user's left and right child IDs
        cursor.execute("""
            SELECT left_child_id, right_child_id FROM users WHERE id = %s
        """, (user_id,))
        user_children = cursor.fetchone()
        left_root_id = user_children['left_child_id']
        right_root_id = user_children['right_child_id']
        
        # Get ALL investments from left leg only
        left_contributors = []
        if left_root_id:
            cursor.execute("""
                WITH RECURSIVE left_tree AS (
                    SELECT id, left_child_id, right_child_id
                    FROM users 
                    WHERE id = %s
                    
                    UNION ALL
                    
                    SELECT u.id, u.left_child_id, u.right_child_id
                    FROM users u
                    INNER JOIN left_tree lt ON u.id = lt.left_child_id OR u.id = lt.right_child_id
                )
                SELECT 
                    u.id as user_id,
                    u.username,
                    u.name,
                    u.profile_photo_url,
                    ip.name as package_name,
                    ip.amount,
                    ui.created_at as invested_at
                FROM user_investments ui
                JOIN users u ON ui.user_id = u.id
                JOIN investment_packages ip ON ui.package_id = ip.id
                WHERE ui.user_id IN (SELECT id FROM left_tree)
                AND ui.status = 'active'
                ORDER BY ui.created_at DESC
            """, (left_root_id,))
            
            for contrib in cursor.fetchall():
                left_contributors.append({
                    'user_id': contrib['user_id'],
                    'username': contrib['username'],
                    'name': contrib['name'],
                    'package_name': contrib['package_name'],
                    'amount': float(contrib['amount']),
                    'invested_at': format_ist_time(contrib['invested_at']),
                    'profile_photo_url': contrib['profile_photo_url']
                })
        
        # Get ALL investments from right leg only
        right_contributors = []
        if right_root_id:
            cursor.execute("""
                WITH RECURSIVE right_tree AS (
                    SELECT id, left_child_id, right_child_id
                    FROM users 
                    WHERE id = %s
                    
                    UNION ALL
                    
                    SELECT u.id, u.left_child_id, u.right_child_id
                    FROM users u
                    INNER JOIN right_tree rt ON u.id = rt.left_child_id OR u.id = rt.right_child_id
                )
                SELECT 
                    u.id as user_id,
                    u.username,
                    u.name,
                    u.profile_photo_url,
                    ip.name as package_name,
                    ip.amount,
                    ui.created_at as invested_at
                FROM user_investments ui
                JOIN users u ON ui.user_id = u.id
                JOIN investment_packages ip ON ui.package_id = ip.id
                WHERE ui.user_id IN (SELECT id FROM right_tree)
                AND ui.status = 'active'
                ORDER BY ui.created_at DESC
            """, (right_root_id,))
            
            for contrib in cursor.fetchall():
                right_contributors.append({
                    'user_id': contrib['user_id'],
                    'username': contrib['username'],
                    'name': contrib['name'],
                    'package_name': contrib['package_name'],
                    'amount': float(contrib['amount']),
                    'invested_at': format_ist_time(contrib['invested_at']),
                    'profile_photo_url': contrib['profile_photo_url']
                })
        
        # Calculate bonus rate
        bonus_rate = 0
        if match['matched_amount'] > 0:
            bonus_rate = (float(match['bonus_earned']) / float(match['matched_amount'])) * 100
        
        cursor.close()
        
        return {
            'success': True,
            'history_id': match['id'],
            'your_income': float(match['bonus_earned']),
            'matched_amount': float(match['matched_amount']),
            'left_total': float(match['left_volume']),
            'right_total': float(match['right_volume']),
            'left_contributors': left_contributors,
            'right_contributors': right_contributors,
            'tier_achieved': match['level_achieved'],
            'tier_name': match['tier_name'],
            'bonus_rate': round(bonus_rate, 2),
            'status': 'paid',
            'created_at': format_ist_time(match['created_at']),
            'before_match_left': float(match['previous_left'] or 0),
            'before_match_right': float(match['previous_right'] or 0),
            'after_match_left': float(match['left_volume']),
            'after_match_right': float(match['right_volume'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR in get_match_details: {error_details}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.post("/binary/claim-prize/{tier_level}")
def claim_prize(
    tier_level: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Claim physical prize (BMW or Villa)"""
    try:
        user_data = get_current_user(authorization)
        user_id = user_data.get('user_id')
        
        cursor = db.cursor()
        
        # Check if tier is unlocked
        cursor.execute("""
            SELECT tier_level, prize_claimed, prize_claim_date
            FROM binary_matching_claims
            WHERE user_id = %s AND tier_level = %s
        """, (user_id, tier_level))
        
        claim = cursor.fetchone()
        if not claim:
            raise HTTPException(status_code=400, detail="Tier not unlocked yet")
        
        if claim['prize_claimed']:
            raise HTTPException(
                status_code=400, 
                detail=f"Prize already claimed on {format_ist_time(claim['prize_claim_date'])}"
            )
        
        # Get tier prize info
        cursor.execute("""
            SELECT prize_type, prize_name FROM binary_matching_tiers WHERE level = %s
        """, (tier_level,))
        tier = cursor.fetchone()
        
        if not tier or not tier['prize_type'] or tier['prize_type'] == 'cash':
            raise HTTPException(status_code=400, detail="No physical prize for this tier")
        
        # Mark prize as claimed
        from datetime import datetime
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        
        cursor.execute("""
            UPDATE binary_matching_claims
            SET prize_claimed = true,
                prize_claim_date = %s,
                prize_claim_notes = %s
            WHERE user_id = %s AND tier_level = %s
        """, (now, f"Prize claim initiated for {tier['prize_name']}", user_id, tier_level))
        
        db.commit()
        cursor.close()
        
        return {
            'success': True,
            'message': f"Prize claim successful! Admin will contact you soon for {tier['prize_name']} delivery.",
            'prize_name': tier['prize_name'],
            'prize_type': tier['prize_type'],
            'claimed_at': format_ist_time(now)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
