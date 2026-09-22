"""
Portfolio Service: Comprehensive Portfolio Intelligence Engine.
Computes Portfolio Health Score (0-100), Risk Meter, Diversification Indices,
Sector exposures, and Watchlist tracking.
"""
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import pandas as pd
from datetime import datetime

from backend.server.schemas.common import (
    HoldingItem,
    PortfolioHealthScore,
    RiskMeter,
    DiversificationAnalysis,
    WatchlistItem,
    MarketStatus,
)
from backend.core.portfolio import Portfolio, Holding

SECTOR_MAP: Dict[str, str] = {
    "RELIANCE.NS": "Energy & Conglomerate",
    "TCS.NS": "Information Technology",
    "INFY.NS": "Information Technology",
    "HDFCBANK.NS": "Financial Services",
    "ICICIBANK.NS": "Financial Services",
    "SBIN.NS": "Financial Services",
    "ITC.NS": "Consumer Staples",
    "HINDUNILVR.NS": "Consumer Staples",
    "BHARTIARTL.NS": "Telecommunications",
    "LT.NS": "Industrial Infrastructure",
    "KOTAKBANK.NS": "Financial Services",
    "AXISBANK.NS": "Financial Services",
    "TATAMOTORS.NS": "Automotive",
    "MARUTI.NS": "Automotive",
    "SUNPHARMA.NS": "Healthcare & Pharma",
    "CIPLA.NS": "Healthcare & Pharma",
    "TATASTEEL.NS": "Metals & Mining",
    "WIPRO.NS": "Information Technology",
    "NTPC.NS": "Power & Utilities",
    "POWERGRID.NS": "Power & Utilities",
    "AAPL": "Information Technology",
    "MSFT": "Information Technology",
    "GOOGL": "Communication Services",
    "AMZN": "Consumer Discretionary",
    "NVDA": "Semiconductors",
    "META": "Communication Services",
    "TSLA": "Automotive & Clean Tech",
    "JPM": "Financial Services",
    "V": "Financial Services",
    "JNJ": "Healthcare",
}


def get_sector_for_ticker(ticker: str) -> str:
    ticker_clean = ticker.strip().upper()
    if ticker_clean in SECTOR_MAP:
        return SECTOR_MAP[ticker_clean]
    
    if ticker_clean.endswith(".NS") or ticker_clean.endswith(".BO"):
        if any(k in ticker_clean for k in ("BANK", "FIN", "CAP")):
            return "Financial Services"
        if any(k in ticker_clean for k in ("TECH", "SOFT", "INF")):
            return "Information Technology"
        if any(k in ticker_clean for k in ("PHARMA", "LAB", "HEALTH")):
            return "Healthcare"
        if any(k in ticker_clean for k in ("AUTO", "MOTOR")):
            return "Automotive"
        if any(k in ticker_clean for k in ("STEEL", "METAL", "MIN")):
            return "Metals & Mining"
        if any(k in ticker_clean for k in ("POWER", "ENERGY", "OIL")):
            return "Energy & Utilities"
    return "Diversified Equities"


class PortfolioService:
    def __init__(self):
        self._watchlist: Dict[str, WatchlistItem] = {}
        self._init_default_watchlist()

    def _init_default_watchlist(self):
        defaults = [
            ("RELIANCE.NS", "Reliance Industries Ltd", 2950.0, 15.4, 0.52),
            ("TCS.NS", "Tata Consultancy Services", 4210.0, -18.2, -0.43),
            ("HDFCBANK.NS", "HDFC Bank Limited", 1680.0, 8.5, 0.51),
            ("INFY.NS", "Infosys Limited", 1890.0, 22.0, 1.18),
            ("ITC.NS", "ITC Limited", 495.0, -2.1, -0.42),
            ("AAPL", "Apple Inc.", 228.0, 3.2, 1.42),
            ("MSFT", "Microsoft Corporation", 448.0, 4.8, 1.08),
        ]
        for sym, name, prc, chg, chg_pct in defaults:
            self._watchlist[sym] = WatchlistItem(
                symbol=sym,
                name=name,
                current_price=prc,
                change_value=chg,
                change_pct=chg_pct,
                day_high=round(prc * 1.015, 2),
                day_low=round(prc * 0.985, 2),
                volume=1250000,
                pe_ratio=26.4,
                market_cap=prc * 100000000,
                added_at=datetime.utcnow(),
            )

    def calculate_health_score(
        self,
        weights: Dict[str, float],
        volatility: Optional[float] = None,
        sharpe_ratio: Optional[float] = None,
        max_drawdown: Optional[float] = None,
    ) -> PortfolioHealthScore:
        n_assets = len(weights)
        if n_assets == 0:
            return PortfolioHealthScore(
                score=0,
                grade="F",
                rating="Empty Portfolio",
                diversification_score=0.0,
                volatility_score=0.0,
                drawdown_score=0.0,
                concentration_score=0.0,
                key_strengths=[],
                key_vulnerabilities=["Portfolio contains no holdings"],
            )

        w_values = np.array(list(weights.values()))
        if w_values.sum() > 0:
            w_values = w_values / w_values.sum()

        hhi = float(np.sum(w_values ** 2))
        effective_n = 1.0 / hhi if hhi > 0 else 1.0
        div_score = min(100.0, (effective_n / 10.0) * 100.0)

        ann_vol = volatility if (volatility is not None and not np.isnan(volatility)) else 0.18
        if ann_vol <= 0.12:
            vol_score = 100.0
        elif ann_vol >= 0.40:
            vol_score = 30.0
        else:
            vol_score = 100.0 - ((ann_vol - 0.12) / (0.40 - 0.12)) * 70.0

        mdd = abs(max_drawdown) if (max_drawdown is not None and not np.isnan(max_drawdown)) else 0.12
        if mdd <= 0.08:
            dd_score = 100.0
        elif mdd >= 0.35:
            dd_score = 30.0
        else:
            dd_score = 100.0 - ((mdd - 0.08) / (0.35 - 0.08)) * 70.0

        max_w = float(np.max(w_values))
        if max_w <= 0.20:
            conc_score = 100.0
        elif max_w >= 0.50:
            conc_score = 25.0
        else:
            conc_score = 100.0 - ((max_w - 0.20) / (0.50 - 0.20)) * 75.0

        composite = (0.30 * div_score) + (0.25 * vol_score) + (0.25 * dd_score) + (0.20 * conc_score)
        final_score = int(round(np.clip(composite, 0, 100)))

        if final_score >= 90:
            grade, rating = "A+", "Institutional Quality"
        elif final_score >= 80:
            grade, rating = "A", "Strong & Resilient"
        elif final_score >= 70:
            grade, rating = "B", "Well-Balanced"
        elif final_score >= 60:
            grade, rating = "C", "Moderate Risk Exposure"
        elif final_score >= 50:
            grade, rating = "D", "Elevated Risk Concentration"
        else:
            grade, rating = "F", "Vulnerable Structure"

        strengths = []
        vulnerabilities = []

        if div_score >= 80:
            strengths.append(f"High diversification across {n_assets} active assets (Effective N: {effective_n:.1f})")
        else:
            vulnerabilities.append("Low effective asset count increases idiosyncratic risk")

        if max_w <= 0.25:
            strengths.append(f"Well-controlled single-asset allocation (Largest position: {max_w:.1%})")
        else:
            vulnerabilities.append(f"Heavy single-stock exposure: {max_w:.1%} in largest asset")

        if vol_score >= 80:
            strengths.append(f"Stable risk profile with contained annualized volatility ({ann_vol:.1%})")
        else:
            vulnerabilities.append(f"Elevated annualized volatility ({ann_vol:.1%}) requires downside protection")

        return PortfolioHealthScore(
            score=final_score,
            grade=grade,
            rating=rating,
            diversification_score=round(div_score, 1),
            volatility_score=round(vol_score, 1),
            drawdown_score=round(dd_score, 1),
            concentration_score=round(conc_score, 1),
            key_strengths=strengths,
            key_vulnerabilities=vulnerabilities,
        )

    def calculate_risk_meter(
        self,
        volatility: Optional[float],
        max_drawdown: Optional[float],
        var_95: Optional[float]
    ) -> RiskMeter:
        vol = volatility if (volatility is not None and not np.isnan(volatility)) else 0.18
        mdd = abs(max_drawdown) if (max_drawdown is not None and not np.isnan(max_drawdown)) else 0.15
        risk_score = min(100.0, (vol / 0.35) * 50.0 + (mdd / 0.30) * 50.0)
        
        if risk_score <= 40.0:
            level = "Low"
            factor = "Defensive asset stability"
        elif risk_score <= 70.0:
            level = "Moderate"
            factor = "Balanced market exposure with typical equity volatility"
        else:
            level = "High"
            factor = "High downside variance and pronounced drawdown exposure"

        return RiskMeter(
            level=level,
            score=round(risk_score, 1),
            primary_factor=factor
        )

    def calculate_diversification(
        self,
        holdings: List[HoldingItem],
        weights: Dict[str, float]
    ) -> DiversificationAnalysis:
        total_w = sum(weights.values()) or 1.0
        norm_weights = {k: v / total_w for k, v in weights.items()}
        sorted_weights = sorted(norm_weights.items(), key=lambda x: x[1], reverse=True)

        w_array = np.array(list(norm_weights.values()))
        hhi = float(np.sum(w_array ** 2))
        effective_n = 1.0 / hhi if hhi > 0 else 1.0

        top_1 = sorted_weights[0][1] if sorted_weights else 0.0
        top_3 = sum(w for _, w in sorted_weights[:3]) if len(sorted_weights) >= 3 else 1.0

        sector_totals: Dict[str, float] = {}
        for h in holdings:
            sec = h.sector or get_sector_for_ticker(h.symbol)
            w = norm_weights.get(h.symbol, 0.0)
            sector_totals[sec] = sector_totals.get(sec, 0.0) + w

        warnings = []
        if top_1 > 0.35:
            top_ticker = sorted_weights[0][0]
            warnings.append(f"Concentration Risk: '{top_ticker}' exceeds 35% of total portfolio value ({top_1:.1%})")
        if top_3 > 0.70:
            warnings.append(f"Top 3 assets comprise {top_3:.1%} of portfolio, exceeding the 70% threshold")
        
        for sec, alloc in sector_totals.items():
            if alloc > 0.45:
                warnings.append(f"Sector Overweight: '{sec}' represents {alloc:.1%} of portfolio (exceeds 45% threshold)")

        return DiversificationAnalysis(
            herfindahl_index=round(hhi, 4),
            effective_n_stocks=round(effective_n, 1),
            top_holding_concentration=round(top_1, 4),
            top_3_concentration=round(top_3, 4),
            sector_breakdown={k: round(v, 4) for k, v in sorted(sector_totals.items(), key=lambda x: x[1], reverse=True)},
            warnings=warnings,
        )

    def get_watchlist(self) -> List[WatchlistItem]:
        return list(self._watchlist.values())

    def add_to_watchlist(self, symbol: str, name: Optional[str] = None) -> WatchlistItem:
        sym_clean = symbol.strip().upper()
        if sym_clean in self._watchlist:
            return self._watchlist[sym_clean]

        item = WatchlistItem(
            symbol=sym_clean,
            name=name or sym_clean,
            current_price=2450.0 if sym_clean.endswith(".NS") else 175.0,
            change_value=12.5,
            change_pct=0.51,
            day_high=2480.0 if sym_clean.endswith(".NS") else 178.0,
            day_low=2430.0 if sym_clean.endswith(".NS") else 173.0,
            volume=850000,
            pe_ratio=24.5,
            market_cap=5000000000,
            added_at=datetime.utcnow(),
        )
        self._watchlist[sym_clean] = item
        return item

    def remove_from_watchlist(self, symbol: str) -> bool:
        sym_clean = symbol.strip().upper()
        if sym_clean in self._watchlist:
            del self._watchlist[sym_clean]
            return True
        return False


portfolio_service = PortfolioService()
