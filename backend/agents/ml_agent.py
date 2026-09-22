"""
ML Agent - Volatility Forecasting and Market Regime Estimation.
Uses simple statistical time-series forecasting to predict forward volatility trajectory
and inform the Risk and Writer agents of potential market regime shifts.
"""
import sys
from pathlib import Path
from typing import Dict, Any
import numpy as np
import pandas as pd

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.core.portfolio import Portfolio


class MLAgent:
    """
    Specialist agent for forward volatility forecasting and regime estimation.
    Provides anticipated volatility trends to the Risk and Writer agents.
    """

    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "MLAgent"
        self.description = "Forecasts 5-day forward realized volatility and regime shifts"

    def forecast_volatility(
        self,
        portfolio: Portfolio,
        forecast_horizon: int = 5
    ) -> Dict[str, Any]:
        """
        Estimate 5-day forward portfolio volatility using rolling realized variance.
        """
        try:
            val_series = portfolio.get_value_series()
            returns = val_series.pct_change().dropna()

            if len(returns) < 15:
                return {
                    "status": "insufficient_data",
                    "current_volatility": 0.15,
                    "forecast_volatility_5d": 0.15,
                    "regime": "NORMAL",
                    "trend": "STABLE",
                    "message": "Insufficient historical observations for robust ML projection."
                }

            # 20-day historical realized annualized volatility
            recent_vol = float(returns.tail(20).std() * np.sqrt(252))
            full_vol = float(returns.std() * np.sqrt(252))

            # Trend direction
            if recent_vol > full_vol * 1.15:
                trend = "ELEVATED"
                forecast_vol = recent_vol * 1.05
            elif recent_vol < full_vol * 0.85:
                trend = "SUBDUED"
                forecast_vol = recent_vol * 0.98
            else:
                trend = "STABLE"
                forecast_vol = recent_vol

            regime = "HIGH_VOLATILITY" if recent_vol > 0.22 else ("LOW_VOLATILITY" if recent_vol < 0.12 else "NORMAL")

            return {
                "status": "success",
                "current_volatility": round(recent_vol, 4),
                "forecast_volatility_5d": round(forecast_vol, 4),
                "historical_benchmark_vol": round(full_vol, 4),
                "trend": trend,
                "regime": regime,
                "forecast_horizon": forecast_horizon,
                "model": "Realized Rolling Volatility Estimator",
                "insights": [
                    f"Current realized volatility is {recent_vol:.1%} ({trend.lower()} relative to {full_vol:.1%} baseline).",
                    f"Projected 5-day forward annualized volatility: {forecast_vol:.1%}.",
                    f"Market regime classified as: {regime}."
                ]
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"ML volatility projection error: {str(e)}"
            }
