"""
Model Context Protocol (MCP) server exposing portfolio metrics via Gradio.
Exposes core computation functions as MCP tools with full docstrings.
"""
import sys
from pathlib import Path
from typing import Dict, List
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import gradio as gr
    GRADIO_AVAILABLE = True
except ImportError:
    GRADIO_AVAILABLE = False
    print("Warning: Gradio not installed. Install with: pip install gradio")

from core.portfolio import Portfolio
from core.metrics import calculate_all_metrics
from core.anomaly import detect_anomalies_stage1
import config


class PortfolioMCPServer:
    """
    MCP server for portfolio monitoring functions.
    
    Exposes functions as MCP tools that can be called by AI assistants
    or other MCP clients.
    """
    
    def __init__(self):
        self.name = "portfolio_monitoring_mcp"
        self.version = "1.0.0"
    
    def calculate_risk_metrics(
        self,
        portfolio_csv_path: str,
        days: int = 90
    ) -> str:
        """
        Calculate comprehensive risk metrics for a portfolio.
        
        Args:
            portfolio_csv_path: Path to CSV file with ticker,quantity columns
            days: Number of days of historical data to fetch (default 90)
        
        Returns:
            JSON string with all risk metrics including:
            - annualized_volatility: Portfolio volatility (annualized)
            - sharpe_ratio: Sharpe ratio (risk-adjusted returns)
            - sortino_ratio: Sortino ratio (downside deviation)
            - max_drawdown: Maximum drawdown from peak
            - var_95: 95% Value at Risk
            - cvar_95: 95% Conditional VaR (Expected Shortfall)
            - hhi: Herfindahl concentration index
            - effective_holdings: Effective number of holdings
            - beta: Beta vs benchmark (if available)
        """
        try:
            # Load portfolio
            portfolio = Portfolio.from_csv(portfolio_csv_path)
            
            # Fetch prices
            from data.providers import fetch_prices
            prices = fetch_prices(portfolio.tickers, days=days)
            
            if prices.empty:
                return json.dumps({"error": "Failed to fetch price data"})
            
            portfolio.set_prices(prices)
            
            # Calculate returns and values
            portfolio_returns = portfolio.get_value_series().pct_change()
            portfolio_values = portfolio.get_value_series()
            current_weights = portfolio.get_weights()
            
            # Calculate metrics
            metrics = calculate_all_metrics(
                portfolio_returns=portfolio_returns,
                portfolio_values=portfolio_values,
                current_weights=current_weights,
                risk_free_rate=portfolio.risk_free_rate
            )
            
            # Convert to dict
            result = {
                "total_return": float(metrics.total_return),
                "annualized_return": float(metrics.annualized_return),
                "annualized_volatility": float(metrics.annualized_volatility),
                "sharpe_ratio": float(metrics.sharpe_ratio),
                "sortino_ratio": float(metrics.sortino_ratio),
                "max_drawdown": float(metrics.max_drawdown),
                "max_drawdown_date": str(metrics.max_drawdown_date) if metrics.max_drawdown_date else None,
                "var_95": float(metrics.var_95),
                "var_99": float(metrics.var_99),
                "cvar_95": float(metrics.cvar_95),
                "cvar_99": float(metrics.cvar_99),
                "hhi": float(metrics.hhi),
                "effective_holdings": float(metrics.effective_holdings),
                "beta": float(metrics.beta) if metrics.beta is not None else None,
                "correlation": float(metrics.correlation) if metrics.correlation is not None else None,
                "current_value": float(metrics.current_value),
                "current_weights": {k: float(v) for k, v in metrics.current_weights.items()}
            }
            
            return json.dumps(result, indent=2)
        
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    def detect_portfolio_anomalies(
        self,
        portfolio_csv_path: str,
        days: int = 90,
        z_threshold: float = None
    ) -> str:
        """
        Detect statistical anomalies in portfolio behavior.
        
        Uses Stage 1 deterministic detection (no LLM):
        - Z-score threshold breaches
        - Large portfolio contributions
        - Weight drift from targets
        
        Args:
            portfolio_csv_path: Path to CSV file with ticker,quantity columns
            days: Number of days of historical data (default 90)
            z_threshold: Z-score threshold (default from config)
        
        Returns:
            JSON string with detected anomalies including:
            - ticker: Stock ticker
            - date: Event date
            - z_score: Statistical z-score
            - return_value: Return on that day
            - contribution: Contribution to portfolio return
            - trigger_reason: Why the anomaly was flagged
        """
        try:
            if z_threshold is None:
                z_threshold = config.Z_THRESHOLD
            
            # Load portfolio
            portfolio = Portfolio.from_csv(portfolio_csv_path)
            
            # Fetch prices
            from data.providers import fetch_prices
            prices = fetch_prices(portfolio.tickers, days=days)
            
            if prices.empty:
                return json.dumps({"error": "Failed to fetch price data"})
            
            portfolio.set_prices(prices)
            
            # Calculate returns and metrics
            asset_returns = portfolio.prices.pct_change()
            portfolio_returns = portfolio.get_value_series().pct_change()
            weights_df = portfolio.get_weights_series()
            
            # Calculate contributions
            lagged_weights = weights_df.shift(1)
            contributions = lagged_weights * asset_returns
            
            # Detect anomalies
            anomalies = detect_anomalies_stage1(
                asset_returns=asset_returns,
                portfolio_returns=portfolio_returns,
                contributions=contributions,
                weights=weights_df,
                z_threshold=z_threshold,
                ewma_lambda=config.EWMA_LAMBDA
            )
            
            # Format results
            result = []
            for anomaly in anomalies:
                result.append({
                    "ticker": anomaly.ticker,
                    "date": anomaly.date.strftime('%Y-%m-%d'),
                    "z_score": float(anomaly.z_score),
                    "return_value": float(anomaly.return_value),
                    "contribution": float(anomaly.contribution),
                    "portfolio_return": float(anomaly.portfolio_return),
                    "trigger_reason": anomaly.trigger_reason,
                    "weight": float(anomaly.weight)
                })
            
            return json.dumps({
                "anomalies_count": len(result),
                "anomalies": result
            }, indent=2)
        
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    def get_portfolio_value(
        self,
        portfolio_csv_path: str,
        days: int = 30
    ) -> str:
        """
        Get current portfolio value and time series.
        
        Args:
            portfolio_csv_path: Path to CSV file
            days: Days of history (default 30)
        
        Returns:
            JSON with current value and historical values
        """
        try:
            portfolio = Portfolio.from_csv(portfolio_csv_path)
            
            from data.providers import fetch_prices
            prices = fetch_prices(portfolio.tickers, days=days)
            
            if prices.empty:
                return json.dumps({"error": "Failed to fetch price data"})
            
            portfolio.set_prices(prices)
            
            value_series = portfolio.get_value_series()
            
            result = {
                "current_value": float(value_series.iloc[-1]),
                "start_value": float(value_series.iloc[0]),
                "total_return": float((value_series.iloc[-1] / value_series.iloc[0]) - 1),
                "historical_values": {
                    str(date): float(value) for date, value in value_series.items()
                }
            }
            
            return json.dumps(result, indent=2)
        
        except Exception as e:
            return json.dumps({"error": str(e)})


def create_gradio_interface():
    """
    Create Gradio interface for MCP server.
    
    This interface exposes the MCP tools via Gradio's MCP server protocol.
    """
    if not GRADIO_AVAILABLE:
        raise ImportError("Gradio not available. Install with: pip install gradio")
    
    server = PortfolioMCPServer()
    
    # Create Gradio interface for each tool
    with gr.Blocks(title="Portfolio Monitoring MCP Server") as app:
        gr.Markdown("# Portfolio Monitoring MCP Server")
        gr.Markdown("Exposes portfolio metrics as MCP tools")
        
        with gr.Tab("Calculate Risk Metrics"):
            with gr.Row():
                with gr.Column():
                    csv_input = gr.Textbox(label="Portfolio CSV Path", placeholder="path/to/portfolio.csv")
                    days_input = gr.Number(label="Days of History", value=90)
                    calculate_btn = gr.Button("Calculate Metrics")
                with gr.Column():
                    metrics_output = gr.JSON(label="Risk Metrics")
            
            calculate_btn.click(
                fn=server.calculate_risk_metrics,
                inputs=[csv_input, days_input],
                outputs=metrics_output
            )
        
        with gr.Tab("Detect Anomalies"):
            with gr.Row():
                with gr.Column():
                    csv_input2 = gr.Textbox(label="Portfolio CSV Path", placeholder="path/to/portfolio.csv")
                    days_input2 = gr.Number(label="Days of History", value=90)
                    z_input = gr.Number(label="Z-Score Threshold", value=2.0)
                    detect_btn = gr.Button("Detect Anomalies")
                with gr.Column():
                    anomalies_output = gr.JSON(label="Detected Anomalies")
            
            detect_btn.click(
                fn=server.detect_portfolio_anomalies,
                inputs=[csv_input2, days_input2, z_input],
                outputs=anomalies_output
            )
        
        with gr.Tab("Get Portfolio Value"):
            with gr.Row():
                with gr.Column():
                    csv_input3 = gr.Textbox(label="Portfolio CSV Path", placeholder="path/to/portfolio.csv")
                    days_input3 = gr.Number(label="Days of History", value=30)
                    value_btn = gr.Button("Get Value")
                with gr.Column():
                    value_output = gr.JSON(label="Portfolio Value")
            
            value_btn.click(
                fn=server.get_portfolio_value,
                inputs=[csv_input3, days_input3],
                outputs=value_output
            )
        
        gr.Markdown("""
        ## MCP Tools Available
        
        This server exposes three tools:
        
        1. **calculate_risk_metrics**: Comprehensive risk analysis
        2. **detect_portfolio_anomalies**: Statistical anomaly detection
        3. **get_portfolio_value**: Current value and time series
        
        All tools accept JSON input and return JSON output.
        """)
    
    return app


if __name__ == "__main__":
    if not GRADIO_AVAILABLE:
        print("ERROR: Gradio not installed")
        print("Install with: pip install gradio")
    else:
        print("Starting Portfolio Monitoring MCP Server...")
        app = create_gradio_interface()
        app.launch(
            server_name="0.0.0.0",
            server_port=7861,
            show_api=True
        )
