from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.wallet_auth import (
    WalletNonceRequest, WalletNonceResponse, 
    WalletLoginRequest, WalletLoginResponse,
    ConnectWalletRequest, ConnectWalletResponse,
    DisconnectWalletResponse, WalletStatusResponse
)
from app.database.connection import get_db
from app.utils.auth import create_token, verify_token
from app.utils.helpers import get_referral_link
from datetime import datetime, timedelta
import secrets
import hashlib
from eth_account.messages import encode_defunct
from eth_account import Account
import pytz

router = APIRouter()

IST = pytz.timezone('Asia/Kolkata')

def verify_signature(message: str, signature: str, wallet_address: str) -> bool:
    """Verify Ethereum signature"""
    try:
        # Create the message hash
        message_hash = encode_defunct(text=message)
        # Recover the address from signature
        recovered_address = Account.recover_message(message_hash, signature=signature)
        # Compare addresses (case-insensitive)
        return recovered_address.lower() == wallet_address.lower()
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

@router.post("/auth/wallet-nonce", response_model=WalletNonceResponse)
def get_wallet_nonce(request: WalletNonceRequest, db=Depends(get_db)):
    """Generate nonce for wallet authentication"""
    try:
        cursor = db.cursor()
        
        # Validate wallet address format (Ethereum: 0x + 40 hex chars)
        wallet_address = request.wallet_address.lower()
        if not wallet_address.startswith('0x') or len(wallet_address) != 42:
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        
        # Generate random nonce
        nonce = secrets.token_hex(32)
        
        # Set expiration (10 minutes from now in UTC - database stores in UTC)
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # Delete old unused nonces for this wallet (cleanup)
        cursor.execute("""
            DELETE FROM wallet_login_nonces 
            WHERE wallet_address = %s OR expires_at < NOW()
        """, (wallet_address,))
        
        # Store nonce
        cursor.execute("""
            INSERT INTO wallet_login_nonces (wallet_address, nonce, expires_at, used)
            VALUES (%s, %s, %s, false)
        """, (wallet_address, nonce, expires_at))
        
        db.commit()
        
        # Create message to sign
        message = f"Sign this message to authenticate with Avenza.\n\nNonce: {nonce}\n\nThis request will expire in 10 minutes."
        
        print(f"✅ Nonce generated for {wallet_address}: {nonce[:16]}... expires at {expires_at}")
        
        return WalletNonceResponse(
            nonce=nonce,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error generating nonce: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

@router.post("/auth/wallet-login", response_model=WalletLoginResponse)
def wallet_login(request: WalletLoginRequest, db=Depends(get_db)):
    """Login with wallet signature"""
    try:
        cursor = db.cursor()
        
        wallet_address = request.wallet_address.lower()
        
        print(f"🔐 Wallet login attempt for: {wallet_address}")
        
        # Find valid nonce
        cursor.execute("""
            SELECT nonce, expires_at, used 
            FROM wallet_login_nonces
            WHERE wallet_address = %s AND used = false
            ORDER BY created_at DESC
            LIMIT 1
        """, (wallet_address,))
        
        nonce_record = cursor.fetchone()
        
        if not nonce_record:
            print(f"❌ No valid nonce found for {wallet_address}")
            raise HTTPException(status_code=400, detail="No valid nonce found. Please request a new nonce.")
        
        print(f"✅ Nonce found: {nonce_record['nonce'][:16]}..., used={nonce_record['used']}, expires={nonce_record['expires_at']}")
        
        # Check if expired (compare in UTC)
        from datetime import datetime
        now_utc = datetime.utcnow()
        expires_utc = nonce_record['expires_at'].replace(tzinfo=None) if nonce_record['expires_at'].tzinfo else nonce_record['expires_at']
        
        print(f"⏰ Now UTC: {now_utc}, Expires UTC: {expires_utc}")
        
        if now_utc > expires_utc:
            print(f"❌ Nonce expired for {wallet_address}")
            raise HTTPException(status_code=400, detail="Nonce expired. Please request a new nonce.")
        
        # Verify signature
        message = f"Sign this message to authenticate with Avenza.\n\nNonce: {nonce_record['nonce']}\n\nThis request will expire in 10 minutes."
        
        print(f"🔍 Verifying signature...")
        if not verify_signature(message, request.signature, wallet_address):
            print(f"❌ Invalid signature for {wallet_address}")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        print(f"✅ Signature verified for {wallet_address}")
        
        # Mark nonce as used ONLY AFTER successful verification
        cursor.execute("""
            UPDATE wallet_login_nonces
            SET used = true
            WHERE wallet_address = %s AND nonce = %s
        """, (wallet_address, nonce_record['nonce']))
        
        # Find user by wallet address
        cursor.execute("""
            SELECT id, username, email, name, is_active, referral_code, wallet_address, wallet_type
            FROM users 
            WHERE LOWER(wallet_address) = %s
        """, (wallet_address,))
        
        user = cursor.fetchone()
        
        if not user:
            db.commit()
            return WalletLoginResponse(
                success=False,
                message="Wallet not connected to any account. Please connect your wallet from profile settings.",
                wallet_connected=False
            )
        
        # Check if user is active
        if not user['is_active']:
            raise HTTPException(status_code=403, detail="Account is inactive. Contact support.")
        
        # Log connection
        cursor.execute("""
            INSERT INTO wallet_connection_logs (user_id, wallet_address, wallet_type, action)
            VALUES (%s, %s, %s, %s)
        """, (user['id'], wallet_address, user['wallet_type'], 'login'))
        
        db.commit()
        
        # Create token
        token = create_token(user['id'], user['username'], 'user')
        
        # Get referral link
        referral_link = get_referral_link(user['username'])
        
        return WalletLoginResponse(
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
                'wallet_connected': True,
                'wallet_address': user['wallet_address'],
                'wallet_type': user['wallet_type']
            },
            wallet_connected=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

@router.post("/user/connect-wallet", response_model=ConnectWalletResponse)
def connect_wallet(
    request: ConnectWalletRequest, 
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Connect wallet to existing user account"""
    try:
        # Verify user token
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = authorization.replace('Bearer ', '')
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = payload['user_id']
        cursor = db.cursor()
        
        wallet_address = request.wallet_address.lower()
        
        # Validate wallet address format
        if not wallet_address.startswith('0x') or len(wallet_address) != 42:
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        
        # Validate wallet type
        valid_types = ['metamask', 'trust', 'safePal', 'walletConnect', 'coinbase']
        if request.wallet_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid wallet type. Must be one of: {', '.join(valid_types)}")
        
        # Get nonce for verification
        cursor.execute("""
            SELECT nonce, expires_at, used 
            FROM wallet_login_nonces
            WHERE wallet_address = %s AND used = false
            ORDER BY created_at DESC
            LIMIT 1
        """, (wallet_address,))
        
        nonce_record = cursor.fetchone()
        if not nonce_record:
            raise HTTPException(status_code=400, detail="No valid nonce found. Please request a new nonce.")
        
        # Check if expired (compare in UTC)
        from datetime import datetime
        now_utc = datetime.utcnow()
        expires_utc = nonce_record['expires_at'].replace(tzinfo=None) if nonce_record['expires_at'].tzinfo else nonce_record['expires_at']
        
        if now_utc > expires_utc:
            raise HTTPException(status_code=400, detail="Nonce expired. Please request a new nonce.")
        
        # Verify signature
        message = f"Sign this message to authenticate with Avenza.\n\nNonce: {nonce_record['nonce']}\n\nThis request will expire in 10 minutes."
        
        if not verify_signature(message, request.signature, wallet_address):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Mark nonce as used ONLY AFTER successful verification
        cursor.execute("""
            UPDATE wallet_login_nonces
            SET used = true
            WHERE wallet_address = %s AND nonce = %s
        """, (wallet_address, nonce_record['nonce']))
        
        # Check if wallet is already connected to another account
        cursor.execute("""
            SELECT id, username FROM users 
            WHERE LOWER(wallet_address) = %s AND id != %s
        """, (wallet_address, user_id))
        
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail=f"This wallet is already connected to account: {existing_user['username']}"
            )
        
        # Check if user already has a wallet connected
        cursor.execute("""
            SELECT wallet_address FROM users WHERE id = %s
        """, (user_id,))
        
        current_user = cursor.fetchone()
        if current_user['wallet_address']:
            raise HTTPException(
                status_code=400, 
                detail="You already have a wallet connected. Disconnect it first to connect a new one."
            )
        
        # Connect wallet to user
        now = datetime.now(IST)
        cursor.execute("""
            UPDATE users 
            SET wallet_address = %s, 
                wallet_type = %s, 
                wallet_connected_at = %s,
                updated_at = %s
            WHERE id = %s
        """, (wallet_address, request.wallet_type, now, now, user_id))
        
        # Log connection
        cursor.execute("""
            INSERT INTO wallet_connection_logs (user_id, wallet_address, wallet_type, action)
            VALUES (%s, %s, %s, %s)
        """, (user_id, wallet_address, request.wallet_type, 'connect'))
        
        db.commit()
        
        return ConnectWalletResponse(
            success=True,
            message=f"Wallet connected successfully! You can now use {request.wallet_type} to sign in.",
            wallet_address=wallet_address,
            wallet_type=request.wallet_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

@router.post("/user/disconnect-wallet", response_model=DisconnectWalletResponse)
def disconnect_wallet(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Disconnect wallet from user account"""
    try:
        # Verify user token
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = authorization.replace('Bearer ', '')
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = payload['user_id']
        cursor = db.cursor()
        
        # Get current wallet
        cursor.execute("""
            SELECT wallet_address, wallet_type FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        if not user['wallet_address']:
            raise HTTPException(status_code=400, detail="No wallet connected")
        
        # Log disconnection
        cursor.execute("""
            INSERT INTO wallet_connection_logs (user_id, wallet_address, wallet_type, action)
            VALUES (%s, %s, %s, %s)
        """, (user_id, user['wallet_address'], user['wallet_type'], 'disconnect'))
        
        # Disconnect wallet
        cursor.execute("""
            UPDATE users 
            SET wallet_address = NULL, 
                wallet_type = NULL, 
                wallet_connected_at = NULL,
                updated_at = %s
            WHERE id = %s
        """, (datetime.now(IST), user_id))
        
        db.commit()
        
        return DisconnectWalletResponse(
            success=True,
            message="Wallet disconnected successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()

@router.get("/user/wallet-status", response_model=WalletStatusResponse)
def get_wallet_status(
    authorization: str = Header(None),
    db=Depends(get_db)
):
    """Get user's wallet connection status"""
    try:
        # Verify user token
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = authorization.replace('Bearer ', '')
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = payload['user_id']
        cursor = db.cursor()
        
        # Get wallet status
        cursor.execute("""
            SELECT wallet_address, wallet_type, wallet_connected_at
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if user['wallet_address']:
            return WalletStatusResponse(
                wallet_connected=True,
                wallet_address=user['wallet_address'],
                wallet_type=user['wallet_type'],
                connected_at=user['wallet_connected_at'].strftime('%Y-%m-%d %I:%M %p') if user['wallet_connected_at'] else None
            )
        else:
            return WalletStatusResponse(
                wallet_connected=False
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        cursor.close()
