"""
Pydantic v2 schemas for Portfolio Monitoring API.
Strict validation, financial models, and structured API error envelopes.
"""
from typing import Dict, List, Optional, Any, Generic, TypeVar
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class APIErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error explanation")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Diagnostic details")


class APIResponse(BaseModel, Generic[T]):
    success: bool = Field(default=True, description="Request status")
    data: Optional[T] = Field(default=None, description="Payload data")
    error: Optional[APIErrorDetail] = Field(default=None, description="Error details if unsuccessful")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = Field(default=None, description="Trace request identifier")


class HoldingItem(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20, description="Asset ticker symbol")
    quantity: float = Field(..., gt=0, description="Holding quantity")
    current_price: Optional[float] = Field(default=None, ge=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    weight: float = Field(default=0.0, ge=0.0, le=1.0)
    target_weight: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    sector: Optional[str] = Field(default="Diversified")
    daily_change_pct: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    unrealized_pnl_pct: Optional[float] = None

    @field_validator("symbol")
    @classmethod
    def clean_symbol(cls, v: str) -> str:
        s = v.strip().upper()
        if not s:
            raise ValueError("Symbol cannot be empty")
        return s


class PortfolioUploadResponse(BaseModel):
    message: str
    holdings: List[HoldingItem] = Field(default_factory=list)
    total_holdings: int = Field(default=0, ge=0)
    total_value: Optional[float] = None
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)


class PortfolioHealthScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    grade: str
    rating: str
    diversification_score: float = Field(..., ge=0, le=100)
    volatility_score: float = Field(..., ge=0, le=100)
    drawdown_score: float = Field(..., ge=0, le=100)
    concentration_score: float = Field(..., ge=0, le=100)
    key_strengths: List[str] = Field(default_factory=list)
    key_vulnerabilities: List[str] = Field(default_factory=list)


class RiskMeter(BaseModel):
    level: str = Field(..., description="'Low', 'Moderate', or 'High'")
    score: float = Field(..., ge=0, le=100)
    primary_factor: str


class DiversificationAnalysis(BaseModel):
    herfindahl_index: float
    effective_n_stocks: float
    top_holding_concentration: float
    top_3_concentration: float
    sector_breakdown: Dict[str, float] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


class RiskMetricsSummary(BaseModel):
    annualized_return: Optional[float] = None
    annualized_volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    historical_var_95: Optional[float] = None
    historical_cvar_95: Optional[float] = None
    cornish_fisher_var_95: Optional[float] = None
    health_score: Optional[PortfolioHealthScore] = None
    risk_meter: Optional[RiskMeter] = None
    diversification: Optional[DiversificationAnalysis] = None


class AlertItem(BaseModel):
    id: str
    ticker: str
    severity: str = Field(..., description="'CRITICAL', 'WARNING', 'INFO'")
    category: str
    title: str
    description: str
    trigger_reason: str
    return_value: Optional[float] = None
    z_score: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    citations: List[Dict[str, Any]] = Field(default_factory=list)


class WatchlistItem(BaseModel):
    symbol: str
    name: Optional[str] = None
    current_price: float
    change_value: float
    change_pct: float
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    volume: Optional[int] = None
    pe_ratio: Optional[float] = None
    market_cap: Optional[float] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)


class MarketStatus(BaseModel):
    is_open: bool
    market_name: str
    local_time: str
    timezone: str
    next_event: str
    gainers_today: List[Dict[str, Any]] = Field(default_factory=list)
    losers_today: List[Dict[str, Any]] = Field(default_factory=list)


class MonitorRequest(BaseModel):
    mandate: str = Field(default="balanced")
    days: int = Field(default=90, ge=30, le=730)
    drawdown_tolerance: float = Field(default=-0.15, le=0.0, ge=-1.0)


class MonitorResponse(BaseModel):
    status: str
    message: Optional[str] = None
    portfolio_value: Optional[float] = None
    health_score: Optional[PortfolioHealthScore] = None
    risk_meter: Optional[RiskMeter] = None
    diversification: Optional[DiversificationAnalysis] = None
    risk_metrics: Optional[Dict[str, Any]] = None
    alerts: List[AlertItem] = Field(default_factory=list)
    briefing: Optional[str] = None
    forecast: Optional[Dict[str, Any]] = None
    trace: Optional[str] = None
    execution_time_ms: Optional[float] = None
