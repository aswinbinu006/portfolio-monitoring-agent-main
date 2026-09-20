"""
Feature engineering for volatility forecasting.
Prepares features for ML models predicting 5-day forward realized volatility.
"""
import pandas as pd
import numpy as np
from typing import Tuple, List


def calculate_realized_volatility(returns: pd.Series, window: int = 5) -> pd.Series:
    """
    Calculate realized volatility over a rolling window.
    
    RV_t = sqrt(sum(r_i^2)) over window
    
    Args:
        returns: Series of returns
        window: Window size (default 5 days)
    
    Returns:
        Series of realized volatility
    """
    squared_returns = returns ** 2
    realized_vol = squared_returns.rolling(window=window).sum().apply(np.sqrt)
    return realized_vol


def create_lag_features(series: pd.Series, lags: List[int]) -> pd.DataFrame:
    """
    Create lagged features from a time series.
    
    Args:
        series: Time series data
        lags: List of lag periods (e.g., [1, 2, 3, 5])
    
    Returns:
        DataFrame with lagged features
    """
    features = {}
    for lag in lags:
        features[f'lag_{lag}'] = series.shift(lag)
    
    return pd.DataFrame(features, index=series.index)


def create_rolling_features(series: pd.Series, windows: List[int]) -> pd.DataFrame:
    """
    Create rolling window features (mean, std, min, max).
    
    Args:
        series: Time series data
        windows: List of window sizes (e.g., [5, 10, 20])
    
    Returns:
        DataFrame with rolling features
    """
    features = {}
    
    for window in windows:
        features[f'rolling_mean_{window}'] = series.rolling(window=window).mean()
        features[f'rolling_std_{window}'] = series.rolling(window=window).std()
        features[f'rolling_min_{window}'] = series.rolling(window=window).min()
        features[f'rolling_max_{window}'] = series.rolling(window=window).max()
    
    return pd.DataFrame(features, index=series.index)


def create_volatility_features(returns: pd.Series) -> pd.DataFrame:
    """
    Create comprehensive volatility-related features.
    
    Features:
    - Lagged returns (1, 2, 3, 5 days)
    - Rolling volatility (5, 10, 20 days)
    - Squared returns (heteroskedasticity)
    - Absolute returns
    - Rolling skewness and kurtosis
    
    Args:
        returns: Series of returns
    
    Returns:
        DataFrame with all features
    """
    features = {}
    
    # Lagged returns
    for lag in [1, 2, 3, 5]:
        features[f'return_lag_{lag}'] = returns.shift(lag)
    
    # Squared returns (proxy for volatility)
    features['return_squared'] = returns ** 2
    features['return_squared_lag_1'] = features['return_squared'].shift(1)
    features['return_squared_lag_2'] = features['return_squared'].shift(2)
    
    # Absolute returns
    features['return_abs'] = returns.abs()
    features['return_abs_lag_1'] = features['return_abs'].shift(1)
    
    # Rolling volatility features
    for window in [5, 10, 20]:
        features[f'realized_vol_{window}'] = calculate_realized_volatility(returns, window)
    
    # Rolling statistics on returns
    for window in [5, 10, 20]:
        features[f'return_mean_{window}'] = returns.rolling(window=window).mean()
        features[f'return_std_{window}'] = returns.rolling(window=window).std()
    
    # Rolling skewness and kurtosis (if enough data)
    features['return_skew_20'] = returns.rolling(window=20).skew()
    features['return_kurt_20'] = returns.rolling(window=20).kurt()
    
    # EWMA volatility
    features['ewma_vol'] = returns.ewm(alpha=0.06).std()  # lambda = 0.94
    
    # Range-based volatility (Parkinson estimator proxy)
    # Using rolling max-min as a simple proxy
    features['range_vol_5'] = (returns.rolling(window=5).max() - returns.rolling(window=5).min())
    
    return pd.DataFrame(features, index=returns.index)


def prepare_ml_dataset(
    returns: pd.Series,
    forecast_horizon: int = 5
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Prepare complete dataset for ML training.
    
    Target: forecast_horizon-day forward realized volatility
    Features: Comprehensive volatility features
    
    Args:
        returns: Time series of returns
        forecast_horizon: Days ahead to predict (default 5)
    
    Returns:
        Tuple of (features_df, target_series)
    """
    # Create features
    features = create_volatility_features(returns)
    
    # Create target (forward realized volatility)
    target = calculate_realized_volatility(returns, window=forecast_horizon).shift(-forecast_horizon)
    target.name = f'target_rv_{forecast_horizon}d'
    
    # Align and drop NaN
    dataset = features.copy()
    dataset['target'] = target
    dataset = dataset.dropna()
    
    X = dataset.drop('target', axis=1)
    y = dataset['target']
    
    return X, y


def create_feature_names() -> List[str]:
    """
    Get list of feature names for documentation.
    
    Returns:
        List of feature name patterns
    """
    return [
        "return_lag_1, return_lag_2, return_lag_3, return_lag_5",
        "return_squared, return_squared_lag_1, return_squared_lag_2",
        "return_abs, return_abs_lag_1",
        "realized_vol_5, realized_vol_10, realized_vol_20",
        "return_mean_5, return_mean_10, return_mean_20",
        "return_std_5, return_std_10, return_std_20",
        "return_skew_20, return_kurt_20",
        "ewma_vol",
        "range_vol_5"
    ]


if __name__ == "__main__":
    # Demo usage
    np.random.seed(42)
    
    # Generate synthetic returns
    returns = pd.Series(
        np.random.normal(0.001, 0.02, 200),
        index=pd.date_range('2024-01-01', periods=200, freq='D'),
        name='returns'
    )
    
    print("Feature Engineering Demo")
    print("=" * 60)
    
    # Calculate realized volatility
    rv_5d = calculate_realized_volatility(returns, window=5)
    print(f"\nRealized Volatility (5-day):")
    print(rv_5d.tail())
    
    # Create features
    features = create_volatility_features(returns)
    print(f"\nFeatures shape: {features.shape}")
    print(f"Feature columns: {list(features.columns)}")
    
    # Prepare ML dataset
    X, y = prepare_ml_dataset(returns, forecast_horizon=5)
    print(f"\nML Dataset:")
    print(f"  X shape: {X.shape}")
    print(f"  y shape: {y.shape}")
    print(f"  Features: {X.shape[1]}")
    print(f"  Samples: {X.shape[0]}")
    
    print(f"\nTarget statistics:")
    print(f"  Mean: {y.mean():.6f}")
    print(f"  Std: {y.std():.6f}")
    print(f"  Min: {y.min():.6f}")
    print(f"  Max: {y.max():.6f}")
