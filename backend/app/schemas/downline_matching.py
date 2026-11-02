"""
Downline Matching Bonus Schemas
"""

from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

# ==================== HISTORY SCHEMAS ====================

class DownlineMatchingHistory(BaseModel):
    id: int
    downline_user_id: int
    downline_username: str
    match_amount: Decimal
    user_package_amount: Decimal
    bonus_percentage: Decimal
    calculated_bonus: Decimal
    user_received: Decimal
    admin_received: Decimal
    created_at: str

class DownlineMatchingHistoryResponse(BaseModel):
    success: bool
    history: List[DownlineMatchingHistory]
    total: int
    page: int
    per_page: int
    total_pages: int

# ==================== STATS SCHEMAS ====================

class DownlineMatchingStats(BaseModel):
    total_earned: Decimal
    total_matches: int
    total_sent_to_admin: Decimal
    lowest_package_amount: Optional[Decimal]
    bonus_percentage: Optional[Decimal]
    average_per_match: Decimal

class DownlineMatchingStatsResponse(BaseModel):
    success: bool
    stats: DownlineMatchingStats
    recent_matches: List[DownlineMatchingHistory]
