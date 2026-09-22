"""
Machine Learning Anomaly Detection Module.
Provides multivariate Isolation Forest detection for portfolio asset returns.
Features:
- Robust missing data handling & min sample protection
- Graceful fallback if scikit-learn or dependencies encounter errors
- Detailed quantitative anomaly scoring and explanations
"""
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np

from backend.utils.logger import logger


def detect_multivariate_anomalies(
    asset_returns: pd.DataFrame,
    contamination: float = 0.05,
    random_state: int = 42,
) -> List[Dict[str, Any]]:
    """
    Multivariate Anomaly Detection using scikit-learn IsolationForest.
    Extracts multidimensional feature vectors per asset (return, rolling volatility,
    momentum z-score, and squared variance deviation) to catch multivariate outliers
    that single-variable thresholds miss.

    Args:
        asset_returns: DataFrame with datetime index and asset return columns.
        contamination: The expected proportion of outliers in the data set.
        random_state: Seed for reproducible isolation forest trees.

    Returns:
        List of detected anomaly records with institutional explanations.
    """
    if asset_returns is None or asset_returns.empty:
        return []

    try:
        from sklearn.ensemble import IsolationForest
    except ImportError:
        logger.warning("scikit-learn is not installed; skipping IsolationForest anomaly detection.")
        return []

    try:
        clean_df = asset_returns.dropna(how="all")
        if len(clean_df) < 20:
            return []

        records = []
        for ticker in clean_df.columns:
            series = clean_df[ticker].dropna()
            if len(series) < 20:
                continue

            rolling_std = series.rolling(window=15, min_periods=5).std().fillna(series.std())
            rolling_mean = series.rolling(window=15, min_periods=5).mean().fillna(series.mean())

            # Feature matrix: return, rolling volatility, z-score, squared deviation
            safe_std = rolling_std.replace(0, 1e-6)
            z_scores = (series - rolling_mean) / safe_std
            sq_dev = (series - rolling_mean) ** 2

            X = pd.DataFrame({
                "return": series,
                "volatility": rolling_std,
                "z_score": z_scores,
                "sq_dev": sq_dev,
            }).dropna()

            if len(X) < 15:
                continue

            iso = IsolationForest(
                contamination=contamination,
                random_state=random_state,
                n_estimators=100,
            )
            preds = iso.fit_predict(X)
            scores = iso.decision_function(X)

            # Check if the most recent point is flagged as an anomaly (-1)
            if preds[-1] == -1:
                anomaly_score = float(-scores[-1])  # higher score indicates stronger outlier
                recent_ret = float(series.iloc[-1])
                recent_z = float(X["z_score"].iloc[-1])
                date_str = str(clean_df.index[-1].date()) if hasattr(clean_df.index[-1], "date") else str(clean_df.index[-1])

                records.append({
                    "ticker": str(ticker),
                    "date": date_str,
                    "model": "Isolation Forest (Unsupervised)",
                    "anomaly_score": round(anomaly_score, 3),
                    "return_value": round(recent_ret, 4),
                    "z_score": round(recent_z, 2),
                    "explanation": (
                        f"Multivariate outlier detected (score {anomaly_score:.2f}). "
                        f"Asset exhibited atypical joint return/volatility pattern: "
                        f"{recent_ret:+.2%} return at {recent_z:+.1f}σ from recent distribution."
                    ),
                })

        return records

    except Exception as e:
        logger.error(f"Error executing IsolationForest anomaly detection: {e}")
        return []
