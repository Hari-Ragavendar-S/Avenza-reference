from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import date

# ==================== PACKAGE SCHEMAS ====================

class PackageResponse(BaseModel):
    id: int
    name: str
    amount: Decimal
    daily_profit_percentage: Decimal
    downline_matching_bonus: Decimal
    status: str
    
class PackageListResponse(BaseModel):
    success: bool
    packages: List[PackageResponse]

# ==================== INVESTMENT ENROLLMENT ====================

class InvestmentEnrollRequest(BaseModel):
    package_id: int

class InvestmentEnrollResponse(BaseModel):
    success: bool
    message: str
    investment_id: int
    package_name: str
    invested_amount: Decimal
    daily_profit: Decimal
    max_profit: Decimal
    timestamp: str

# ==================== USER INVESTMENT DETAILS ====================

class UserInvestmentDetail(BaseModel):
    id: int
    package_id: int
    package_name: str
    invested_amount: Decimal
    total_earned: Decimal
    daily_profit: Decimal
    max_profit: Decimal
    progress_percentage: float
    earned_today: Decimal
    enrollment_date: str
    last_profit_date: Optional[str]
    status: str

class MyPackagesResponse(BaseModel):
    success: bool
    investments: List[UserInvestmentDetail]
    total_invested: Decimal
    total_earned: Decimal

# ==================== INVESTMENT TRANSACTIONS ====================

class InvestmentTransaction(BaseModel):
    id: int
    amount: Decimal
    transaction_type: str
    wallet_type: str
    description: str
    created_at: str

class InvestmentTransactionsResponse(BaseModel):
    success: bool
    transactions: List[InvestmentTransaction]
    total: int
    page: int
    per_page: int
    total_pages: int

# ==================== ADMIN PACKAGE MANAGEMENT ====================

class AdminPackageDetail(BaseModel):
    id: int
    name: str
    amount: Decimal
    daily_profit_percentage: Decimal
    downline_matching_bonus: Decimal
    status: str
    total_users_enrolled: int
    total_investment_amount: Decimal
    created_at: str
    updated_at: str

class AdminPackageListResponse(BaseModel):
    success: bool
    packages: List[AdminPackageDetail]

class UpdatePackageRequest(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    daily_profit_percentage: Optional[Decimal] = None
    downline_matching_bonus: Optional[Decimal] = None
    status: Optional[str] = None

class UpdatePackageResponse(BaseModel):
    success: bool
    message: str
    package: AdminPackageDetail

class CreatePackageRequest(BaseModel):
    name: str
    amount: Decimal
    daily_profit_percentage: Decimal
    status: str = 'active'

class CreatePackageResponse(BaseModel):
    success: bool
    message: str
    package_id: int
