from pydantic import BaseModel, Field, validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

# ==================== PROFILE SCHEMAS ====================

class ProfileResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    mobile: str
    profile_photo_url: Optional[str]
    wallet_pin_set: bool
    avenza_balance: Decimal
    income_balance: Decimal
    gaming_balance: Decimal
    wallet_address: Optional[str] = None
    wallet_type: Optional[str] = None
    is_active: bool = True

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    profile_photo_url: Optional[str] = None

class SetWalletPinRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4)
    
    @validator('pin')
    def validate_pin(cls, v):
        if not v.isdigit():
            raise ValueError('PIN must be 4 digits')
        return v

class ChangeWalletPinRequest(BaseModel):
    old_pin: str = Field(..., min_length=4, max_length=4)
    new_pin: str = Field(..., min_length=4, max_length=4)
    
    @validator('old_pin', 'new_pin')
    def validate_pins(cls, v):
        if not v.isdigit():
            raise ValueError('PIN must be 4 digits')
        return v

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

# ==================== TRANSFER SCHEMAS ====================

class UserSearchResult(BaseModel):
    id: int
    username: str
    name: str
    mobile: str
    profile_photo_url: Optional[str]

class TransferRequest(BaseModel):
    receiver_id: int
    amount: Decimal = Field(..., gt=0)
    wallet_pin: str = Field(..., min_length=4, max_length=4)
    description: Optional[str] = None
    
    @validator('wallet_pin')
    def validate_pin(cls, v):
        if not v.isdigit():
            raise ValueError('PIN must be 4 digits')
        return v
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < Decimal('1'):
            raise ValueError('Minimum transfer amount is $1')
        if v > Decimal('10000'):
            raise ValueError('Maximum transfer amount is $10,000')
        return v

class TransferResponse(BaseModel):
    success: bool
    message: str
    transfer_id: int
    sender_new_balance: Decimal
    receiver_username: str
    amount: Decimal
    timestamp: str

class TransferHistoryItem(BaseModel):
    id: int
    sender_id: int
    sender_username: str
    receiver_id: int
    receiver_username: str
    amount: Decimal
    currency: str
    status: str
    description: Optional[str]
    created_at: str
    is_sent: bool  # True if current user is sender

class ChatTransferHistory(BaseModel):
    success: bool
    user: UserSearchResult
    transfers: List[TransferHistoryItem]
    total: int

class RecentChatUser(BaseModel):
    id: int
    username: str
    name: str
    profile_photo_url: Optional[str]
    last_transfer_date: str
    last_amount: Decimal
    total_transfers: int

class InternalTransferListResponse(BaseModel):
    success: bool
    transfers: List[TransferHistoryItem]
    total: int
    page: int
    per_page: int
    total_pages: int

# ==================== TRANSACTION DETAIL SCHEMA ====================

class TransactionDetailResponse(BaseModel):
    id: int
    user_id: int
    type: str
    amount: Decimal
    currency: str
    description: str
    reference_id: Optional[int]
    reference_type: Optional[str]
    status: str
    wallet_type: str
    created_at: str
    # Additional details for P2P transfers
    other_party_username: Optional[str] = None
    other_party_name: Optional[str] = None
    other_party_photo: Optional[str] = None
