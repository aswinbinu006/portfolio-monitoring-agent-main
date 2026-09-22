"""
Domain Entities and Data Classes for Investment Portfolio Management.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime
import pandas as pd


@dataclass
class Holding:
    """Represents a single position in an investment portfolio."""
    ticker: str
    quantity: float
    target_weight: Optional[float] = None
    purchase_price: Optional[float] = None
    sector: Optional[str] = None
    current_price: Optional[float] = None


@dataclass
class PortfolioSummary:
    """High-level valuation and risk summary of an active portfolio."""
    total_value: float
    total_positions: int
    unrealized_pnl: float
    unrealized_pnl_pct: float
    health_score: int
    as_of: datetime = field(default_factory=datetime.utcnow)
