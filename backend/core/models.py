"""
ML models for volatility forecasting.
Predicts 5-day forward realized volatility using TimeSeriesSplit.

Models:
- Linear Regression (baseline)
- Random Forest
- XGBoost
- Naive persistence baseline
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Tuple
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import config

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("Warning: XGBoost not installed. Install with: pip install xgboost")


class VolatilityForecaster:
    """
    Volatility forecasting with multiple models and proper time-series CV.
    
    Uses TimeSeriesSplit(n_splits=5, gap=5) as specified.
    NEVER uses shuffle=True.
    """
    
    def __init__(self, n_splits: int = 5, gap: int = 5):
        """
        Initialize forecaster.
        
        Args:
            n_splits: Number of CV splits (default 5)
            gap: Gap between train and test (default 5 days)
        """
        self.n_splits = n_splits
        self.gap = gap
        self.tscv = TimeSeriesSplit(n_splits=n_splits, gap=gap)
        
        # Initialize models
        self.models = {
            'linear_regression': LinearRegression(),
            'random_forest': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=10,
                random_state=42,
                n_jobs=-1
            ),
        }
        
        if XGBOOST_AVAILABLE:
            self.models['xgboost'] = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1
            )
        
        self.results = {}
    
    def naive_persistence(self, X: pd.DataFrame, y: pd.Series) -> Dict:
        """
        Naive persistence baseline.
        Predicts next value = current value (shifted by forecast horizon).
        
        Args:
            X: Features (not used, but kept for consistency)
            y: Target values
        
        Returns:
            Dict with metrics
        """
        # For each CV fold, predict using last observed value
        all_y_true = []
        all_y_pred = []
        
        for train_idx, test_idx in self.tscv.split(X):
            y_train = y.iloc[train_idx]
            y_test = y.iloc[test_idx]
            
            # Predict using last training value
            last_train_value = y_train.iloc[-1]
            y_pred = np.full(len(y_test), last_train_value)
            
            all_y_true.extend(y_test.values)
            all_y_pred.extend(y_pred)
        
        all_y_true = np.array(all_y_true)
        all_y_pred = np.array(all_y_pred)
        
        return {
            'model': 'naive_persistence',
            'r2_mean': r2_score(all_y_true, all_y_pred),
            'r2_std': 0.0,  # Single prediction
            'mae_mean': mean_absolute_error(all_y_true, all_y_pred),
            'mae_std': 0.0,
            'mse_mean': mean_squared_error(all_y_true, all_y_pred),
            'mse_std': 0.0,
            'n_folds': self.n_splits
        }
    
    def cross_validate_model(
        self,
        model_name: str,
        X: pd.DataFrame,
        y: pd.Series
    ) -> Dict:
        """
        Cross-validate a model using TimeSeriesSplit.
        
        Args:
            model_name: Name of model to use
            X: Feature matrix
            y: Target vector
        
        Returns:
            Dict with mean and std of metrics across folds
        """
        model = self.models[model_name]
        
        r2_scores = []
        mae_scores = []
        mse_scores = []
        
        for fold, (train_idx, test_idx) in enumerate(self.tscv.split(X)):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predict
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            r2 = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            
            r2_scores.append(r2)
            mae_scores.append(mae)
            mse_scores.append(mse)
        
        return {
            'model': model_name,
            'r2_mean': np.mean(r2_scores),
            'r2_std': np.std(r2_scores),
            'mae_mean': np.mean(mae_scores),
            'mae_std': np.std(mae_scores),
            'mse_mean': np.mean(mse_scores),
            'mse_std': np.std(mse_scores),
            'n_folds': self.n_splits,
            'fold_r2_scores': r2_scores
        }
    
    def run_all_models(self, X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
        """
        Run all models and compare performance.
        
        Args:
            X: Feature matrix
            y: Target vector
        
        Returns:
            DataFrame with comparison table
        """
        results = []
        
        # Naive baseline
        print("Running naive persistence baseline...")
        baseline_result = self.naive_persistence(X, y)
        results.append(baseline_result)
        
        # ML models
        for model_name in self.models.keys():
            print(f"Running {model_name}...")
            result = self.cross_validate_model(model_name, X, y)
            results.append(result)
        
        # Create comparison table
        comparison = pd.DataFrame(results)
        comparison = comparison[[
            'model', 'r2_mean', 'r2_std',
            'mae_mean', 'mae_std', 'mse_mean', 'mse_std'
        ]]
        
        # Sort by R² (descending)
        comparison = comparison.sort_values('r2_mean', ascending=False)
        
        self.results = results
        
        return comparison
    
    def train_final_model(
        self,
        model_name: str,
        X: pd.DataFrame,
        y: pd.Series
    ):
        """
        Train final model on all data for deployment.
        
        Args:
            model_name: Name of model to train
            X: Full feature matrix
            y: Full target vector
        
        Returns:
            Trained model
        """
        model = self.models[model_name]
        model.fit(X, y)
        return model
    
    def get_feature_importance(
        self,
        model_name: str,
        X: pd.DataFrame
    ) -> pd.Series:
        """
        Get feature importance from trained model.
        
        Args:
            model_name: Name of model
            X: Features (for column names)
        
        Returns:
            Series of feature importances
        """
        model = self.models[model_name]
        
        if model_name == 'linear_regression':
            importance = np.abs(model.coef_)
        elif model_name in ['random_forest', 'xgboost']:
            importance = model.feature_importances_
        else:
            return None
        
        return pd.Series(importance, index=X.columns).sort_values(ascending=False)


def format_results_table(comparison_df: pd.DataFrame) -> str:
    """
    Format comparison results as readable text table.
    
    Args:
        comparison_df: DataFrame from run_all_models
    
    Returns:
        Formatted string table
    """
    lines = []
    lines.append("=" * 80)
    lines.append("VOLATILITY FORECASTING MODEL COMPARISON")
    lines.append("=" * 80)
    lines.append(f"{'Model':<25} {'R²':<15} {'MAE':<15} {'MSE':<15}")
    lines.append("-" * 80)
    
    for _, row in comparison_df.iterrows():
        model = row['model']
        r2_str = f"{row['r2_mean']:.4f} ± {row['r2_std']:.4f}"
        mae_str = f"{row['mae_mean']:.6f} ± {row['mae_std']:.6f}"
        mse_str = f"{row['mse_mean']:.6f} ± {row['mse_std']:.6f}"
        
        lines.append(f"{model:<25} {r2_str:<15} {mae_str:<15} {mse_str:<15}")
    
    lines.append("=" * 80)
    lines.append(f"Cross-validation: TimeSeriesSplit(n_splits={comparison_df.iloc[0].get('n_folds', 5)}, gap=5)")
    lines.append("Target: 5-day forward realized volatility")
    lines.append("=" * 80)
    
    return "\n".join(lines)


if __name__ == "__main__":
    from features import prepare_ml_dataset
    
    print("Volatility Forecasting Demo")
    print("=" * 60)
    
    # Generate synthetic data
    np.random.seed(42)
    returns = pd.Series(
        np.random.normal(0.001, 0.02, 300),
        index=pd.date_range('2024-01-01', periods=300, freq='D'),
        name='returns'
    )
    
    # Prepare dataset
    print("\nPreparing ML dataset...")
    X, y = prepare_ml_dataset(returns, forecast_horizon=5)
    print(f"Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Run models
    print("\nRunning models with TimeSeriesSplit(n_splits=5, gap=5)...")
    forecaster = VolatilityForecaster(n_splits=5, gap=5)
    comparison = forecaster.run_all_models(X, y)
    
    # Display results
    print("\n" + format_results_table(comparison))
    
    # Feature importance
    print("\nTop 10 Features (Random Forest):")
    if 'random_forest' in forecaster.models:
        forecaster.train_final_model('random_forest', X, y)
        importance = forecaster.get_feature_importance('random_forest', X)
        for feat, imp in importance.head(10).items():
            print(f"  {feat:<30} {imp:.4f}")
