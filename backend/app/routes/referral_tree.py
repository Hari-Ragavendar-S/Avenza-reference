from fastapi import APIRouter, HTTPException, Depends, Header
from app.database.connection import get_db
from app.utils.auth import verify_token
from decimal import Decimal
from datetime import datetime
import pytz

router = APIRouter()

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
    return ist_time.strftime('%b %d, %Y')

@router.get("/referral/tree")
def get_referral_tree(authorization: str = Header(None), db=Depends(get_db)):
    """Get user's binary tree (root user)"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Get extreme left and right
        extreme_left = get_extreme_left(cursor, user_id)
        extreme_right = get_extreme_right(cursor, user_id)
        
        # Get root user data
        tree_data = get_user_tree_node(cursor, user_id, level=0, is_root=True)
        
        cursor.close()
        
        return {
            "success": True,
            "tree": tree_data,
            "extreme_left": extreme_left,
            "extreme_right": extreme_right
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/referral/tree/{user_id}/children")
def get_tree_node_children(
    user_id: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get children of a specific node in the tree"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        requesting_user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Verify user has access to this node (is in their downline)
        if not is_in_downline(cursor, requesting_user_id, user_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get user level
        cursor.execute("""
            WITH RECURSIVE tree AS (
                SELECT id, sponsor_id, 0 as level
                FROM users
                WHERE id = %s
                
                UNION ALL
                
                SELECT u.id, u.sponsor_id, t.level + 1
                FROM users u
                INNER JOIN tree t ON u.sponsor_id = t.id
                WHERE u.id = %s
            )
            SELECT MAX(level) as level FROM tree
        """, (requesting_user_id, user_id))
        
        level_result = cursor.fetchone()
        level = level_result['level'] if level_result else 0
        
        # Get node with children
        node_data = get_user_tree_node(cursor, user_id, level=level, is_root=False)
        
        cursor.close()
        
        return {
            "success": True,
            "node": node_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/referral/tree/search")
def search_tree_members(
    query: str,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Search members in user's downline"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Search in downline
        cursor.execute("""
            WITH RECURSIVE downline AS (
                SELECT id, username, name, sponsor_id, position, 0 as level
                FROM users
                WHERE id = %s
                
                UNION ALL
                
                SELECT u.id, u.username, u.name, u.sponsor_id, u.position, d.level + 1
                FROM users u
                INNER JOIN downline d ON u.sponsor_id = d.id
            )
            SELECT 
                d.id,
                d.username,
                d.name,
                d.position,
                d.level,
                d.sponsor_id,
                u.username as sponsor_username
            FROM downline d
            LEFT JOIN users u ON d.sponsor_id = u.id
            WHERE (d.username ILIKE %s OR d.name ILIKE %s)
            AND d.id != %s
            ORDER BY d.level, d.username
            LIMIT 20
        """, (user_id, f'%{query}%', f'%{query}%', user_id))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "id": row['id'],
                "username": row['username'],
                "name": row['name'],
                "position": row['position'] or 'root',
                "level": row['level'],
                "sponsor_id": row['sponsor_id'],
                "sponsor_username": row['sponsor_username']
            })
        
        cursor.close()
        
        return {
            "success": True,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/referral/tree/{user_id}/details")
def get_user_details(
    user_id: int,
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get detailed information about a specific user in the tree"""
    try:
        token = authorization.replace('Bearer ', '') if authorization else None
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = verify_token(token)
        if not user_data:
            raise HTTPException(status_code=403, detail="Invalid token")
        
        requesting_user_id = user_data.get('user_id')
        cursor = db.cursor()
        
        # Verify access
        if requesting_user_id != user_id and not is_in_downline(cursor, requesting_user_id, user_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get user basic info
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.name,
                u.email,
                u.mobile,
                u.position,
                u.is_active,
                u.created_at,
                u.profile_photo_url,
                sponsor.username as sponsor_username
            FROM users u
            LEFT JOIN users sponsor ON u.sponsor_id = sponsor.id
            WHERE u.id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get investment details
        cursor.execute("""
            SELECT 
                COUNT(*) as total_investments,
                COALESCE(SUM(invested_amount), 0) as total_invested,
                COALESCE(SUM(CASE WHEN status = 'active' THEN invested_amount ELSE 0 END), 0) as active_investment
            FROM user_investments
            WHERE user_id = %s
        """, (user_id,))
        investment_data = cursor.fetchone()
        
        # Get wallet balances
        cursor.execute("""
            SELECT 
                COALESCE(balance, 0) as deposit_balance,
                COALESCE(income_balance, 0) as income_balance,
                COALESCE(roi_balance, 0) as roi_balance
            FROM users
            WHERE id = %s
        """, (user_id,))
        wallet_data = cursor.fetchone()
        
        # Get direct referrals count
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM users
            WHERE sponsor_id = %s
        """, (user_id,))
        direct_refs = cursor.fetchone()['count']
        
        # Get team size
        cursor.execute("""
            WITH RECURSIVE downline AS (
                SELECT id FROM users WHERE id = %s
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN downline d ON u.sponsor_id = d.id
            )
            SELECT COUNT(*) - 1 as team_size FROM downline
        """, (user_id,))
        team_size = cursor.fetchone()['team_size']
        
        # Get left and right team counts
        cursor.execute("""
            WITH RECURSIVE left_team AS (
                SELECT id FROM users WHERE id = (SELECT left_child_id FROM users WHERE id = %s)
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN left_team lt ON u.sponsor_id = lt.id
            )
            SELECT COUNT(*) as left_count FROM left_team
        """, (user_id,))
        left_count = cursor.fetchone()['left_count']
        
        cursor.execute("""
            WITH RECURSIVE right_team AS (
                SELECT id FROM users WHERE id = (SELECT right_child_id FROM users WHERE id = %s)
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN right_team rt ON u.sponsor_id = rt.id
            )
            SELECT COUNT(*) as right_count FROM right_team
        """, (user_id,))
        right_count = cursor.fetchone()['right_count']
        
        # Get recent transactions
        cursor.execute("""
            SELECT 
                type,
                amount,
                status,
                created_at
            FROM transactions
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 5
        """, (user_id,))
        
        recent_transactions = []
        for row in cursor.fetchall():
            recent_transactions.append({
                "type": row['type'],
                "amount": float(row['amount']),
                "status": row['status'],
                "date": format_ist_time(row['created_at'])
            })
        
        cursor.close()
        
        return {
            "success": True,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "name": user['name'],
                "email": user['email'],
                "mobile": user['mobile'],
                "position": user['position'] or 'root',
                "is_active": user['is_active'],
                "join_date": format_ist_time(user['created_at']),
                "sponsor_username": user['sponsor_username'],
                "profile_photo_url": user['profile_photo_url']
            },
            "investment": {
                "total_investments": investment_data['total_investments'],
                "total_invested": float(investment_data['total_invested']),
                "active_investment": float(investment_data['active_investment'])
            },
            "wallet": {
                "deposit_balance": float(wallet_data['deposit_balance']),
                "income_balance": float(wallet_data['income_balance']),
                "roi_balance": float(wallet_data['roi_balance'])
            },
            "team": {
                "direct_referrals": direct_refs,
                "total_team_size": team_size,
                "left_team": left_count,
                "right_team": right_count
            },
            "recent_transactions": recent_transactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# Helper functions

def get_user_tree_node(cursor, user_id, level=0, is_root=False):
    """Get user tree node with basic info and children"""
    
    # Get user info
    cursor.execute("""
        SELECT 
            u.id,
            u.username,
            u.name,
            u.position,
            u.is_active,
            u.created_at,
            u.left_child_id,
            u.right_child_id,
            u.profile_photo_url,
            COALESCE((
                SELECT COUNT(*) FROM users WHERE sponsor_id = u.id
            ), 0) as direct_referrals,
            COALESCE((
                SELECT SUM(invested_amount) FROM user_investments WHERE user_id = u.id AND status = 'active'
            ), 0) as active_investment
        FROM users u
        WHERE u.id = %s
    """, (user_id,))
    
    user = cursor.fetchone()
    
    if not user:
        return None
    
    # Get team size
    cursor.execute("""
        WITH RECURSIVE downline AS (
            SELECT id FROM users WHERE id = %s
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN downline d ON u.sponsor_id = d.id
        )
        SELECT COUNT(*) - 1 as team_size FROM downline
    """, (user_id,))
    team_size = cursor.fetchone()['team_size']
    
    node = {
        "id": user['id'],
        "username": user['username'],
        "name": user['name'],
        "position": user['position'] if not is_root else 'root',
        "level": level,
        "is_active": user['is_active'],
        "join_date": format_ist_time(user['created_at']),
        "direct_referrals": user['direct_referrals'],
        "team_size": team_size,
        "active_investment": float(user['active_investment']),
        "profile_photo_url": user['profile_photo_url'],
        "has_left_child": user['left_child_id'] is not None,
        "has_right_child": user['right_child_id'] is not None,
        "left_child": None,
        "right_child": None
    }
    
    # Load all children recursively (no level limit)
    if user['left_child_id']:
        node['left_child'] = get_user_tree_node(cursor, user['left_child_id'], level + 1)
    
    if user['right_child_id']:
        node['right_child'] = get_user_tree_node(cursor, user['right_child_id'], level + 1)
    
    return node

def is_in_downline(cursor, sponsor_id, user_id):
    """Check if user_id is in sponsor_id's downline"""
    cursor.execute("""
        WITH RECURSIVE downline AS (
            SELECT id FROM users WHERE id = %s
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN downline d ON u.sponsor_id = d.id
        )
        SELECT EXISTS(SELECT 1 FROM downline WHERE id = %s) as is_in_downline
    """, (sponsor_id, user_id))
    
    result = cursor.fetchone()
    return result['is_in_downline'] if result else False

def get_extreme_left(cursor, user_id):
    """Get the extreme left member (deepest leftmost) in the binary tree"""
    cursor.execute("""
        WITH RECURSIVE extreme_path AS (
            SELECT id, username, name, left_child_id, 0 as depth
            FROM users
            WHERE id = %s
            
            UNION ALL
            
            SELECT u.id, u.username, u.name, u.left_child_id, ep.depth + 1
            FROM users u
            INNER JOIN extreme_path ep ON u.id = ep.left_child_id
            WHERE ep.left_child_id IS NOT NULL
        )
        SELECT id, username, name, depth
        FROM extreme_path
        ORDER BY depth DESC
        LIMIT 1
    """, (user_id,))
    
    result = cursor.fetchone()
    if result and result['id'] != user_id:
        return {
            'id': result['id'],
            'username': result['username'],
            'name': result['name'],
            'depth': result['depth']
        }
    return None

def get_extreme_right(cursor, user_id):
    """Get the extreme right member (deepest rightmost) in the binary tree"""
    cursor.execute("""
        WITH RECURSIVE extreme_path AS (
            SELECT id, username, name, right_child_id, 0 as depth
            FROM users
            WHERE id = %s
            
            UNION ALL
            
            SELECT u.id, u.username, u.name, u.right_child_id, ep.depth + 1
            FROM users u
            INNER JOIN extreme_path ep ON u.id = ep.right_child_id
            WHERE ep.right_child_id IS NOT NULL
        )
        SELECT id, username, name, depth
        FROM extreme_path
        ORDER BY depth DESC
        LIMIT 1
    """, (user_id,))
    
    result = cursor.fetchone()
    if result and result['id'] != user_id:
        return {
            'id': result['id'],
            'username': result['username'],
            'name': result['name'],
            'depth': result['depth']
        }
    return None
