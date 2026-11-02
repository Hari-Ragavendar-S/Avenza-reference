"""
File Upload Routes
Handles profile photo uploads
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from app.utils.auth import verify_token
import os
import uuid
from pathlib import Path

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("/var/www/avenza/frontend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def get_current_user(authorization: str = Header(None)):
    """Get current user from token"""
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data or user_data.get('type') != 'user':
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {"id": user_data.get('user_id'), "username": user_data.get('username')}

@router.post("/upload/photo")
@router.post("/upload/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Upload profile photo"""
    
    # Validate auth
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data or user_data.get('type') != 'user':
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = user_data.get('user_id')
    
    # Validate file type
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size: 5MB"
        )
    
    # Generate unique filename
    unique_filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Save file
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Generate URL
        file_url = f"https://avenza.live/uploads/{unique_filename}"
        
        return {
            "success": True,
            "file_url": file_url,
            "url": file_url,
            "message": "Photo uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

@router.delete("/upload/profile-photo")
def delete_profile_photo(
    filename: str,
    authorization: str = Header(None)
):
    """Delete profile photo"""
    
    # Validate auth
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data or user_data.get('type') != 'user':
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = user_data.get('user_id')
    
    # Validate filename belongs to user
    if not filename.startswith(f"profile_{user_id}_"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return {
            "success": True,
            "message": "Photo deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
