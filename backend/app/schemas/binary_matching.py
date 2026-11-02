"""
Binary Matching Bonus Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

# ==================== TIER SCHEMAS ====================

class MatchingTier(BaseModel):
    level: int
    required_match: Decimal
    bonus_amount: Decimal
    is_active: bool
    is_claimed: bool = False
    claimed_at: Optional[str] = None
    progress_percentage: float = 0.0
    prize_type: Optional[str] = None
    prize_name: Optional[str] = None
    prize_description: Optional[str] = None
    prize_image_url: Optional[str] = None
    prize_claimed: bool = False
    prize_claim_date: Optional[str] = None

class MatchingTiersResponse(BaseModel):
    success: bool
    tiers: List[MatchingTier]
    current_matched: Decimal
    next_tier_level: Optional[int]
    next_tier_bonus: Optional[Decimal]

# ==================== TREE SCHEMAS ====================

class BinaryTreeNode(BaseModel):
    user_id: int
    username: str
    name: str
    position: Optional[str]
    left_business: Decimal
    right_business: Decimal
    total_team: int
    profile_photo_url: Optional[str]
    is_active: bool

class BinaryTreeResponse(BaseModel):
    success: bool
    user: BinaryTreeNode
    left_child: Optional[BinaryTreeNode]
    right_child: Optional[BinaryTreeNode]
    left_business: Decimal
    right_business: Decimal
    matched_amount: Decimal
    pending_left: Decimal
    pending_right: Decimal

# ==================== MATCHING HISTORY SCHEMAS ====================

class MatchingHistoryItem(BaseModel):
    id: int
    matched_amount: Decimal
    left_volume: Decimal
    right_volume: Decimal
    bonus_earned: Decimal
    level_achieved: Optional[int]
    tier_name: Optional[str]
    carry_forward_left: Decimal
    carry_forward_right: Decimal
    created_at: str

class MatchingHistoryResponse(BaseModel):
    success: bool
    history: List[MatchingHistoryItem]
    total: int
    page: int
    per_page: int
    total_pages: int

# ==================== DETAILED MATCH HISTORY SCHEMAS ====================

class MatchContributor(BaseModel):
    user_id: int
    username: str
    name: str
    package_name: str
    amount: Decimal
    invested_at: str
    profile_photo_url: Optional[str]

class MatchingHistoryDetail(BaseModel):
    success: bool
    history_id: int
    your_income: Decimal
    matched_amount: Decimal
    left_total: Decimal
    right_total: Decimal
    left_contributors: List[MatchContributor]
    right_contributors: List[MatchContributor]
    tier_achieved: Optional[int]
    tier_name: Optional[str]
    bonus_rate: float
    status: str
    created_at: str
    before_match_left: Decimal
    before_match_right: Decimal
    after_match_left: Decimal
    after_match_right: Decimal

# ==================== STATISTICS SCHEMAS ====================

class BinaryStatistics(BaseModel):
    total_left_business: Decimal
    total_right_business: Decimal
    total_matched: Decimal
    pending_left: Decimal
    pending_right: Decimal
    matching_bonus_earned: Decimal
    total_left_team: int
    total_right_team: int
    active_left_team: int
    active_right_team: int
    last_matched_at: Optional[str]

class BinaryDashboardResponse(BaseModel):
    success: bool
    statistics: BinaryStatistics
    available_tiers: List[MatchingTier]
    recent_matches: List[MatchingHistoryItem]
    next_milestone: Optional[dict]

# ==================== REFERRAL LINK SCHEMAS ====================

class ReferralLinksResponse(BaseModel):
    success: bool
    username: str
    left_link: str
    right_link: str
    left_qr_code: Optional[str]
    right_qr_code: Optional[str]

# ==================== TEAM VOLUME SCHEMAS ====================

class TeamVolumeResponse(BaseModel):
    success: bool
    user_id: int
    username: str
    left_business: Decimal
    right_business: Decimal
    left_team_count: int
    right_team_count: int
    total_business: Decimal

# ==================== PLACEMENT SCHEMAS ====================

class PlacementRequest(BaseModel):
    sponsor_username: str
    position: str = Field(..., pattern='^(left|right)$')

class PlacementResponse(BaseModel):
    success: bool
    message: str
    sponsor_id: int
    sponsor_username: str
    position: str
    placement_user_id: int
    placement_username: str
