from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

# ==================== WALLET BALANCE ====================

class WalletBalanceResponse(BaseModel):
    avenza_balance: Decimal
    income_balance: Decimal
    gaming_balance: Decimal
    total_balance: Decimal

# ==================== DEPOSIT SCHEMAS ====================

class DepositRequest(BaseModel):
    amount: float
    currency: str = 'USDT'
    network: str = 'BEP20'
    transaction_hash: str
    from_address: str
    block_number: Optional[int] = None

class DepositResponse(BaseModel):
    success: bool
    message: str
    deposit_id: int
    transaction_hash: str
    amount: float
    status: str
    new_balance: Decimal
    timestamp: str

class DepositHistoryResponse(BaseModel):
    success: bool
    deposits: list
    total: int
    page: int
    per_page: int
    total_pages: int

class PaginatedDepositsResponse(BaseModel):
    success: bool
    deposits: list
    total: int
    page: int
    per_page: int
    total_pages: int
    stats: dict

# ==================== WITHDRAWAL SCHEMAS ====================

class WithdrawalRequest(BaseModel):
    amount: Decimal
    currency: str = 'USDT'
    to_address: str
    wallet_type: str = 'avenza'
    destination_wallet_type: str = 'metamask'

class WithdrawalResponse(BaseModel):
    success: bool
    message: str
    withdrawal_id: int
    transaction_hash: Optional[str] = None
    amount: Decimal
    fee: Decimal
    net_amount: Decimal
    status: str
    new_balance: Decimal
    timestamp: str

class WithdrawalHistoryResponse(BaseModel):
    success: bool
    withdrawals: list
    total: int
    page: int
    per_page: int
    total_pages: int

class WithdrawalSettingsUpdate(BaseModel):
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    daily_limit_count: Optional[int] = None
    fee_percentage: Optional[float] = None

class WithdrawalSettingsResponse(BaseModel):
    success: bool
    message: str
    min_amount: float
    max_amount: float
    daily_limit_count: int
    fee_percentage: float
    updated_at: str

class PaginatedWithdrawalsResponse(BaseModel):
    success: bool
    withdrawals: list
    total: int
    page: int
    per_page: int
    total_pages: int
    stats: dict

# ==================== ADMIN SETTINGS SCHEMAS ====================

class AdminSettingUpdate(BaseModel):
    setting_value: str

class AdminSettingResponse(BaseModel):
    success: bool
    message: str
    setting_key: str
    setting_value: str
    updated_at: str
