"""
Anomaly Agent - detects and flags unusual market events (Stage 1 deterministic).
"""
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.portfolio import Portfolio
from core.anomaly import detect_anomalies_stage1, AnomalyEvent
from core.metrics import calculate_simple_returns
import config
import pandas as pd


class AnomalyAgent:
    """
    Specialist agent for anomaly detection.
    
    Runs Stage 1 detection (deterministic, no LLM):
    - Z-score threshold breaches
    - Large portfolio contributions
    - Weight drift from target
    - Drawdown tolerance breaches
    """
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "AnomalyAgent"
        self.description = "Detects statistical anomalies in portfolio behavior"
    
    def detect_anomalies(
        self,
        portfolio: Portfolio,
        max_drawdown: float,
        drawdown_tolerance: float = -0.15
    ) -> Dict:
        """
        Run Stage 1 anomaly detection.
        
        Args:
            portfolio: Portfolio with price data
            max_drawdown: Current max drawdown
            drawdown_tolerance: Acceptable drawdown threshold
        
        Returns:
            Dict with detected anomalies
        """
        # Calculate asset returns
        asset_returns = portfolio.prices.pct_change()
        
        # Calculate portfolio returns
        portfolio_returns = portfolio.get_value_series().pct_change()
        
        # Calculate weights over time
        weights_df = portfolio.get_weights_series()
        
        # Calculate contributions
        # C_i,t = w_i,t-1 * r_i,t
        lagged_weights = weights_df.shift(1)
        contributions = lagged_weights * asset_returns
        
        # Get target weights (if defined)
        target_weights = portfolio.target_weights if portfolio.target_weights else None
        
        # Run Stage 1 detection (deterministic)
        anomalies = detect_anomalies_stage1(
            asset_returns=asset_returns,
            portfolio_returns=portfolio_returns,
            contributions=contributions,
            weights=weights_df,
            target_weights=target_weights,
            z_threshold=config.Z_THRESHOLD,
            contribution_threshold=0.4,
            drift_tolerance=config.DRIFT_TOLERANCE,
            max_drawdown=max_drawdown,
            drawdown_tolerance=drawdown_tolerance,
            ewma_lambda=config.EWMA_LAMBDA
        )
        
        # Format results
        formatted_anomalies = []
        for anomaly in anomalies:
            formatted_anomalies.append({
                "ticker": anomaly.ticker,
                "date": anomaly.date.strftime('%Y-%m-%d'),
                "return": f"{anomaly.return_value:.2%}",
                "z_score": f"{anomaly.z_score:.2f}",
                "contribution": f"{anomaly.contribution:.2%}",
                "weight": f"{anomaly.weight:.2%}",
                "target_weight": f"{anomaly.target_weight:.2%}" if anomaly.target_weight else "N/A",
                "trigger": anomaly.trigger_reason,
                "raw_event": anomaly  # Keep original for downstream processing
            })
        
        return {
            "status": "success",
            "anomalies_count": len(anomalies),
            "anomalies": formatted_anomalies,
            "detection_params": {
                "z_threshold": config.Z_THRESHOLD,
                "drift_tolerance": config.DRIFT_TOLERANCE,
                "ewma_lambda": config.EWMA_LAMBDA
            }
        }
    
    def get_severity(self, anomaly: AnomalyEvent) -> str:
        """Classify anomaly severity."""
        z_score = abs(anomaly.z_score)
        
        if z_score > 3.0 or abs(anomaly.contribution) > 0.05:
            return "HIGH"
        elif z_score > 2.5:
            return "MEDIUM"
        else:
            return "LOW"
    
    def should_alert(self, anomaly: AnomalyEvent) -> bool:
        """Determine if anomaly warrants an alert (Stage 2 processing)."""
        # High severity always alerts
        if self.get_severity(anomaly) == "HIGH":
            return True
        
        # Medium severity with large contribution
        if self.get_severity(anomaly) == "MEDIUM" and abs(anomaly.contribution) > 0.02:
            return True
        
        # Portfolio-level events always alert
        if anomaly.ticker == "PORTFOLIO":
            return True
        
        return False


if __name__ == "__main__":
    print("Anomaly Agent - Stage 1 detection is fully deterministic")
    print("No LLM calls, no network calls - pure computation")
    print("See core/anomaly.py for detection algorithms")
