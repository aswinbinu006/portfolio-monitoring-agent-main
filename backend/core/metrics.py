"""
Core Portfolio Metrics for Agent Reasoning.
Provides foundational summary statistics (volatility, max drawdown, historical VaR)
used as direct numeric evidence by the multi-agent system.
"""
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
import pandas as pd
import numpy as np

TRADING_DAYS = 252


@dataclass
class PortfolioMetrics:
    """Core metrics container providing input evidence for Risk and Writer agents."""
    total_return: float
    annualized_volatility: float
    max_drawdown: float
    max_drawdown_date: Optional[pd.Timestamp]
    var_95: float  # Simple historical 95% Value at Risk
    current_value: float = 0.0
    current_weights: Optional[Dict[str, float]] = None
    # Optional placeholders for backward compatibility
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    cvar_95: Optional[float] = None
    hhi: Optional[float] = None
    effective_holdings: Optional[float] = None


def calculate_simple_returns(prices: pd.Series) -> pd.Series:
    """Calculate simple percentage returns from price series."""
    return prices.pct_change()


def calculate_portfolio_returns(prices: pd.DataFrame, quantities: Dict[str, float]) -> pd.Series:
    """Calculate portfolio value series and daily returns from asset prices and quantities."""
    values = (prices * pd.Series(quantities)).sum(axis=1)
    return values.pct_change()


def calculate_annualized_volatility(returns: pd.Series, trading_days: int = TRADING_DAYS) -> float:
    """Calculate annualized standard deviation of returns (ddof=1)."""
    clean = returns.dropna()
    if len(clean) < 2:
        return 0.0
    return float(clean.std(ddof=1) * np.sqrt(trading_days))


def calculate_max_drawdown(values: pd.Series) -> Tuple[float, Optional[pd.Timestamp]]:
    """Calculate peak-to-trough maximum drawdown and the date it occurred."""
    clean = values.dropna()
    if len(clean) < 2:
        return 0.0, None

    running_max = clean.cummax()
    drawdown = (clean - running_max) / running_max
    max_dd = float(drawdown.min())
    max_dd_date = drawdown.idxmin()
    return max_dd, max_dd_date


def calculate_var(returns: pd.Series, alpha: float = 0.05) -> float:
    """Calculate simple empirical historical Value at Risk at the alpha quantile."""
    clean = returns.dropna()
    if len(clean) < 5:
        return 0.0
    return float(clean.quantile(alpha))


def calculate_all_metrics(
    portfolio_returns: pd.Series,
    portfolio_values: pd.Series,
    current_weights: Dict[str, float],
    risk_free_rate: float = 0.06,
    benchmark_returns: Optional[pd.Series] = None
) -> PortfolioMetrics:
    """
    Compute essential risk metrics in a single pass to feed into the multi-agent pipeline.
    """
    clean_returns = portfolio_returns.dropna()
    total_return = float((portfolio_values.iloc[-1] / portfolio_values.iloc[0]) - 1) if len(portfolio_values) > 1 else 0.0
    ann_vol = calculate_annualized_volatility(clean_returns)
    max_dd, max_dd_date = calculate_max_drawdown(portfolio_values)
    var_95 = calculate_var(clean_returns, 0.05)

    return PortfolioMetrics(
        total_return=round(total_return, 4),
        annualized_volatility=round(ann_vol, 4),
        max_drawdown=round(max_dd, 4),
        max_drawdown_date=max_dd_date,
        var_95=round(var_95, 4),
        current_value=float(portfolio_values.iloc[-1]) if not portfolio_values.empty else 0.0,
        current_weights=current_weights,
    )
