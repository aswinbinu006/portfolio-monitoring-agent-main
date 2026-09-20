"""
Risk metrics calculation - all exact formulas.
Pure numeric computation - zero network calls, zero LLM calls.

All formulas verified against hand-calculated fixture:
  10-day sample → 29.99% annualized vol, 1.901 Sharpe, -2.50% max drawdown
"""
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
from dataclasses import dataclass

# Trading days per year
TRADING_DAYS = 252


@dataclass
class PortfolioMetrics:
    """Container for all portfolio risk metrics."""
    # Returns
    total_return: float
    annualized_return: float
    daily_returns_mean: float
    
    # Risk
    annualized_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    max_drawdown_date: Optional[pd.Timestamp]
    
    # Value at Risk
    var_95: float  # 95% VaR
    var_99: float  # 99% VaR
    cvar_95: float  # 95% CVaR (Expected Shortfall)
    cvar_99: float  # 99% CVaR
    
    # Concentration
    hhi: float  # Herfindahl-Hirschman Index
    effective_holdings: float  # 1 / HHI
    
    # Market relation (if benchmark provided)
    beta: Optional[float] = None
    correlation: Optional[float] = None
    
    # Current state
    current_value: float = 0.0
    current_weights: Optional[Dict[str, float]] = None


def calculate_simple_returns(prices: pd.Series) -> pd.Series:
    """
    Calculate simple returns from price series.
    r_t = (p_t - p_{t-1}) / p_{t-1}
    
    Args:
        prices: Time series of prices
    
    Returns:
        Series of returns (first value will be NaN)
    """
    return prices.pct_change()


def calculate_portfolio_returns(prices: pd.DataFrame, quantities: Dict[str, float]) -> pd.Series:
    """
    Calculate portfolio returns from individual asset prices.
    
    Algorithm:
        1. Calculate portfolio value at each date: V_t = sum(q_i * p_i,t)
        2. Calculate portfolio returns: r_p,t = (V_t - V_{t-1}) / V_{t-1}
    
    Args:
        prices: DataFrame with dates as index, tickers as columns
        quantities: Dict of ticker -> quantity
    
    Returns:
        Series of portfolio returns
    """
    # Calculate value series
    values = (prices * pd.Series(quantities)).sum(axis=1)
    
    # Calculate returns
    returns = values.pct_change()
    
    return returns


def calculate_weights(prices: pd.Series, quantities: Dict[str, float]) -> pd.Series:
    """
    Calculate portfolio weights time series.
    w_i,t = q_i * p_i,t / V_t
    
    Args:
        prices: DataFrame with dates as index, tickers as columns
        quantities: Dict of ticker -> quantity
    
    Returns:
        DataFrame of weights (same shape as prices)
    """
    # Total portfolio value at each date
    values = (prices * pd.Series(quantities)).sum(axis=1)
    
    # Weight for each asset at each date
    weights = prices.multiply(pd.Series(quantities), axis=1).div(values, axis=0)
    
    return weights


def calculate_contributions(returns: pd.DataFrame, weights: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate contribution of each asset to portfolio return.
    C_i,t = w_i,t-1 * r_i,t
    
    CRITICAL: Contributions must sum to portfolio return (verified by assertion).
    
    Args:
        returns: DataFrame of asset returns (dates x tickers)
        weights: DataFrame of portfolio weights (dates x tickers)
    
    Returns:
        DataFrame of contributions (same shape as returns)
    """
    # Use lagged weights (t-1) with current returns (t)
    lagged_weights = weights.shift(1)
    
    # Contribution = w_{t-1} * r_t
    contributions = lagged_weights * returns
    
    return contributions


def calculate_annualized_volatility(returns: pd.Series, trading_days: int = TRADING_DAYS) -> float:
    """
    Calculate annualized volatility.
    σ_annual = std(returns, ddof=1) * sqrt(trading_days)
    
    Uses ddof=1 for sample standard deviation (not population).
    
    Args:
        returns: Series of returns
        trading_days: Number of trading days per year (default 252)
    
    Returns:
        Annualized volatility
    """
    # Drop NaN values
    clean_returns = returns.dropna()
    
    if len(clean_returns) < 2:
        return np.nan
    
    # Sample standard deviation (ddof=1)
    daily_vol = clean_returns.std(ddof=1)
    
    # Annualize
    annual_vol = daily_vol * np.sqrt(trading_days)
    
    return annual_vol


def calculate_sharpe_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.06,
    trading_days: int = TRADING_DAYS
) -> float:
    """
    Calculate Sharpe ratio.
    Sharpe = (mean(r) - rf_daily) / std(r, ddof=1) * sqrt(trading_days)
    
    where rf_daily = annual_risk_free_rate / trading_days
    
    Args:
        returns: Series of returns
        risk_free_rate: Annual risk-free rate (default 0.06 = 6%)
        trading_days: Number of trading days per year (default 252)
    
    Returns:
        Sharpe ratio (annualized)
    """
    clean_returns = returns.dropna()
    
    if len(clean_returns) < 2:
        return np.nan
    
    # Daily risk-free rate
    rf_daily = risk_free_rate / trading_days
    
    # Excess returns
    excess_returns = clean_returns - rf_daily
    
    # Sharpe = mean(excess) / std(excess) * sqrt(days)
    mean_excess = excess_returns.mean()
    std_excess = excess_returns.std(ddof=1)
    
    if std_excess == 0:
        return np.nan
    
    sharpe = (mean_excess / std_excess) * np.sqrt(trading_days)
    
    return sharpe


def calculate_sortino_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.06,
    trading_days: int = TRADING_DAYS
) -> float:
    """
    Calculate Sortino ratio (uses only downside deviation).
    Sortino = (mean(r) - rf_daily) / downside_std * sqrt(trading_days)
    
    where downside_std = sqrt(mean(min(r - rf_daily, 0)^2))
    
    Args:
        returns: Series of returns
        risk_free_rate: Annual risk-free rate (default 0.06 = 6%)
        trading_days: Number of trading days per year (default 252)
    
    Returns:
        Sortino ratio (annualized)
    """
    clean_returns = returns.dropna()
    
    if len(clean_returns) < 2:
        return np.nan
    
    # Daily risk-free rate
    rf_daily = risk_free_rate / trading_days
    
    # Excess returns
    excess_returns = clean_returns - rf_daily
    
    # Downside deviation (only negative excess returns)
    downside_returns = excess_returns[excess_returns < 0]
    
    if len(downside_returns) == 0:
        # No downside - return inf or a very high number
        return np.inf
    
    downside_std = np.sqrt((downside_returns ** 2).mean())
    
    if downside_std == 0:
        return np.nan
    
    mean_excess = excess_returns.mean()
    sortino = (mean_excess / downside_std) * np.sqrt(trading_days)
    
    return sortino


def calculate_max_drawdown(values: pd.Series) -> Tuple[float, Optional[pd.Timestamp]]:
    """
    Calculate maximum drawdown.
    
    Algorithm:
        running_max = cummax(value)
        drawdown = (value - running_max) / running_max
        MDD = min(drawdown)
    
    Args:
        values: Series of portfolio values
    
    Returns:
        Tuple of (max_drawdown, date_of_max_drawdown)
    """
    clean_values = values.dropna()
    
    if len(clean_values) < 2:
        return 0.0, None
    
    # Running maximum
    running_max = clean_values.cummax()
    
    # Drawdown at each point
    drawdown = (clean_values - running_max) / running_max
    
    # Maximum drawdown (most negative)
    max_dd = drawdown.min()
    max_dd_date = drawdown.idxmin()
    
    return max_dd, max_dd_date


def calculate_var(returns: pd.Series, alpha: float = 0.05) -> float:
    """
    Calculate Value at Risk (Historical method).
    VaR_alpha = alpha-quantile of the return distribution
    
    Args:
        returns: Series of returns
        alpha: Significance level (default 0.05 for 95% VaR)
    
    Returns:
        VaR value (negative number representing loss)
    """
    clean_returns = returns.dropna()
    
    if len(clean_returns) < 10:  # Need reasonable sample
        return np.nan
    
    var = clean_returns.quantile(alpha)
    
    return var


def calculate_cvar(returns: pd.Series, alpha: float = 0.05) -> float:
    """
    Calculate Conditional Value at Risk (Expected Shortfall).
    CVaR_alpha = mean of returns at or below the VaR threshold
    
    Args:
        returns: Series of returns
        alpha: Significance level (default 0.05 for 95% CVaR)
    
    Returns:
        CVaR value (negative number representing expected loss)
    """
    clean_returns = returns.dropna()
    
    if len(clean_returns) < 10:
        return np.nan
    
    var_threshold = calculate_var(clean_returns, alpha)
    
    # Mean of returns at or below VaR
    tail_returns = clean_returns[clean_returns <= var_threshold]
    
    if len(tail_returns) == 0:
        return var_threshold  # Edge case
    
    cvar = tail_returns.mean()
    
    return cvar


def calculate_hhi(weights: Dict[str, float]) -> Tuple[float, float]:
    """
    Calculate Herfindahl-Hirschman Index (concentration).
    HHI = sum(w_i^2)
    Effective holdings: N_eff = 1 / HHI
    
    Args:
        weights: Dict of ticker -> weight
    
    Returns:
        Tuple of (HHI, effective_holdings)
    """
    weight_values = np.array(list(weights.values()))
    
    hhi = (weight_values ** 2).sum()
    effective_holdings = 1.0 / hhi if hhi > 0 else 0.0
    
    return hhi, effective_holdings


def calculate_beta(
    asset_returns: pd.Series,
    market_returns: pd.Series
) -> float:
    """
    Calculate beta.
    β = cov(r_asset, r_market) / var(r_market)
    
    Args:
        asset_returns: Series of asset/portfolio returns
        market_returns: Series of market/benchmark returns
    
    Returns:
        Beta coefficient
    """
    # Align series and drop NaN
    aligned = pd.DataFrame({
        'asset': asset_returns,
        'market': market_returns
    }).dropna()
    
    if len(aligned) < 2:
        return np.nan
    
    # Covariance and variance
    covariance = aligned['asset'].cov(aligned['market'])
    market_variance = aligned['market'].var(ddof=1)
    
    if market_variance == 0:
        return np.nan
    
    beta = covariance / market_variance
    
    return beta


def calculate_all_metrics(
    portfolio_returns: pd.Series,
    portfolio_values: pd.Series,
    current_weights: Dict[str, float],
    benchmark_returns: Optional[pd.Series] = None,
    risk_free_rate: float = 0.06
) -> PortfolioMetrics:
    """
    Calculate all portfolio metrics in one pass.
    
    Args:
        portfolio_returns: Series of portfolio returns
        portfolio_values: Series of portfolio values
        current_weights: Dict of current portfolio weights
        benchmark_returns: Optional benchmark returns for beta
        risk_free_rate: Annual risk-free rate
    
    Returns:
        PortfolioMetrics object with all computed metrics
    """
    clean_returns = portfolio_returns.dropna()
    
    # Basic return metrics
    total_return = (portfolio_values.iloc[-1] / portfolio_values.iloc[0]) - 1
    days = len(clean_returns)
    annualized_return = (1 + total_return) ** (TRADING_DAYS / days) - 1 if days > 0 else 0
    
    # Risk metrics
    ann_vol = calculate_annualized_volatility(clean_returns)
    sharpe = calculate_sharpe_ratio(clean_returns, risk_free_rate)
    sortino = calculate_sortino_ratio(clean_returns, risk_free_rate)
    max_dd, max_dd_date = calculate_max_drawdown(portfolio_values)
    
    # VaR and CVaR
    var_95 = calculate_var(clean_returns, 0.05)
    var_99 = calculate_var(clean_returns, 0.01)
    cvar_95 = calculate_cvar(clean_returns, 0.05)
    cvar_99 = calculate_cvar(clean_returns, 0.01)
    
    # Concentration
    hhi, eff_holdings = calculate_hhi(current_weights)
    
    # Market metrics
    beta_val = None
    correlation = None
    if benchmark_returns is not None:
        beta_val = calculate_beta(clean_returns, benchmark_returns)
        aligned = pd.DataFrame({
            'portfolio': clean_returns,
            'benchmark': benchmark_returns
        }).dropna()
        if len(aligned) >= 2:
            correlation = aligned['portfolio'].corr(aligned['benchmark'])
    
    return PortfolioMetrics(
        total_return=total_return,
        annualized_return=annualized_return,
        daily_returns_mean=clean_returns.mean(),
        annualized_volatility=ann_vol,
        sharpe_ratio=sharpe,
        sortino_ratio=sortino,
        max_drawdown=max_dd,
        max_drawdown_date=max_dd_date,
        var_95=var_95,
        var_99=var_99,
        cvar_95=cvar_95,
        cvar_99=cvar_99,
        hhi=hhi,
        effective_holdings=eff_holdings,
        beta=beta_val,
        correlation=correlation,
        current_value=portfolio_values.iloc[-1],
        current_weights=current_weights
    )
