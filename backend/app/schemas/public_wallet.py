"""
Schemas for Public Wallet System
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime

# ==================== PUBLIC WALLET CONFIG ====================

class PublicWalletConfigCreate(BaseModel):
    """Schema for creating/updating public wallet configuration"""
    wallet_address: str
    secret_phrase: str
    network: str = 'BSC'
    
    @field_validator('wallet_address')
    @classmethod
    def validate_wallet_address(cls, v):
        if not v or len(v) < 26:
            raise ValueError('Invalid wallet address')
        if not v.startswith('0x'):
            raise ValueError('Wallet address must start with 0x')
        return v.lower()
    
    @field_validator('secret_phrase')
    @classmethod
    def validate_secret_phrase(cls, v):
        words = v.strip().split()
        if len(words) != 12:
            raise ValueError('Secret phrase must be exactly 12 words')
        return v.strip()

class PublicWalletConfigResponse(BaseModel):
    """Schema for public wallet configuration response"""
    success: bool
    message: str
    wallet_address: str
    network: str
    updated_at: str

class PublicWalletAddressResponse(BaseModel):
    """Public endpoint response - only shows address"""
    success: bool
    wallet_address: str
    network: str
    supported_networks: list[str]

# ==================== WEBSITE DEPOSIT ====================

class WebsiteDepositCreate(BaseModel):
    """Schema for website deposit submission"""
    name: str
    phone: str
    wallet_address: str
    amount: Decimal
    network: str
    token_type: str = 'USDT'
    amount_bep20_equivalent: Decimal
    transaction_hash: str
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Valid phone number required')
        return v.strip()
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class WebsiteDepositResponse(BaseModel):
    """Schema for website deposit response"""
    success: bool
    message: str
    deposit_id: int
    transaction_hash: str
    name: str
    phone: str
    amount_bep20: Decimal
    distributed_to_count: int
    per_user_amount: Decimal

# ==================== TRANSACTION LISTS ====================

class WebsiteDepositItem(BaseModel):
    """Individual website deposit item"""
    id: int
    name: str
    phone: str
    wallet_address: str
    amount_bep20_equivalent: Decimal
    transaction_hash: str
    wallet_status: str
    is_distributed: bool
    distributed_to_count: int
    deposited_at: str

class ExternalDepositItem(BaseModel):
    """Individual external deposit item"""
    id: int
    sender_address: str
    amount_bep20_equivalent: Decimal
    transaction_hash: str
    network: str
    token_type: str
    is_distributed: bool
    distributed_to_count: int
    detected_at: str

class WebsiteDepositsResponse(BaseModel):
    """Paginated website deposits response"""
    success: bool
    deposits: list[WebsiteDepositItem]
    total: int
    page: int
    per_page: int
    total_pages: int

class ExternalDepositsResponse(BaseModel):
    """Paginated external deposits response"""
    success: bool
    deposits: list[ExternalDepositItem]
    total: int
    page: int
    per_page: int
    total_pages: int

# ==================== DISTRIBUTION DETAILS ====================

class DistributionRecipient(BaseModel):
    """Individual distribution recipient"""
    id: int
    user_name: str
    user_email: str
    user_phone: Optional[str]
    credited_amount: Decimal
    status: str
    credited_at: str

class DistributionDetailResponse(BaseModel):
    """Distribution detail response"""
    success: bool
    source_type: str
    transaction_hash: str
    total_amount: Decimal
    recipients_count: int
    recipients: list[DistributionRecipient]

# ==================== PUBLIC STATS ====================

class PublicStatsResponse(BaseModel):
    """Public stats for homepage"""
    success: bool
    total_deposits_count: int
    total_website_deposits: int
    total_external_deposits: int
    total_amount_received: Decimal
    total_distributed: Decimal
    total_participants: int
    last_deposit_at: Optional[str]

# ==================== USER DISTRIBUTION HISTORY ====================

class UserDistributionItem(BaseModel):
    """User's distribution earning item"""
    id: int
    source_type: str
    transaction_hash: str
    credited_amount: Decimal
    status: str
    credited_at: str

class UserDistributionHistoryResponse(BaseModel):
    """User's distribution history response"""
    success: bool
    distributions: list[UserDistributionItem]
    total_earned: Decimal
    total_count: int
    page: int
    per_page: int
    total_pages: int
