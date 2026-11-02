"""
Support Chat Routes
Handles user-admin support messaging
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from app.utils.auth import verify_token
from app.database.connection import get_db
from app.schemas.support import (
    SendMessageRequest, ChatHistoryResponse, UnreadCountResponse,
    AdminReplyRequest, ConversationsListResponse, AdminChatHistoryResponse,
    SupportStatsResponse, SupportMessage, UserConversation
)
import math

router = APIRouter()

def get_current_user(authorization: str = Header(None)):
    """Get current user from token"""
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data or user_data.get('type') != 'user':
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {"id": user_data.get('user_id'), "username": user_data.get('username')}

def get_current_admin(authorization: str = Header(None)):
    """Get current admin from token"""
    token = authorization.replace('Bearer ', '') if authorization else None
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = verify_token(token)
    if not user_data or user_data.get('type') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {"id": user_data.get('user_id'), "username": user_data.get('username')}

# ==================== USER ENDPOINTS ====================

@router.get("/support/messages", response_model=ChatHistoryResponse)
def get_my_support_messages(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    """Get chat history with admin"""
    cursor = db.cursor()
    
    try:
        user_id = current_user["id"]
        
        # Get all messages
        cursor.execute("""
            SELECT id, user_id, message, sender_type, admin_id, is_read, 
                   TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') as created_at
            FROM support_messages
            WHERE user_id = %s
            ORDER BY created_at ASC
        """, (user_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append(SupportMessage(
                id=row['id'],
                user_id=row['user_id'],
                message=row['message'],
                sender_type=row['sender_type'],
                admin_id=row['admin_id'],
                is_read=row['is_read'],
                created_at=row['created_at'],
                is_mine=(row['sender_type'] == 'user')  # User's own messages
            ))
        
        # Mark admin messages as read
        cursor.execute("""
            UPDATE support_messages 
            SET is_read = TRUE 
            WHERE user_id = %s AND sender_type = 'admin' AND is_read = FALSE
        """, (user_id,))
        db.commit()
        
        return ChatHistoryResponse(
            messages=messages,
            total=len(messages)
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/support/message")
def send_support_message(
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """User sends message to admin"""
    cursor = db.cursor()
    
    try:
        user_id = current_user["id"]
        
        # Insert message
        cursor.execute("""
            INSERT INTO support_messages (user_id, message, sender_type, is_read)
            VALUES (%s, %s, 'user', FALSE)
            RETURNING id, TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') as created_at
        """, (user_id, request.message.strip()))
        
        result = cursor.fetchone()
        db.commit()
        
        return {
            "success": True,
            "message": "Message sent to admin",
            "data": {
                "id": result['id'],
                "created_at": result['created_at']
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.get("/support/unread-count", response_model=UnreadCountResponse)
def get_unread_support_count(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    """Get count of unread admin replies"""
    cursor = db.cursor()
    
    try:
        user_id = current_user["id"]
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM support_messages 
            WHERE user_id = %s AND sender_type = 'admin' AND is_read = FALSE
        """, (user_id,))
        
        count = cursor.fetchone()['count']
        
        return UnreadCountResponse(unread_count=count)
        
    finally:
        cursor.close()

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/support/users", response_model=ConversationsListResponse)
def get_support_conversations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=100),
    current_admin: dict = Depends(get_current_admin),
    db=Depends(get_db)
):
    """Get list of users with support messages"""
    cursor = db.cursor()
    
    try:
        offset = (page - 1) * per_page
        
        # Build search condition
        search_condition = ""
        search_params = []
        if search.strip():
            search_condition = "AND (u.username ILIKE %s OR u.name ILIKE %s OR u.email ILIKE %s)"
            search_term = f"%{search.strip()}%"
            search_params = [search_term, search_term, search_term]
        
        # Get total count
        cursor.execute(f"""
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE EXISTS (SELECT 1 FROM support_messages WHERE user_id = u.id)
            {search_condition}
        """, search_params)
        
        total = cursor.fetchone()['total']
        total_pages = math.ceil(total / per_page)
        
        # Get conversations with pagination
        cursor.execute(f"""
            SELECT 
                u.id,
                u.username,
                u.name,
                u.email,
                u.profile_photo_url,
                (SELECT message FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
                (SELECT COUNT(*) FROM support_messages WHERE user_id = u.id AND sender_type = 'user' AND is_read = FALSE) AS unread_count,
                (SELECT COUNT(*) FROM support_messages WHERE user_id = u.id) AS total_messages
            FROM users u
            WHERE EXISTS (SELECT 1 FROM support_messages WHERE user_id = u.id)
            {search_condition}
            ORDER BY (SELECT created_at FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) DESC
            LIMIT %s OFFSET %s
        """, search_params + [per_page, offset])
        
        conversations = []
        for row in cursor.fetchall():
            conversations.append(UserConversation(
                user_id=row['id'],
                username=row['username'],
                name=row['name'],
                email=row['email'],
                profile_photo_url=row['profile_photo_url'],
                last_message=row['last_message'],
                last_message_time=row['last_message_time'],
                unread_count=row['unread_count'],
                total_messages=row['total_messages']
            ))
        
        return ConversationsListResponse(
            conversations=conversations,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    finally:
        cursor.close()

@router.get("/admin/support/chat/{user_id}", response_model=AdminChatHistoryResponse)
def get_user_support_chat(
    user_id: int,
    current_admin: dict = Depends(get_current_admin),
    db=Depends(get_db)
):
    """Get chat history with specific user"""
    cursor = db.cursor()
    
    try:
        # Get user info
        cursor.execute("""
            SELECT id, username, name, email, profile_photo_url, 
                   avenza_balance, income_balance, gaming_balance
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_info = {
            "id": user_row['id'],
            "username": user_row['username'],
            "name": user_row['name'],
            "email": user_row['email'],
            "profile_photo_url": user_row['profile_photo_url'],
            "avenza_balance": float(user_row['avenza_balance']) if user_row['avenza_balance'] else 0,
            "income_balance": float(user_row['income_balance']) if user_row['income_balance'] else 0,
            "gaming_balance": float(user_row['gaming_balance']) if user_row['gaming_balance'] else 0
        }
        
        # Get all messages
        cursor.execute("""
            SELECT id, user_id, message, sender_type, admin_id, is_read,
                   TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') as created_at
            FROM support_messages
            WHERE user_id = %s
            ORDER BY created_at ASC
        """, (user_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append(SupportMessage(
                id=row['id'],
                user_id=row['user_id'],
                message=row['message'],
                sender_type=row['sender_type'],
                admin_id=row['admin_id'],
                is_read=row['is_read'],
                created_at=row['created_at'],
                is_mine=(row['sender_type'] == 'admin')  # Admin's own messages
            ))
        
        # Mark user messages as read
        cursor.execute("""
            UPDATE support_messages 
            SET is_read = TRUE 
            WHERE user_id = %s AND sender_type = 'user' AND is_read = FALSE
        """, (user_id,))
        db.commit()
        
        return AdminChatHistoryResponse(
            user=user_info,
            messages=messages,
            total=len(messages)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/admin/support/reply")
def admin_send_reply(
    request: AdminReplyRequest,
    current_admin: dict = Depends(get_current_admin),
    db=Depends(get_db)
):
    """Admin sends reply to user"""
    cursor = db.cursor()
    
    try:
        admin_id = current_admin["id"]
        
        # Verify user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (request.user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Insert message
        cursor.execute("""
            INSERT INTO support_messages (user_id, message, sender_type, admin_id, is_read)
            VALUES (%s, %s, 'admin', %s, FALSE)
            RETURNING id, TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') as created_at
        """, (request.user_id, request.message.strip(), admin_id))
        
        result = cursor.fetchone()
        db.commit()
        
        return {
            "success": True,
            "message": "Reply sent to user",
            "data": {
                "id": result['id'],
                "created_at": result['created_at']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.put("/admin/support/mark-read/{user_id}")
def mark_user_messages_read(
    user_id: int,
    current_admin: dict = Depends(get_current_admin),
    db=Depends(get_db)
):
    """Mark all messages from user as read"""
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            UPDATE support_messages 
            SET is_read = TRUE 
            WHERE user_id = %s AND sender_type = 'user' AND is_read = FALSE
        """, (user_id,))
        
        updated_count = cursor.rowcount
        db.commit()
        
        return {
            "success": True,
            "message": f"Marked {updated_count} messages as read"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.get("/admin/support/stats", response_model=SupportStatsResponse)
def get_support_stats(current_admin: dict = Depends(get_current_admin), db=Depends(get_db)):
    """Get support statistics"""
    cursor = db.cursor()
    
    try:
        # Total conversations
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) as total FROM support_messages
        """)
        total_conversations = cursor.fetchone()['total']
        
        # Unread conversations
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) as total
            FROM support_messages 
            WHERE sender_type = 'user' AND is_read = FALSE
        """)
        unread_conversations = cursor.fetchone()['total']
        
        # Total messages
        cursor.execute("SELECT COUNT(*) as total FROM support_messages")
        total_messages = cursor.fetchone()['total']
        
        # Messages today
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM support_messages 
            WHERE DATE(created_at) = CURRENT_DATE
        """)
        messages_today = cursor.fetchone()['total']
        
        return SupportStatsResponse(
            total_conversations=total_conversations,
            unread_conversations=unread_conversations,
            total_messages=total_messages,
            messages_today=messages_today
        )
        
    finally:
        cursor.close()
