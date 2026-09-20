"""
Risk Agent - calculates and interprets portfolio risk metrics.
"""
import sys
from pathlib import Path
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.portfolio import Portfolio
from core.metrics import calculate_all_metrics
from data.providers import fetch_benchmark
import pandas as pd


class RiskAgent:
    """
    Specialist agent for risk metric calculation and interpretation.
    
    This agent wraps the pure computational core (core/metrics.py) and
    provides human-readable interpretations.
    """
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "RiskAgent"
        self.description = "Calculates portfolio risk metrics and provides interpretation"
    
    def calculate_metrics(
        self,
        portfolio: Portfolio,
        benchmark_ticker: str = "^NSEI"
    ) -> Dict:
        """
        Calculate all risk metrics for a portfolio.
        
        Args:
            portfolio: Portfolio object with price data
            benchmark_ticker: Benchmark index ticker
        
        Returns:
            Dict with metrics and interpretation
        """
        # Get portfolio returns and values
        portfolio_returns = portfolio.get_value_series().pct_change()
        portfolio_values = portfolio.get_value_series()
        current_weights = portfolio.get_weights()
        
        # Get benchmark returns (if available)
        benchmark_returns = None
        try:
            benchmark_prices = fetch_benchmark(
                benchmark_ticker,
                days=len(portfolio.prices)
            )
            if not benchmark_prices.empty:
                benchmark_returns = benchmark_prices.pct_change()
        except:
            pass
        
        # Calculate metrics using core module (deterministic, no LLM)
        metrics = calculate_all_metrics(
            portfolio_returns=portfolio_returns,
            portfolio_values=portfolio_values,
            current_weights=current_weights,
            benchmark_returns=benchmark_returns,
            risk_free_rate=portfolio.risk_free_rate
        )
        
        # Add interpretation
        interpretation = self._interpret_metrics(metrics)
        
        return {
            "metrics": metrics,
            "interpretation": interpretation,
            "status": "success"
        }
    
    def _interpret_metrics(self, metrics) -> Dict[str, str]:
        """Generate human-readable interpretations."""
        interpretations = {}
        
        # Volatility interpretation
        vol = metrics.annualized_volatility
        if vol < 0.15:
            interpretations["volatility"] = "Low volatility - relatively stable"
        elif vol < 0.30:
            interpretations["volatility"] = "Moderate volatility - typical for diversified portfolios"
        else:
            interpretations["volatility"] = "High volatility - significant price swings"
        
        # Sharpe interpretation
        sharpe = metrics.sharpe_ratio
        if sharpe < 0:
            interpretations["sharpe"] = "Negative Sharpe - returns below risk-free rate"
        elif sharpe < 1.0:
            interpretations["sharpe"] = "Below average risk-adjusted returns"
        elif sharpe < 2.0:
            interpretations["sharpe"] = "Good risk-adjusted returns"
        else:
            interpretations["sharpe"] = "Excellent risk-adjusted returns"
        
        # Max drawdown interpretation
        mdd = abs(metrics.max_drawdown)
        if mdd < 0.10:
            interpretations["drawdown"] = "Small drawdown - well-controlled downside"
        elif mdd < 0.20:
            interpretations["drawdown"] = "Moderate drawdown - acceptable for most investors"
        else:
            interpretations["drawdown"] = "Large drawdown - significant losses from peak"
        
        # Concentration interpretation
        if metrics.effective_holdings < 3:
            interpretations["concentration"] = "Highly concentrated - significant single-stock risk"
        elif metrics.effective_holdings < 10:
            interpretations["concentration"] = "Moderately diversified"
        else:
            interpretations["concentration"] = "Well diversified"
        
        # Beta interpretation (if available)
        if metrics.beta is not None:
            beta = metrics.beta
            if beta < 0.8:
                interpretations["beta"] = "Defensive - less volatile than market"
            elif beta < 1.2:
                interpretations["beta"] = "Market-like volatility"
            else:
                interpretations["beta"] = "Aggressive - more volatile than market"
        
        return interpretations
    
    def get_summary(self, metrics) -> str:
        """Get a one-sentence risk summary."""
        sharpe = metrics.sharpe_ratio
        vol = metrics.annualized_volatility
        
        if sharpe > 1.5 and vol < 0.25:
            return "Strong risk-adjusted performance with controlled volatility"
        elif sharpe > 1.0:
            return "Positive risk-adjusted returns with moderate volatility"
        elif sharpe > 0:
            return "Returns above risk-free rate but with elevated volatility"
        else:
            return "Returns below risk-free rate - review allocation recommended"


if __name__ == "__main__":
    print("Risk Agent - calculations are deterministic (no LLM)")
    print("See core/metrics.py for pure computational functions")
