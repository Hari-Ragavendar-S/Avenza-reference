from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

# ==================== LEVEL INCOME SCHEMAS ====================

class LevelIncomeStats(BaseModel):
    today_total: Decimal
    week_total: Decimal
    month_total: Decimal
    all_time_total: Decimal
    total_team_members: int
    active_today: int

class LevelBreakdown(BaseModel):
    level: int
    percentage: Decimal
    member_count: int
    today_earned: Decimal

class LevelIncomeTransaction(BaseModel):
    id: int
    from_username: str
    from_user_id: int
    level: int
    percentage: Decimal
    roi_amount: Decimal
    income_amount: Decimal
    created_at: str

class TeamMemberEarning(BaseModel):
    user_id: int
    username: str
    name: Optional[str]
    level: int
    roi_received: Decimal
    your_earning: Decimal
    earned_at: str

class LevelIncomeStatsResponse(BaseModel):
    success: bool
    stats: LevelIncomeStats
    level_breakdown: List[LevelBreakdown]
    today_team_performance: List[TeamMemberEarning]

class LevelIncomeHistoryResponse(BaseModel):
    success: bool
    transactions: List[LevelIncomeTransaction]
    total: int
    page: int
    per_page: int
    total_pages: int

# Team tree structure
class TeamMember(BaseModel):
    user_id: int
    username: str
    name: Optional[str]
    level: int
    direct_referrals: int
    total_team: int
    today_earned_from_them: Decimal

class TeamTreeResponse(BaseModel):
    success: bool
    team_members: List[TeamMember]
    total_members: int

# ==================== ADMIN SCHEMAS ====================

class AdminLevelIncomeStats(BaseModel):
    today_total: Decimal
    today_recipients: int
    month_total: Decimal
    all_time_total: Decimal
    total_transactions: int

class AdminLevelTransaction(BaseModel):
    id: int
    recipient_username: str
    recipient_id: int
    from_username: str
    from_user_id: int
    level: int
    percentage: Decimal
    roi_amount: Decimal
    income_amount: Decimal
    created_at: str

class TopEarner(BaseModel):
    rank: int
    username: str
    user_id: int
    team_size: int
    earned_today: Decimal

class AdminLevelIncomeResponse(BaseModel):
    success: bool
    stats: AdminLevelIncomeStats
    transactions: List[AdminLevelTransaction]
    top_earners: List[TopEarner]
    level_breakdown: List[LevelBreakdown]
    total: int
    page: int
    per_page: int
    total_pages: int
