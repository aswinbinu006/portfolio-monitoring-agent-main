"""
Anomaly detection using EWMA and z-scores.
Stage 1 (deterministic) detection - runs before any LLM is consulted.

Pure numeric computation - zero network calls, zero LLM calls.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AnomalyEvent:
    """Represents a detected anomaly."""
    ticker: str
    date: pd.Timestamp
    return_value: float
    z_score: float
    contribution: float
    portfolio_return: float
    trigger_reason: str  # What caused the flag
    weight: float
    target_weight: Optional[float] = None


def calculate_ewma_variance(
    returns: pd.Series,
    lambda_param: float = 0.94,
    initial_var: Optional[float] = None
) -> pd.Series:
    """
    Calculate EWMA (Exponentially Weighted Moving Average) variance.
    
    Formula: σ²_t = λ * σ²_{t-1} + (1-λ) * r²_{t-1}
    
    This is the RiskMetrics approach with λ = 0.94 (standard).
    
    Args:
        returns: Series of returns
        lambda_param: Decay parameter (default 0.94)
        initial_var: Initial variance (default: use sample variance of first 30 days)
    
    Returns:
        Series of EWMA variance estimates
    """
    clean_returns = returns.dropna()
    
    if len(clean_returns) < 2:
        return pd.Series(index=returns.index, dtype=float)
    
    # Initialize variance
    if initial_var is None:
        # Use first 30 days or all available data
        init_window = min(30, len(clean_returns))
        initial_var = clean_returns.iloc[:init_window].var(ddof=1)
    
    # Compute EWMA variance iteratively
    variances = []
    var_t = initial_var
    
    for ret in clean_returns:
        # Update: var_t = lambda * var_{t-1} + (1-lambda) * r_{t-1}^2
        var_t = lambda_param * var_t + (1 - lambda_param) * (ret ** 2)
        variances.append(var_t)
    
    ewma_var = pd.Series(variances, index=clean_returns.index)
    
    return ewma_var


def calculate_z_scores(
    returns: pd.Series,
    rolling_window: int = 60,
    ewma_lambda: float = 0.94
) -> pd.Series:
    """
    Calculate z-scores using EWMA volatility.
    
    z_t = (r_t - mean) / sqrt(σ²_t)
    
    where σ²_t is EWMA variance and mean is rolling mean.
    
    Args:
        returns: Series of returns
        rolling_window: Window for rolling mean (default 60 days)
        ewma_lambda: EWMA lambda parameter (default 0.94)
    
    Returns:
        Series of z-scores
    """
    clean_returns = returns.dropna()
    
    if len(clean_returns) < rolling_window:
        # Not enough data for stable z-scores
        return pd.Series(index=returns.index, dtype=float)
    
    # Rolling mean
    rolling_mean = clean_returns.rolling(window=rolling_window, min_periods=rolling_window).mean()
    
    # EWMA variance
    ewma_var = calculate_ewma_variance(clean_returns, ewma_lambda)
    ewma_std = np.sqrt(ewma_var)
    
    # Z-score
    z_scores = (clean_returns - rolling_mean) / ewma_std
    
    return z_scores


def detect_anomalies_stage1(
    asset_returns: pd.DataFrame,
    portfolio_returns: pd.Series,
    contributions: pd.DataFrame,
    weights: pd.DataFrame,
    target_weights: Optional[Dict[str, float]] = None,
    z_threshold: float = 2.0,
    contribution_threshold: float = 0.4,
    drift_tolerance: float = 0.05,
    max_drawdown: Optional[float] = None,
    drawdown_tolerance: Optional[float] = None,
    ewma_lambda: float = 0.94
) -> List[AnomalyEvent]:
    """
    Stage 1 anomaly detection (deterministic, no LLM).
    
    Triggers if ANY of these conditions are true:
        1. |z_i,t| > z_threshold
        2. |C_i,t| > contribution_threshold * |r_p,t|
        3. |w_i - target_w_i| > drift_tolerance (if target weights defined)
        4. Portfolio max drawdown breaches tolerance (if defined)
    
    Args:
        asset_returns: DataFrame of individual asset returns
        portfolio_returns: Series of portfolio returns
        contributions: DataFrame of contribution to portfolio return
        weights: DataFrame of portfolio weights
        target_weights: Dict of target weights (optional)
        z_threshold: Z-score threshold (default 2.0)
        contribution_threshold: Contribution threshold as fraction of portfolio return (default 0.4)
        drift_tolerance: Weight drift tolerance (default 0.05 = 5%)
        max_drawdown: Current portfolio max drawdown (optional)
        drawdown_tolerance: Maximum acceptable drawdown (optional)
        ewma_lambda: EWMA lambda (default 0.94)
    
    Returns:
        List of AnomalyEvent objects
    """
    anomalies = []
    
    # Calculate z-scores for each asset
    z_scores_df = pd.DataFrame()
    for ticker in asset_returns.columns:
        z_scores_df[ticker] = calculate_z_scores(
            asset_returns[ticker],
            rolling_window=60,
            ewma_lambda=ewma_lambda
        )
    
    # Get latest date with all data
    latest_date = asset_returns.index[-1]
    
    # Check each ticker
    for ticker in asset_returns.columns:
        triggers = []
        
        # Get latest values
        ret = asset_returns[ticker].iloc[-1]
        z_score = z_scores_df[ticker].iloc[-1] if ticker in z_scores_df.columns else np.nan
        contribution = contributions[ticker].iloc[-1] if ticker in contributions.columns else 0.0
        weight = weights[ticker].iloc[-1] if ticker in weights.columns else 0.0
        portfolio_ret = portfolio_returns.iloc[-1]
        target_weight = target_weights.get(ticker) if target_weights else None
        
        # Skip if no valid data
        if pd.isna(ret) or pd.isna(z_score):
            continue
        
        # Condition 1: Z-score threshold
        if abs(z_score) > z_threshold:
            triggers.append(f"z-score {z_score:.2f} exceeds threshold {z_threshold}")
        
        # Condition 2: Contribution threshold
        if abs(contribution) > contribution_threshold * abs(portfolio_ret):
            pct = contribution_threshold * 100
            triggers.append(f"contribution {contribution:.4f} exceeds {pct}% of portfolio return")
        
        # Condition 3: Weight drift
        if target_weight is not None:
            drift = abs(weight - target_weight)
            if drift > drift_tolerance:
                triggers.append(f"weight drift {drift:.4f} exceeds tolerance {drift_tolerance}")
        
        # If any trigger fired, create event
        if triggers:
            anomalies.append(AnomalyEvent(
                ticker=ticker,
                date=latest_date,
                return_value=ret,
                z_score=z_score,
                contribution=contribution,
                portfolio_return=portfolio_ret,
                trigger_reason=" | ".join(triggers),
                weight=weight,
                target_weight=target_weight
            ))
    
    # Condition 4: Portfolio-level drawdown breach
    if max_drawdown is not None and drawdown_tolerance is not None:
        if abs(max_drawdown) > abs(drawdown_tolerance):
            # Add a portfolio-level event
            anomalies.append(AnomalyEvent(
                ticker="PORTFOLIO",
                date=latest_date,
                return_value=portfolio_returns.iloc[-1],
                z_score=0.0,  # Not applicable
                contribution=portfolio_returns.iloc[-1],
                portfolio_return=portfolio_returns.iloc[-1],
                trigger_reason=f"max drawdown {max_drawdown:.2%} breaches tolerance {drawdown_tolerance:.2%}",
                weight=1.0,
                target_weight=None
            ))
    
    return anomalies


def get_extreme_movers(
    asset_returns: pd.DataFrame,
    top_n: int = 5
) -> Dict[str, List[Tuple[pd.Timestamp, float]]]:
    """
    Get the top N extreme moves (positive and negative) for each asset.
    Useful for historical context.
    
    Args:
        asset_returns: DataFrame of asset returns
        top_n: Number of top movers to return
    
    Returns:
        Dict with 'top_gains' and 'top_losses', each containing list of (date, return)
    """
    result = {
        'top_gains': [],
        'top_losses': []
    }
    
    for ticker in asset_returns.columns:
        returns = asset_returns[ticker].dropna()
        
        if len(returns) == 0:
            continue
        
        # Top gains
        top_gains = returns.nlargest(top_n)
        for date, value in top_gains.items():
            result['top_gains'].append((ticker, date, value))
        
        # Top losses
        top_losses = returns.nsmallest(top_n)
        for date, value in top_losses.items():
            result['top_losses'].append((ticker, date, value))
    
    # Sort by magnitude
    result['top_gains'] = sorted(result['top_gains'], key=lambda x: x[2], reverse=True)[:top_n]
    result['top_losses'] = sorted(result['top_losses'], key=lambda x: x[2])[:top_n]
    
    return result


def calculate_rolling_correlation(
    returns: pd.DataFrame,
    window: int = 30
) -> pd.DataFrame:
    """
    Calculate rolling correlation matrix for assets.
    Useful for identifying regime changes.
    
    Args:
        returns: DataFrame of asset returns
        window: Rolling window size
    
    Returns:
        DataFrame of average pairwise correlations over time
    """
    if len(returns.columns) < 2:
        return pd.DataFrame()
    
    # Calculate rolling correlation for each pair
    correlations = []
    
    for i in range(len(returns)):
        if i < window:
            correlations.append(np.nan)
            continue
        
        window_data = returns.iloc[i-window:i]
        corr_matrix = window_data.corr()
        
        # Average correlation (excluding diagonal)
        n = len(corr_matrix)
        avg_corr = (corr_matrix.values.sum() - n) / (n * (n - 1)) if n > 1 else 0
        
        correlations.append(avg_corr)
    
    result = pd.Series(correlations, index=returns.index, name='avg_correlation')
    
    return result


def summarize_anomalies(anomalies: List[AnomalyEvent]) -> Dict:
    """
    Create a summary of detected anomalies.
    
    Args:
        anomalies: List of AnomalyEvent objects
    
    Returns:
        Dict with summary statistics
    """
    if not anomalies:
        return {
            'count': 0,
            'tickers': [],
            'avg_z_score': 0.0,
            'max_z_score': 0.0,
            'total_contribution': 0.0
        }
    
    tickers = list(set(a.ticker for a in anomalies))
    z_scores = [abs(a.z_score) for a in anomalies if a.ticker != "PORTFOLIO"]
    
    return {
        'count': len(anomalies),
        'tickers': tickers,
        'avg_z_score': np.mean(z_scores) if z_scores else 0.0,
        'max_z_score': max(z_scores) if z_scores else 0.0,
        'total_contribution': sum(a.contribution for a in anomalies),
        'events': anomalies
    }
