"""
ML Agent - volatility forecasting using ML crew pipeline.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from crew.ml_crew import MLCrew
from core.portfolio import Portfolio


class MLAgent:
    """
    Specialist agent for ML-based volatility forecasting.
    
    Uses ML Crew with:
    - Linear Regression baseline
    - Random Forest
    - XGBoost
    - TimeSeriesSplit(n_splits=5, gap=5) cross-validation
    - Predicts 5-day forward realized volatility
    """
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "MLAgent"
        self.description = "Predicts 5-day forward realized volatility"
        self.ml_crew = MLCrew()
    
    def forecast_volatility(
        self,
        portfolio: Portfolio,
        forecast_horizon: int = 5
    ) -> dict:
        """
        Forecast portfolio volatility using ML models.
        
        Args:
            portfolio: Portfolio object with price data
            forecast_horizon: Days ahead to forecast (default 5)
        
        Returns:
            Dict with forecast results
        """
        try:
            # Get portfolio returns
            portfolio_returns = portfolio.get_value_series().pct_change().dropna()
            
            if len(portfolio_returns) < 100:
                return {
                    "status": "insufficient_data",
                    "message": f"Need at least 100 days of data, got {len(portfolio_returns)}"
                }
            
            # Run ML pipeline via crew
            results = self.ml_crew.run_pipeline(
                returns=portfolio_returns,
                forecast_horizon=forecast_horizon,
                n_splits=5,
                gap=5
            )
            
            return results
        
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }


if __name__ == "__main__":
    print("ML Agent - Volatility Forecasting")
    print("Uses CrewAI pipeline with TimeSeriesSplit validation")
    print("Never uses shuffle=True on time-series data")
