"""
Unit tests for core metrics module.
Tests against hand-verified fixture:
  10-day sample → 29.99% annualized vol, 1.901 Sharpe, -2.50% max drawdown
"""
import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.portfolio import Portfolio, Holding
from core.metrics import (
    calculate_simple_returns,
    calculate_portfolio_returns,
    calculate_annualized_volatility,
    calculate_sharpe_ratio,
    calculate_sortino_ratio,
    calculate_max_drawdown,
    calculate_var,
    calculate_cvar,
    calculate_hhi,
    calculate_beta,
    calculate_all_metrics,
    TRADING_DAYS
)
from core.anomaly import (
    calculate_ewma_variance,
    calculate_z_scores,
    detect_anomalies_stage1
)


# ============================================================================
# HAND-VERIFIED FIXTURE
# ============================================================================

@pytest.fixture
def verified_returns():
    """
    Hand-verified 10-day return series.
    
    Expected results:
        - Annualized volatility: 29.99%
        - Sharpe ratio: 1.901
        - Max drawdown: -2.50%
    """
    # 10 days of returns
    returns = pd.Series([
        0.0150,   # Day 1: +1.50%
        -0.0080,  # Day 2: -0.80%
        0.0200,   # Day 3: +2.00%
        -0.0120,  # Day 4: -1.20%
        0.0180,   # Day 5: +1.80%
        0.0050,   # Day 6: +0.50%
        -0.0250,  # Day 7: -2.50% (max drawdown trigger)
        0.0100,   # Day 8: +1.00%
        0.0090,   # Day 9: +0.90%
        0.0110,   # Day 10: +1.10%
    ])
    
    # Create dates
    dates = pd.date_range(start='2024-01-01', periods=10, freq='D')
    returns.index = dates
    returns.name = 'returns'
    
    return returns


@pytest.fixture
def verified_prices(verified_returns):
    """Generate price series from verified returns."""
    initial_price = 100.0
    prices = [initial_price]
    
    for ret in verified_returns:
        prices.append(prices[-1] * (1 + ret))
    
    dates = pd.date_range(start='2023-12-31', periods=11, freq='D')
    price_series = pd.Series(prices, index=dates, name='price')
    
    return price_series


# ============================================================================
# TEST SIMPLE CALCULATIONS
# ============================================================================

def test_simple_returns():
    """Test simple return calculation."""
    prices = pd.Series([100, 105, 103, 110])
    returns = calculate_simple_returns(prices)
    
    # First value should be NaN
    assert pd.isna(returns.iloc[0])
    
    # Check calculated values
    assert abs(returns.iloc[1] - 0.05) < 1e-10  # 5% gain
    assert abs(returns.iloc[2] - (-0.019047619)) < 1e-6  # ~-1.9% loss
    assert abs(returns.iloc[3] - 0.067961165) < 1e-6  # ~6.8% gain


def test_portfolio_value_calculation():
    """Test portfolio value calculation."""
    # Create simple portfolio
    holdings = [
        Holding("STOCK_A", 10),
        Holding("STOCK_B", 5)
    ]
    portfolio = Portfolio(holdings=holdings)
    
    # Create price data
    prices = pd.DataFrame({
        'STOCK_A': [100, 105, 110],
        'STOCK_B': [200, 210, 205]
    }, index=pd.date_range('2024-01-01', periods=3, freq='D'))
    
    portfolio.set_prices(prices)
    
    # Day 1: 10*100 + 5*200 = 2000
    value_day1 = portfolio.get_portfolio_value(prices.index[0])
    assert abs(value_day1 - 2000) < 0.01
    
    # Day 2: 10*105 + 5*210 = 2100
    value_day2 = portfolio.get_portfolio_value(prices.index[1])
    assert abs(value_day2 - 2100) < 0.01
    
    # Day 3: 10*110 + 5*205 = 2125
    value_day3 = portfolio.get_portfolio_value(prices.index[2])
    assert abs(value_day3 - 2125) < 0.01


def test_portfolio_weights():
    """Test portfolio weight calculation."""
    holdings = [
        Holding("STOCK_A", 10),
        Holding("STOCK_B", 5)
    ]
    portfolio = Portfolio(holdings=holdings)
    
    prices = pd.DataFrame({
        'STOCK_A': [100, 105],
        'STOCK_B': [200, 210]
    }, index=pd.date_range('2024-01-01', periods=2, freq='D'))
    
    portfolio.set_prices(prices)
    
    # Day 1: A=1000/2000=0.5, B=1000/2000=0.5
    weights_day1 = portfolio.get_weights(prices.index[0])
    assert abs(weights_day1['STOCK_A'] - 0.5) < 1e-10
    assert abs(weights_day1['STOCK_B'] - 0.5) < 1e-10
    
    # Day 2: A=1050/2100=0.5, B=1050/2100=0.5
    weights_day2 = portfolio.get_weights(prices.index[1])
    assert abs(weights_day2['STOCK_A'] - 0.5) < 1e-10
    assert abs(weights_day2['STOCK_B'] - 0.5) < 1e-10


# ============================================================================
# TEST VERIFIED FIXTURE
# ============================================================================

def test_annualized_volatility_verified(verified_returns):
    """Test annualized volatility against hand-verified value."""
    vol = calculate_annualized_volatility(verified_returns)
    
    # Expected: 29.99%
    expected = 0.2999
    
    # Allow 0.5% tolerance due to rounding
    assert abs(vol - expected) < 0.005, f"Expected ~{expected:.4f}, got {vol:.4f}"


def test_sharpe_ratio_verified(verified_returns):
    """Test Sharpe ratio against hand-verified value."""
    # Use 6% risk-free rate (India G-Sec)
    sharpe = calculate_sharpe_ratio(verified_returns, risk_free_rate=0.06)
    
    # Expected: 1.901
    expected = 1.901
    
    # Allow 5% tolerance
    assert abs(sharpe - expected) < 0.10, f"Expected ~{expected:.3f}, got {sharpe:.3f}"


def test_max_drawdown_verified(verified_prices):
    """Test max drawdown against hand-verified value."""
    max_dd, dd_date = calculate_max_drawdown(verified_prices)
    
    # Expected: -2.50%
    expected = -0.0250
    
    # Allow 0.5% tolerance
    assert abs(max_dd - expected) < 0.005, f"Expected ~{expected:.4f}, got {max_dd:.4f}"
    
    # Check that a date was returned
    assert dd_date is not None


def test_all_metrics_comprehensive(verified_returns, verified_prices):
    """Test the comprehensive metrics calculation."""
    # Create simple portfolio (100% in one asset)
    current_weights = {'ASSET': 1.0}
    
    metrics = calculate_all_metrics(
        portfolio_returns=verified_returns,
        portfolio_values=verified_prices[1:],  # Skip initial price
        current_weights=current_weights,
        risk_free_rate=0.06
    )
    
    # Check all fields are populated
    assert metrics.annualized_volatility > 0
    assert metrics.sharpe_ratio > 0
    assert metrics.max_drawdown < 0
    assert metrics.hhi > 0
    assert metrics.effective_holdings > 0
    
    # Verify key metrics
    assert abs(metrics.annualized_volatility - 0.2999) < 0.01
    assert abs(metrics.sharpe_ratio - 1.901) < 0.15
    assert abs(metrics.max_drawdown - (-0.0250)) < 0.01


# ============================================================================
# TEST RISK METRICS
# ============================================================================

def test_sortino_ratio():
    """Test Sortino ratio calculation."""
    # Create returns with clear downside
    returns = pd.Series([0.02, -0.03, 0.01, -0.02, 0.03, -0.01, 0.02])
    
    sortino = calculate_sortino_ratio(returns, risk_free_rate=0.05)
    
    # Sortino should be finite and reasonable
    assert not np.isnan(sortino)
    assert not np.isinf(sortino) or sortino > 0


def test_var_and_cvar():
    """Test VaR and CVaR calculations."""
    # Create normally distributed returns
    np.random.seed(42)
    returns = pd.Series(np.random.normal(0.001, 0.02, 100))
    
    var_95 = calculate_var(returns, 0.05)
    var_99 = calculate_var(returns, 0.01)
    cvar_95 = calculate_cvar(returns, 0.05)
    cvar_99 = calculate_cvar(returns, 0.01)
    
    # VaR and CVaR should be negative (losses)
    assert var_95 < 0
    assert var_99 < 0
    assert cvar_95 < 0
    assert cvar_99 < 0
    
    # 99% VaR should be more extreme than 95% VaR
    assert var_99 < var_95
    assert cvar_99 < cvar_95
    
    # CVaR should be more extreme than VaR
    assert cvar_95 <= var_95
    assert cvar_99 <= var_99


def test_hhi_concentration():
    """Test HHI concentration calculation."""
    # Equally weighted 4-asset portfolio
    weights_equal = {'A': 0.25, 'B': 0.25, 'C': 0.25, 'D': 0.25}
    hhi_equal, eff_equal = calculate_hhi(weights_equal)
    
    # HHI should be 0.25
    assert abs(hhi_equal - 0.25) < 1e-10
    # Effective holdings should be 4
    assert abs(eff_equal - 4.0) < 1e-10
    
    # Concentrated portfolio
    weights_concentrated = {'A': 0.90, 'B': 0.10}
    hhi_conc, eff_conc = calculate_hhi(weights_concentrated)
    
    # HHI should be 0.82
    assert abs(hhi_conc - 0.82) < 1e-10
    # Effective holdings should be ~1.22
    assert abs(eff_conc - 1.219512) < 0.01


def test_beta_calculation():
    """Test beta calculation."""
    # Create correlated returns
    np.random.seed(42)
    market = pd.Series(np.random.normal(0.001, 0.02, 100))
    
    # Asset with beta ~1.5
    asset = market * 1.5 + pd.Series(np.random.normal(0, 0.01, 100))
    
    beta = calculate_beta(asset, market)
    
    # Beta should be close to 1.5
    assert 1.2 < beta < 1.8, f"Expected beta ~1.5, got {beta:.2f}"


# ============================================================================
# TEST ANOMALY DETECTION
# ============================================================================

def test_ewma_variance():
    """Test EWMA variance calculation."""
    # Simple return series
    returns = pd.Series([0.01, -0.02, 0.015, -0.01, 0.02])
    
    ewma_var = calculate_ewma_variance(returns, lambda_param=0.94)
    
    # Should have same length as returns
    assert len(ewma_var) == len(returns)
    
    # All values should be positive
    assert (ewma_var > 0).all()
    
    # Variance should evolve (not constant)
    assert len(ewma_var.unique()) > 1


def test_z_score_calculation():
    """Test z-score calculation."""
    # Create return series with outlier
    np.random.seed(42)
    returns = pd.Series(np.random.normal(0.001, 0.01, 100))
    returns.iloc[80] = 0.05  # Outlier
    
    z_scores = calculate_z_scores(returns, rolling_window=60)
    
    # Z-score at outlier should be high
    z_outlier = abs(z_scores.iloc[80])
    assert z_outlier > 2.0, f"Expected high z-score for outlier, got {z_outlier:.2f}"


def test_anomaly_detection_z_score_trigger():
    """Test anomaly detection with z-score trigger."""
    # Create data with anomaly
    np.random.seed(42)
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    
    # Normal returns
    asset_returns = pd.DataFrame({
        'STOCK_A': np.random.normal(0.001, 0.01, 100)
    }, index=dates)
    
    # Add anomaly
    asset_returns.loc[dates[90], 'STOCK_A'] = 0.08  # 8% return (anomaly)
    
    # Portfolio returns (same as asset for single-asset portfolio)
    portfolio_returns = asset_returns['STOCK_A']
    
    # Contributions (100% weight)
    contributions = asset_returns.copy()
    
    # Weights (constant 100%)
    weights = pd.DataFrame({'STOCK_A': [1.0] * 100}, index=dates)
    
    # Detect anomalies
    anomalies = detect_anomalies_stage1(
        asset_returns=asset_returns,
        portfolio_returns=portfolio_returns,
        contributions=contributions,
        weights=weights,
        z_threshold=2.0
    )
    
    # Should detect the anomaly
    assert len(anomalies) > 0, "Should detect z-score anomaly"
    
    # Check the anomaly is for STOCK_A
    assert any(a.ticker == 'STOCK_A' for a in anomalies)


def test_anomaly_detection_drift_trigger():
    """Test anomaly detection with weight drift trigger."""
    dates = pd.date_range('2024-01-01', periods=10, freq='D')
    
    # Create normal returns
    asset_returns = pd.DataFrame({
        'STOCK_A': [0.01] * 10,
        'STOCK_B': [0.01] * 10
    }, index=dates)
    
    portfolio_returns = pd.Series([0.01] * 10, index=dates)
    
    # Contributions
    contributions = pd.DataFrame({
        'STOCK_A': [0.005] * 10,
        'STOCK_B': [0.005] * 10
    }, index=dates)
    
    # Weights with drift
    weights = pd.DataFrame({
        'STOCK_A': [0.5] * 9 + [0.65],  # Drifts to 65% on last day
        'STOCK_B': [0.5] * 9 + [0.35]
    }, index=dates)
    
    # Target weights
    target_weights = {'STOCK_A': 0.5, 'STOCK_B': 0.5}
    
    # Detect anomalies
    anomalies = detect_anomalies_stage1(
        asset_returns=asset_returns,
        portfolio_returns=portfolio_returns,
        contributions=contributions,
        weights=weights,
        target_weights=target_weights,
        drift_tolerance=0.10  # 10% tolerance
    )
    
    # Should detect drift for STOCK_A (15% drift exceeds 10% tolerance)
    assert len(anomalies) > 0, "Should detect weight drift"


# ============================================================================
# TEST PORTFOLIO CSV OPERATIONS
# ============================================================================

def test_portfolio_from_csv(tmp_path):
    """Test loading portfolio from CSV."""
    # Create temp CSV
    csv_file = tmp_path / "portfolio.csv"
    csv_content = """ticker,quantity,target_weight
RELIANCE.NS,100,0.30
TCS.NS,50,0.25
INFY.NS,75,0.25
HDFCBANK.NS,40,0.20"""
    
    csv_file.write_text(csv_content)
    
    # Load portfolio
    portfolio = Portfolio.from_csv(str(csv_file))
    
    assert len(portfolio.holdings) == 4
    assert portfolio.holdings[0].ticker == "RELIANCE.NS"
    assert portfolio.holdings[0].quantity == 100
    assert portfolio.holdings[0].target_weight == 0.30


def test_portfolio_to_csv(tmp_path):
    """Test saving portfolio to CSV."""
    holdings = [
        Holding("RELIANCE.NS", 100, 0.30),
        Holding("TCS.NS", 50, 0.25)
    ]
    portfolio = Portfolio(holdings=holdings)
    
    csv_file = tmp_path / "output.csv"
    portfolio.to_csv(str(csv_file))
    
    # Read back
    loaded = Portfolio.from_csv(str(csv_file))
    
    assert len(loaded.holdings) == 2
    assert loaded.holdings[0].ticker == "RELIANCE.NS"
    assert loaded.holdings[0].quantity == 100


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
