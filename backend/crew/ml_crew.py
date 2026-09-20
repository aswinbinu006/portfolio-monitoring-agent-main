"""
CrewAI crew for ML volatility forecasting pipeline.
Coordinates feature engineering, model training, and evaluation.
"""
import sys
from pathlib import Path
from typing import Dict
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.features import prepare_ml_dataset
from core.models import VolatilityForecaster, format_results_table


class MLCrewMember:
    """
    Base class for ML crew members.
    Each member has a specific role in the ML pipeline.
    """
    
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
    
    def execute(self, *args, **kwargs):
        """Execute member's task."""
        raise NotImplementedError


class FeatureEngineer(MLCrewMember):
    """Crew member responsible for feature engineering."""
    
    def __init__(self):
        super().__init__(
            name="FeatureEngineer",
            role="Creates features from raw returns data"
        )
    
    def execute(self, returns: pd.Series, forecast_horizon: int = 5) -> Dict:
        """
        Prepare ML dataset.
        
        Args:
            returns: Time series of returns
            forecast_horizon: Days ahead to predict
        
        Returns:
            Dict with X, y, and metadata
        """
        print(f"[{self.name}] Preparing features...")
        
        X, y = prepare_ml_dataset(returns, forecast_horizon)
        
        result = {
            "status": "success",
            "X": X,
            "y": y,
            "n_samples": len(X),
            "n_features": X.shape[1],
            "forecast_horizon": forecast_horizon,
            "feature_names": list(X.columns)
        }
        
        print(f"[{self.name}] Created {result['n_samples']} samples with {result['n_features']} features")
        
        return result


class ModelTrainer(MLCrewMember):
    """Crew member responsible for model training and evaluation."""
    
    def __init__(self):
        super().__init__(
            name="ModelTrainer",
            role="Trains and evaluates models using TimeSeriesSplit"
        )
        self.forecaster = None
    
    def execute(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        n_splits: int = 5,
        gap: int = 5
    ) -> Dict:
        """
        Train and evaluate all models.
        
        Args:
            X: Feature matrix
            y: Target vector
            n_splits: Number of CV splits
            gap: Gap between train/test
        
        Returns:
            Dict with results
        """
        print(f"[{self.name}] Training models with TimeSeriesSplit(n_splits={n_splits}, gap={gap})...")
        
        self.forecaster = VolatilityForecaster(n_splits=n_splits, gap=gap)
        comparison = self.forecaster.run_all_models(X, y)
        
        # Get best model
        best_model_row = comparison.iloc[0]
        best_model = best_model_row['model']
        
        result = {
            "status": "success",
            "comparison_table": comparison,
            "best_model": best_model,
            "best_r2": best_model_row['r2_mean'],
            "best_mae": best_model_row['mae_mean'],
            "forecaster": self.forecaster
        }
        
        print(f"[{self.name}] Best model: {best_model} (R²={best_model_row['r2_mean']:.4f})")
        
        return result


class ResultsAnalyst(MLCrewMember):
    """Crew member responsible for analyzing and reporting results."""
    
    def __init__(self):
        super().__init__(
            name="ResultsAnalyst",
            role="Analyzes results and generates report"
        )
    
    def execute(
        self,
        comparison_table: pd.DataFrame,
        best_model: str,
        forecaster: VolatilityForecaster,
        X: pd.DataFrame
    ) -> Dict:
        """
        Analyze results and create report.
        
        Args:
            comparison_table: Model comparison DataFrame
            best_model: Name of best performing model
            forecaster: Trained forecaster object
            X: Features for importance analysis
        
        Returns:
            Dict with report and insights
        """
        print(f"[{self.name}] Analyzing results...")
        
        # Format results table
        report_text = format_results_table(comparison_table)
        
        # Get feature importance
        feature_importance = None
        if best_model != 'naive_persistence':
            try:
                forecaster.train_final_model(best_model, X, forecaster.results[1]['y'] if hasattr(forecaster, 'results') else X)
                feature_importance = forecaster.get_feature_importance(best_model, X)
            except:
                pass
        
        # Generate insights
        insights = self._generate_insights(comparison_table, best_model)
        
        result = {
            "status": "success",
            "report": report_text,
            "feature_importance": feature_importance,
            "insights": insights
        }
        
        print(f"[{self.name}] Analysis complete")
        
        return result
    
    def _generate_insights(self, comparison: pd.DataFrame, best_model: str) -> list:
        """Generate insights from results."""
        insights = []
        
        # Check if models beat baseline
        baseline_r2 = comparison[comparison['model'] == 'naive_persistence']['r2_mean'].values[0]
        best_r2 = comparison.iloc[0]['r2_mean']
        
        if best_r2 > baseline_r2:
            improvement = ((best_r2 - baseline_r2) / abs(baseline_r2)) * 100 if baseline_r2 != 0 else 100
            insights.append(f"{best_model} improves over baseline by {improvement:.1f}% in R²")
        else:
            insights.append("ML models did not beat naive persistence baseline")
        
        # Check model performance
        if best_r2 > 0.3:
            insights.append("Strong predictive power (R² > 0.3)")
        elif best_r2 > 0.1:
            insights.append("Moderate predictive power (R² > 0.1)")
        else:
            insights.append("Weak predictive power (R² < 0.1) - volatility may be highly stochastic")
        
        return insights


class MLCrew:
    """
    Complete ML crew orchestrating the forecasting pipeline.
    
    Crew members:
    1. FeatureEngineer - Prepares features
    2. ModelTrainer - Trains and evaluates models
    3. ResultsAnalyst - Analyzes and reports
    """
    
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.model_trainer = ModelTrainer()
        self.results_analyst = ResultsAnalyst()
    
    def run_pipeline(
        self,
        returns: pd.Series,
        forecast_horizon: int = 5,
        n_splits: int = 5,
        gap: int = 5
    ) -> Dict:
        """
        Run complete ML forecasting pipeline.
        
        Args:
            returns: Time series of returns
            forecast_horizon: Days ahead to predict (default 5)
            n_splits: CV splits (default 5)
            gap: CV gap (default 5)
        
        Returns:
            Dict with complete results
        """
        print("=" * 60)
        print("ML FORECASTING PIPELINE")
        print("=" * 60)
        
        # Step 1: Feature Engineering
        feature_result = self.feature_engineer.execute(returns, forecast_horizon)
        
        if feature_result["status"] != "success":
            return feature_result
        
        # Step 2: Model Training
        model_result = self.model_trainer.execute(
            feature_result["X"],
            feature_result["y"],
            n_splits=n_splits,
            gap=gap
        )
        
        if model_result["status"] != "success":
            return model_result
        
        # Step 3: Results Analysis
        analysis_result = self.results_analyst.execute(
            model_result["comparison_table"],
            model_result["best_model"],
            model_result["forecaster"],
            feature_result["X"]
        )
        
        # Combine results
        final_result = {
            "status": "success",
            "n_samples": feature_result["n_samples"],
            "n_features": feature_result["n_features"],
            "forecast_horizon": forecast_horizon,
            "best_model": model_result["best_model"],
            "best_r2": model_result["best_r2"],
            "best_mae": model_result["best_mae"],
            "comparison_table": model_result["comparison_table"],
            "report": analysis_result["report"],
            "insights": analysis_result["insights"],
            "feature_importance": analysis_result["feature_importance"]
        }
        
        print("\n" + analysis_result["report"])
        
        if analysis_result["insights"]:
            print("\nKey Insights:")
            for insight in analysis_result["insights"]:
                print(f"  • {insight}")
        
        return final_result


if __name__ == "__main__":
    import numpy as np
    
    print("ML Crew Demo - Volatility Forecasting Pipeline")
    print("=" * 60)
    
    # Generate synthetic data
    np.random.seed(42)
    returns = pd.Series(
        np.random.normal(0.001, 0.02, 300),
        index=pd.date_range('2024-01-01', periods=300, freq='D'),
        name='returns'
    )
    
    # Run pipeline
    crew = MLCrew()
    results = crew.run_pipeline(
        returns=returns,
        forecast_horizon=5,
        n_splits=5,
        gap=5
    )
    
    print(f"\n{'='*60}")
    print(f"Pipeline Status: {results['status']}")
    print(f"Best Model: {results['best_model']}")
    print(f"R²: {results['best_r2']:.4f}")
    print(f"MAE: {results['best_mae']:.6f}")
