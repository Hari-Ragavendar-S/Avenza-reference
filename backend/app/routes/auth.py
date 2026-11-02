from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from app.schemas.auth import RegisterRequest, LoginRequest, LoginResponse
from app.database.connection import get_db
from app.utils.auth import create_token
from app.utils.helpers import generate_referral_code, get_referral_link

router = APIRouter()


def find_extreme_position(cursor, start_node_id, direction, max_depth=100):
    """
    Find the extreme left or right position in a binary subtree.
    
    For LEFT direction: Goes ONLY left (straight down left leg)
    For RIGHT direction: Goes ONLY right (straight down right leg)
    
    Returns: (parent_id, position) where new user should be placed
    """
    current_id = start_node_id
    depth = 0
    
    while depth < max_depth:
        cursor.execute("""
            SELECT id, left_child_id, right_child_id FROM users WHERE id = %s
        """, (current_id,))
        node = cursor.fetchone()
        
        if not node:
            raise HTTPException(status_code=500, detail="Tree traversal error: Node not found")
        
        if direction == 'left':
            # ONLY go left - straight down the left leg
            if not node['left_child_id']:
                return (node['id'], 'left')
            else:
                # Continue going left
                current_id = node['left_child_id']
        
        elif direction == 'right':
            # ONLY go right - straight down the right leg
            if not node['right_child_id']:
                return (node['id'], 'right')
            else:
                # Continue going right
                current_id = node['right_child_id']
        
        else:
            raise HTTPException(status_code=500, detail="Invalid direction")
        
        depth += 1
    
    # If max depth reached, return error
    raise HTTPException(
        status_code=500, 
        detail=f"Tree depth exceeded {max_depth} levels. Please contact support for manual placement."
    )


@router.post("/register", response_model=LoginResponse)
def register(
    request: RegisterRequest, 
    position: str = Query(None, pattern="^(left|right)$"),
    db=Depends(get_db)
):
    """User registration with binary tree position"""
    try:
        cursor = db.cursor()
        
        # Validate passwords match
        if request.password != request.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (request.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (request.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Generate unique referral code
        while True:
            referral_code = generate_referral_code()
            cursor.execute("SELECT id FROM users WHERE referral_code = %s", (referral_code,))
            if not cursor.fetchone():
                break
        
        # Find sponsor by referral ID (username)
        sponsor_id = None
        if request.referral_id:
            # Check if referral_id is a username
            cursor.execute("SELECT id FROM users WHERE username = %s", (request.referral_id,))
            sponsor = cursor.fetchone()
            if sponsor:
                sponsor_id = sponsor['id']
            else:
                raise HTTPException(status_code=400, detail=f"Invalid referral username: {request.referral_id}")
        else:
            raise HTTPException(status_code=400, detail="Referral username is required")
        
        # Determine position in binary tree with extreme placement spillover
        final_position = None
        placement_parent_id = sponsor_id
        
        if sponsor_id:
            cursor.execute("""
                SELECT left_child_id, right_child_id FROM users WHERE id = %s
            """, (sponsor_id,))
            sponsor_data = cursor.fetchone()
            
            if sponsor_data:
                # If position specified in URL
                if position:
                    if position == 'left':
                        # Try direct left first
                        if not sponsor_data['left_child_id']:
                            final_position = 'left'
                            placement_parent_id = sponsor_id
                        else:
                            # Find extreme left position in left subtree
                            placement_parent_id, final_position = find_extreme_position(
                                cursor, sponsor_data['left_child_id'], 'left'
                            )
                    elif position == 'right':
                        # Try direct right first
                        if not sponsor_data['right_child_id']:
                            final_position = 'right'
                            placement_parent_id = sponsor_id
                        else:
                            # Find extreme right position in right subtree
                            placement_parent_id, final_position = find_extreme_position(
                                cursor, sponsor_data['right_child_id'], 'right'
                            )
                else:
                    # Auto-placement: first available
                    if not sponsor_data['left_child_id']:
                        final_position = 'left'
                        placement_parent_id = sponsor_id
                    elif not sponsor_data['right_child_id']:
                        final_position = 'right'
                        placement_parent_id = sponsor_id
                    else:
                        raise HTTPException(
                            status_code=400, 
                            detail="Both positions are full. Please use a specific position link (left/right)."
                        )
        
        # Create user
        cursor.execute("""
            INSERT INTO users (username, email, password, name, mobile, referral_code, sponsor_id, position, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true)
            RETURNING id, username, email, name, referral_code
        """, (request.username, request.email, request.password, request.name, request.mobile, 
              referral_code, sponsor_id, final_position))
        
        new_user = cursor.fetchone()
        
        # Update sponsor's left or right child
        if placement_parent_id and final_position:
            if final_position == 'left':
                cursor.execute("UPDATE users SET left_child_id = %s WHERE id = %s", 
                             (new_user['id'], placement_parent_id))
            else:
                cursor.execute("UPDATE users SET right_child_id = %s WHERE id = %s", 
                             (new_user['id'], placement_parent_id))
        
        # Set the direct sponsor (referrer) - always the original sponsor
        if sponsor_id:
            cursor.execute("UPDATE users SET referred_by = %s WHERE id = %s", 
                         (sponsor_id, new_user['id']))
        
        db.commit()
        
        placement_message = f"placed in the {final_position} position"
        if placement_parent_id != sponsor_id:
            placement_message = f"placed in the extreme {final_position} position of your sponsor's downline"
        
        print(f"✅ New user registered: {new_user['username']} | Position: {final_position} | Placement Parent: {placement_parent_id} | Direct Sponsor: {sponsor_id}")
        
        # Create token
        token = create_token(new_user['id'], new_user['username'], 'user')
        
        # Get referral link
        referral_link = get_referral_link(new_user['username'])
        
        return LoginResponse(
            success=True,
            message=f"Registration successful! You are {placement_message}.",
            token=token,
            user={
                'id': new_user['id'],
                'username': new_user['username'],
                'email': new_user['email'],
                'name': new_user['name'],
                'referral_code': new_user['referral_code'],
                'referral_link': referral_link,
                'type': 'user'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db=Depends(get_db)):
    """User login"""
    try:
        cursor = db.cursor()
        
        # Find user by username
        cursor.execute("""
            SELECT id, username, email, password, name, is_active, referral_code,
                   wallet_address, wallet_type
            FROM users WHERE username = %s
        """, (request.username,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check password (plain text as requested)
        if user['password'] != request.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check if user is active
        if not user['is_active']:
            raise HTTPException(status_code=403, detail="Account is inactive. Contact support.")
        
        # Create token
        token = create_token(user['id'], user['username'], 'user')
        
        # Get referral link
        referral_link = get_referral_link(user['username'])
        
        return LoginResponse(
            success=True,
            message="Login successful",
            token=token,
            user={
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'name': user['name'],
                'referral_code': user['referral_code'],
                'referral_link': referral_link,
                'type': 'user',
                'wallet_connected': bool(user['wallet_address']),
                'wallet_address': user['wallet_address'],
                'wallet_type': user['wallet_type']
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()


# ==================== BINARY REFERRAL REDIRECT ROUTES ====================

@router.get("/{username}/left")
def referral_left_redirect(username: str, db=Depends(get_db)):
    """Redirect to register page with left position"""
    cursor = db.cursor()
    try:
        # Verify username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Redirect to register page with query params
        return RedirectResponse(url=f"/register?ref={username}&position=left")
    finally:
        cursor.close()

@router.get("/{username}/right")
def referral_right_redirect(username: str, db=Depends(get_db)):
    """Redirect to register page with right position"""
    cursor = db.cursor()
    try:
        # Verify username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Redirect to register page with query params
        return RedirectResponse(url=f"/register?ref={username}&position=right")
    finally:
        cursor.close()
