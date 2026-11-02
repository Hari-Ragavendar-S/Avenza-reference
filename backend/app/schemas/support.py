"""
Support Chat Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# User Schemas
class SendMessageRequest(BaseModel):
    """User sends message to admin"""
    message: str = Field(..., min_length=1, max_length=500)

class SupportMessage(BaseModel):
    """Support message model"""
    id: int
    user_id: int
    message: str
    sender_type: str  # 'user' or 'admin'
    admin_id: Optional[int] = None
    is_read: bool
    created_at: str
    is_mine: bool  # True if message is from current user/admin

class ChatHistoryResponse(BaseModel):
    """Chat history response"""
    messages: list[SupportMessage]
    total: int

class UnreadCountResponse(BaseModel):
    """Unread message count"""
    unread_count: int

# Admin Schemas
class AdminReplyRequest(BaseModel):
    """Admin sends reply to user"""
    user_id: int = Field(..., gt=0)
    message: str = Field(..., min_length=1, max_length=500)

class UserConversation(BaseModel):
    """User conversation summary for admin"""
    user_id: int
    username: str
    name: str
    email: str
    profile_photo_url: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[str] = None
    unread_count: int
    total_messages: int

class ConversationsListResponse(BaseModel):
    """List of user conversations"""
    conversations: list[UserConversation]
    total: int
    page: int
    per_page: int
    total_pages: int

class AdminChatHistoryResponse(BaseModel):
    """Chat history for admin"""
    user: dict  # User info
    messages: list[SupportMessage]
    total: int

class SupportStatsResponse(BaseModel):
    """Support statistics for admin"""
    total_conversations: int
    unread_conversations: int
    total_messages: int
    messages_today: int
