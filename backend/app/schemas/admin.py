from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class AdminWalletTopupRequest(BaseModel):
    amount: Decimal

class AdminWalletTopupResponse(BaseModel):
    success: bool
    message: str
    new_balance: Decimal
    transaction_id: int
    timestamp: str

class UserBalanceAdjustRequest(BaseModel):
    user_id: int
    wallet_type: str  # avenza, income, gaming
    action: str  # credit, debit
    amount: Decimal
    reason: str

class UserBalanceAdjustResponse(BaseModel):
    success: bool
    message: str
    user_new_balance: Decimal
    admin_new_balance: Decimal
    transaction_id: int
    timestamp: str

class AdminWalletBalanceResponse(BaseModel):
    admin_id: int
    admin_username: str
    wallet_balance: Decimal

class UserDetailResponse(BaseModel):
    id: int
    username: str
    email: str
    name: str
    mobile: str
    password: str
    referral_code: str
    sponsor_id: Optional[int]
    sponsor_username: Optional[str]
    position: Optional[str]
    wallet_pin_set: bool = False
    avenza_balance: Decimal
    income_balance: Decimal
    gaming_balance: Decimal
    status: str
    created_at: str
    last_login_1: Optional[str]
    last_login_2: Optional[str]
    last_login_3: Optional[str]

class UserListItem(BaseModel):
    id: int
    username: str
    email: str
    name: str
    mobile: str
    avenza_balance: Decimal
    income_balance: Decimal
    gaming_balance: Decimal
    status: str
    created_at: str
    referral_code: str

class AdminChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class AdminChangePasswordResponse(BaseModel):
    success: bool
    message: str

class WithdrawalModeRequest(BaseModel):
    mode: str  # 'automatic' or 'manual'

class WithdrawalModeResponse(BaseModel):
    success: bool
    message: str
    mode: str

class WithdrawalApproveRequest(BaseModel):
    admin_note: Optional[str] = None

class WithdrawalRejectRequest(BaseModel):
    reason: Optional[str] = None

class WithdrawalActionResponse(BaseModel):
    success: bool
    message: str
    withdrawal_id: int
    status: str
