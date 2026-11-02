from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

# ==================== REFERRAL BONUS SCHEMAS ====================

class ReferralBonusStats(BaseModel):
    total_unclaimed: Decimal
    unclaimed_count: int
    total_claimed: Decimal
    claimed_count: int
    direct_referrals: int
    current_rate: Decimal
    next_referral_rate: Optional[Decimal]

class ReferralRateProgress(BaseModel):
    referral_number: int
    percentage: Decimal
    is_unlocked: bool
    description: str

class PendingBonus(BaseModel):
    id: int
    referral_id: int
    referral_username: str
    referral_name: Optional[str]
    referral_number: int
    investment_amount: Decimal
    bonus_percentage: Decimal
    bonus_amount: Decimal
    created_at: str

class ClaimedBonus(BaseModel):
    id: int
    referral_username: str
    investment_amount: Decimal
    bonus_amount: Decimal
    bonus_percentage: Decimal
    claimed_at: str

class ReferralBonusOverviewResponse(BaseModel):
    success: bool
    stats: ReferralBonusStats
    rate_progress: List[ReferralRateProgress]
    pending_bonuses: List[PendingBonus]
    claimed_bonuses: List[ClaimedBonus]

class ClaimBonusRequest(BaseModel):
    bonus_id: int

class ClaimBonusResponse(BaseModel):
    success: bool
    message: str
    bonus_id: int
    amount: Decimal
    referral_username: str
    new_income_balance: Decimal
    claimed_at: str

# ==================== ADMIN SCHEMAS ====================

class AdminReferralBonusStats(BaseModel):
    total_unclaimed: Decimal
    unclaimed_count: int
    total_claimed: Decimal
    claimed_count: int
    total_paid_all_time: Decimal

class AdminBonusTransaction(BaseModel):
    id: int
    referrer_username: str
    referrer_id: int
    referral_username: str
    referral_id: int
    referral_number: int
    investment_amount: Decimal
    bonus_percentage: Decimal
    bonus_amount: Decimal
    status: str
    claimed_at: Optional[str]
    created_at: str

class TopReferrer(BaseModel):
    rank: int
    username: str
    user_id: int
    direct_referrals: int
    total_bonus: Decimal
    current_rate: Decimal

class RateDistribution(BaseModel):
    rate: Decimal
    referral_number: int
    bonus_count: int
    total_amount: Decimal

class AdminReferralBonusResponse(BaseModel):
    success: bool
    stats: AdminReferralBonusStats
    transactions: List[AdminBonusTransaction]
    top_referrers: List[TopReferrer]
    rate_distribution: List[RateDistribution]
    total: int
    page: int
    per_page: int
    total_pages: int
