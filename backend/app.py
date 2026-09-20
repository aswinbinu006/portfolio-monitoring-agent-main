"""
Main Gradio application for Portfolio Monitoring Agent.

Features:
- Portfolio upload (CSV)
- Dashboard with charts
- Risk metrics display
- Alerts with news citations
- Agent execution trace
- ML forecast comparison
- Final briefing with copy button
- Offline mode (--offline flag)
"""
import sys
import argparse
from pathlib import Path
from datetime import datetime
import json

sys.path.insert(0, str(Path(__file__).parent))

try:
    import gradio as gr
    import pandas as pd
    import plotly.graph_objects as go
    import plotly.express as px
    GRADIO_AVAILABLE = True
except ImportError:
    GRADIO_AVAILABLE = False
    print("ERROR: Required packages not installed")
    print("Install with: pip install gradio plotly")
    sys.exit(1)

from core.portfolio import Portfolio
from agents.orchestrator import Orchestrator
from memory.store import get_memory_store
import config


# Global state
OFFLINE_MODE = False
OFFLINE_DATA_PATH = "offline_portfolio.parquet"


def load_portfolio_from_csv(csv_file, mandate="balanced"):
    """Load portfolio from uploaded CSV file."""
    try:
        if csv_file is None:
            return None, "Please upload a CSV file"
        
        # Save uploaded file
        temp_path = "temp_portfolio.csv"
        with open(temp_path, 'wb') as f:
            f.write(csv_file)
        
        # Load portfolio
        portfolio = Portfolio.from_csv(temp_path)
        
        # Set mandate-specific parameters
        if mandate == "conservative":
            portfolio.risk_free_rate = 0.06
        elif mandate == "balanced":
            portfolio.risk_free_rate = 0.06
        elif mandate == "aggressive":
            portfolio.risk_free_rate = 0.06
        
        return portfolio, f"✓ Loaded {len(portfolio.holdings)} holdings"
    
    except Exception as e:
        return None, f"Error loading portfolio: {str(e)}"


def run_full_analysis(portfolio, mandate, days, drawdown_tolerance):
    """Run complete analysis workflow."""
    if portfolio is None:
        return {
            "status": "error",
            "message": "No portfolio loaded"
        }
    
    try:
        if OFFLINE_MODE:
            # Load from frozen snapshot
            return load_offline_analysis()
        
        # Run orchestrator
        orchestrator = Orchestrator()
        results = orchestrator.run_full_analysis(
            portfolio=portfolio,
            days=days,
            mandate=mandate,
            drawdown_tolerance=drawdown_tolerance
        )
        
        return results
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error": str(e)
        }


def create_portfolio_tab():
    """Create Portfolio Upload tab."""
    with gr.Column():
        gr.HTML("""
        <div class="info-card">
            <h2 style="margin-top:0; color: #1976d2;">🚀 Get Started</h2>
            <p style="font-size: 1.05rem; margin-bottom: 0;">
                Upload your portfolio CSV to unlock comprehensive risk analysis, anomaly detection, and AI-powered insights.
            </p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column(scale=1):
                gr.Markdown("### 📋 CSV Format Example")
                gr.Code("""symbol,quantity,target_weight
RELIANCE.NS,100,0.30
TCS.NS,50,0.25
INFY.NS,75,0.25
HDFCBANK.NS,40,0.20""", language="python")
                
                gr.HTML("""
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                    <strong>💡 Pro Tip:</strong> Use .NS for NSE stocks, .BO for BSE, or no suffix for US stocks
                </div>
                """)
            
            with gr.Column(scale=1):
                csv_input = gr.File(
                    label="📁 Upload Portfolio CSV", 
                    file_types=[".csv"],
                    elem_classes="upload-box"
                )
                
                gr.HTML("<h3 style='margin-top: 1.5rem; color: #667eea;'>⚙️ Configuration</h3>")
                
                mandate_input = gr.Radio(
                    choices=["conservative", "balanced", "aggressive"],
                    value="balanced",
                    label="Investment Mandate",
                    info="Select your risk tolerance level"
                )
                
                days_input = gr.Slider(
                    minimum=30, maximum=365, value=90, step=1,
                    label="Historical Data Period (Days)",
                    info="More data = better analysis (but slower)"
                )
                
                drawdown_input = gr.Slider(
                    minimum=-0.50, maximum=-0.05, value=-0.15, step=0.01,
                    label="Maximum Acceptable Drawdown",
                    info="Risk threshold for alerts (-15% default)"
                )
        
        gr.HTML("<hr style='margin: 2rem 0; border: none; border-top: 2px solid #e0e0e0;'>")
        
        with gr.Row():
            analyze_btn = gr.Button(
                "🚀 Run Complete Analysis", 
                variant="primary", 
                size="lg",
                elem_classes="primary"
            )
        
        status_output = gr.Textbox(
            label="📊 Analysis Status", 
            interactive=False,
            placeholder="Upload portfolio and click 'Run Analysis' to begin..."
        )
    
    return csv_input, mandate_input, days_input, drawdown_input, analyze_btn, status_output


def create_dashboard_tab(results):
    """Create Dashboard tab with charts."""
    with gr.Column():
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <h2 style="color: white; margin: 0;">📈 Portfolio Dashboard</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;">
                Visual analytics and performance metrics
            </p>
        </div>
        """)
        
        if results is None or results.get("status") != "success":
            gr.HTML("""
            <div class="info-card">
                <h3 style="color: #2196f3; margin-top: 0;">ℹ️ Dashboard Ready</h3>
                <p style="font-size: 1.05rem;">
                    Upload your portfolio and run analysis to see beautiful charts and insights here.
                </p>
            </div>
            """)
        
        with gr.Row():
            with gr.Column(scale=2):
                portfolio_value_plot = gr.Plot(
                    label="💰 Portfolio Value Over Time",
                    elem_classes="plot-container"
                )
            with gr.Column(scale=1):
                allocation_plot = gr.Plot(
                    label="🥧 Current Allocation",
                    elem_classes="plot-container"
                )
        
        with gr.Row():
            contribution_plot = gr.Plot(
                label="📊 Holdings Contribution",
                elem_classes="plot-container"
            )
            drift_plot = gr.Plot(
                label="🎯 Weight Drift from Target",
                elem_classes="plot-container"
            )
        
    return portfolio_value_plot, contribution_plot, allocation_plot, drift_plot


def create_risk_tab():
    """Create Risk Metrics tab."""
    with gr.Column():
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); 
                    padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <h2 style="color: white; margin: 0;">⚠️ Risk Analysis</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;">
                Comprehensive risk metrics and downside analysis
            </p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column():
                gr.HTML("<div class='stats-card'><h3 style='color: #667eea; margin-top:0;'>📊 Key Risk Metrics</h3></div>")
                volatility_text = gr.Textbox(
                    label="📈 Annualized Volatility", 
                    interactive=False,
                    elem_classes="metric-box"
                )
                sharpe_text = gr.Textbox(
                    label="⚡ Sharpe Ratio", 
                    interactive=False,
                    elem_classes="metric-box"
                )
                sortino_text = gr.Textbox(
                    label="📉 Sortino Ratio", 
                    interactive=False,
                    elem_classes="metric-box"
                )
            
            with gr.Column():
                gr.HTML("<div class='stats-card'><h3 style='color: #ff6b6b; margin-top:0;'>🔻 Downside Risk</h3></div>")
                maxdd_text = gr.Textbox(
                    label="💔 Maximum Drawdown", 
                    interactive=False,
                    elem_classes="metric-box"
                )
                var_text = gr.Textbox(
                    label="📊 Value at Risk (95%)", 
                    interactive=False,
                    elem_classes="metric-box"
                )
                cvar_text = gr.Textbox(
                    label="⚠️ CVaR (95%)", 
                    interactive=False,
                    elem_classes="metric-box"
                )
        
        with gr.Row():
            with gr.Column():
                concentration_text = gr.Textbox(
                    label="🎯 Effective Holdings (Diversification)", 
                    interactive=False
                )
            with gr.Column():
                beta_text = gr.Textbox(
                    label="📈 Beta vs Benchmark", 
                    interactive=False
                )
        
        gr.HTML("<h3 style='color: #667eea; margin-top: 2rem;'>📊 Advanced Analytics</h3>")
        
        with gr.Row():
            correlation_plot = gr.Plot(
                label="🔗 Correlation Heatmap",
                elem_classes="plot-container"
            )
            drawdown_plot = gr.Plot(
                label="📉 Drawdown Curve",
                elem_classes="plot-container"
            )
        
        with gr.Accordion("📋 Full Metrics JSON", open=False):
            metrics_json = gr.JSON(label="Complete Risk Metrics")
    
    return (metrics_json, volatility_text, sharpe_text, sortino_text, maxdd_text,
            var_text, cvar_text, concentration_text, beta_text, correlation_plot, drawdown_plot)


def create_alerts_tab():
    """Create Alerts tab."""
    with gr.Column():
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                    padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <h2 style="color: white; margin: 0;">🚨 Alerts & Material Events</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;">
                Two-stage anomaly detection with AI-powered news attribution
            </p>
        </div>
        """)
        
        alerts_count = gr.Textbox(
            label="🔔 Total Alerts Detected", 
            interactive=False,
            elem_classes="metric-box"
        )
        
        gr.HTML("<h3 style='color: #f5576c;'>📋 Detected Anomalies</h3>")
        alerts_table = gr.Dataframe(
            label="Anomaly Details",
            wrap=True
        )
        
        gr.HTML("<h3 style='color: #667eea; margin-top: 2rem;'>📰 News Analysis</h3>")
        with gr.Accordion("View Detailed News Attribution", open=True):
            news_analyses = gr.JSON(label="News Analysis with Citations")
    
    return alerts_count, alerts_table, news_analyses


def create_trace_tab():
    """Create Agent Trace tab."""
    with gr.Column():
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); 
                    padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <h2 style="color: #333; margin: 0;">🔍 Agent Execution Trace</h2>
            <p style="color: #555; margin: 0.5rem 0 0 0;">
                Real-time log of multi-agent system with tool calls, reasoning, and token usage
            </p>
        </div>
        """)
        
        gr.HTML("""
        <div class="info-card">
            <h4 style="color: #ff6b35; margin-top:0;">👁️ Transparency Mode</h4>
            <p>Watch how the AI agents work together - from data fetching to final briefing generation.</p>
        </div>
        """)
        
        execution_log = gr.Textbox(
            label="📝 Detailed Execution Log", 
            lines=20, 
            interactive=False,
            placeholder="Agent execution trace will appear here during analysis..."
        )
        
        with gr.Accordion("🔧 Session Technical Details", open=False):
            session_info = gr.JSON(label="Session Metadata")
    
    return execution_log, session_info


def create_forecast_tab():
    """Create ML Forecast tab."""
    with gr.Column():
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
                    padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <h2 style="color: white; margin: 0;">🤖 ML Volatility Forecast</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;">
                5-day forward volatility prediction using ensemble models
            </p>
        </div>
        """)
        
        forecast_status = gr.Textbox(
            label="🔮 Forecast Status", 
            interactive=False,
            elem_classes="metric-box"
        )
        
        gr.HTML("<h3 style='color: #00f2fe;'>📊 Model Performance Comparison</h3>")
        forecast_table = gr.Dataframe(
            label="Model Comparison (Linear, Random Forest, XGBoost, GARCH)",
            wrap=True
        )
        
        with gr.Row():
            with gr.Column():
                forecast_plot = gr.Plot(
                    label="📈 Predicted vs Actual Volatility",
                    elem_classes="plot-container"
                )
            with gr.Column():
                forecast_report = gr.Textbox(
                    label="📄 Detailed Forecast Report", 
                    lines=15, 
                    interactive=False
                )
    
    return forecast_status, forecast_table, forecast_report, forecast_plot


def create_briefing_tab():
    """Create Briefing tab."""
    with gr.Column():
        gr.HTML("""
        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); 
                    padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
            <h2 style="color: #333; margin: 0;">📄 Investment Briefing</h2>
            <p style="color: #555; margin: 0.5rem 0 0 0;">
                Professional investment report generated by AI Writer Agent (zero tools - pure reasoning)
            </p>
        </div>
        """)
        
        briefing_text = gr.Textbox(
            label="📋 Executive Briefing", 
            lines=30, 
            interactive=False,
            placeholder="Your mandate-conditioned briefing will appear here after analysis..."
        )
        
        with gr.Row():
            copy_btn = gr.Button("📋 Copy to Clipboard", variant="secondary")
            copy_status = gr.Textbox(label="", interactive=False, visible=False)
    
    return briefing_text, copy_btn, copy_status


def build_app():
    """Build complete Gradio application."""
    
    # Custom CSS for beautiful styling
    custom_css = """
    .gradio-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }
    
    .main-header h1 {
        color: white !important;
        font-size: 2.5rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.5rem !important;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .main-header p {
        color: rgba(255,255,255,0.95) !important;
        font-size: 1.1rem !important;
    }
    
    .stats-card {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        box-shadow: 0 4px 6px rgba(0,0,0,0.07);
        transition: transform 0.2s;
    }
    
    .stats-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    }
    
    .tab-nav {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 0.5rem;
    }
    
    button.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border: none !important;
        color: white !important;
        font-weight: 600 !important;
        padding: 0.75rem 2rem !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
        transition: all 0.3s !important;
    }
    
    button.primary:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6) !important;
    }
    
    .metric-box {
        background: white;
        border-left: 4px solid #667eea;
        padding: 1rem;
        border-radius: 6px;
        margin: 0.5rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .alert-badge {
        background: #ff6b6b;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        display: inline-block;
    }
    
    .success-badge {
        background: #51cf66;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        display: inline-block;
    }
    
    .info-card {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-left: 4px solid #2196f3;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .plot-container {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        margin: 1rem 0;
    }
    """
    
    with gr.Blocks(title="Portfolio Monitoring Agent", css=custom_css) as app:
        # Hero Header
        with gr.Row():
            with gr.Column():
                gr.HTML("""
                <div class="main-header">
                    <h1>📊 Investment Portfolio Monitoring Agent</h1>
                    <p>AI-powered multi-agent system for real-time portfolio analysis, risk monitoring, and intelligent forecasting</p>
                </div>
                """)
        
        if OFFLINE_MODE:
            gr.Markdown("⚠️ **OFFLINE MODE** - Using frozen data snapshot")
        
        # Store results in state
        results_state = gr.State(None)
        portfolio_state = gr.State(None)
        
        with gr.Tabs() as tabs:
            # Tab 1: Portfolio
            with gr.Tab("📁 Portfolio"):
                csv_input, mandate_input, days_input, drawdown_input, analyze_btn, status_output = create_portfolio_tab()
            
            # Tab 2: Dashboard
            with gr.Tab("📈 Dashboard"):
                portfolio_value_plot, contribution_plot, allocation_plot, drift_plot = create_dashboard_tab(None)
            
            # Tab 3: Risk
            with gr.Tab("⚠️ Risk"):
                (metrics_json, volatility_text, sharpe_text, sortino_text, maxdd_text,
                 var_text, cvar_text, concentration_text, beta_text, correlation_plot,
                 drawdown_plot) = create_risk_tab()
            
            # Tab 4: Alerts
            with gr.Tab("🚨 Alerts"):
                alerts_count, alerts_table, news_analyses = create_alerts_tab()
            
            # Tab 5: Agent Trace
            with gr.Tab("🔍 Agent Trace"):
                execution_log, session_info = create_trace_tab()
            
            # Tab 6: Forecast
            with gr.Tab("🤖 ML Forecast"):
                forecast_status, forecast_table, forecast_report, forecast_plot = create_forecast_tab()
            
            # Tab 7: Briefing
            with gr.Tab("📄 Briefing"):
                briefing_text, copy_btn, copy_status = create_briefing_tab()
        
        # Analysis workflow
        def analyze_wrapper(csv_file, mandate, days, drawdown):
            portfolio, msg = load_portfolio_from_csv(csv_file, mandate)
            if portfolio is None:
                return None, portfolio, msg
            
            results = run_full_analysis(portfolio, mandate, days, drawdown)
            
            if results.get("status") == "success":
                return results, portfolio, "✓ Analysis complete!"
            else:
                return results, portfolio, f"✗ Error: {results.get('error', 'Unknown error')}"
        
        analyze_btn.click(
            fn=analyze_wrapper,
            inputs=[csv_input, mandate_input, days_input, drawdown_input],
            outputs=[results_state, portfolio_state, status_output]
        )
        
        # Update outputs when analysis completes
        # (Additional update functions would be added here to populate all tabs)
        
        # Beautiful Footer
        gr.HTML("""
        <div style="margin-top: 3rem; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    border-radius: 12px; text-align: center; color: white;">
            <h3 style="margin-top: 0; color: white;">💡 About This System</h3>
            <p style="font-size: 1.05rem; max-width: 800px; margin: 1rem auto;">
                This is a <strong>monitoring and explanation system</strong>, not a trading system.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 1rem; margin: 2rem 0; text-align: left;">
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                    <strong>Monitors</strong><br/>
                    Portfolio risk metrics
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                    <strong>Detects</strong><br/>
                    Statistical anomalies
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📰</div>
                    <strong>Explains</strong><br/>
                    Events with news citations
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
                    <strong>Forecasts</strong><br/>
                    Volatility with ML
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; 
                            border: 2px solid rgba(255,100,100,0.3);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">❌</div>
                    <strong>Never</strong><br/>
                    Places orders
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; 
                            border: 2px solid rgba(255,100,100,0.3);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚫</div>
                    <strong>Never</strong><br/>
                    Issues buy/sell directives
                </div>
            </div>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 2rem 0;">
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 0;">
                <strong>⚠️ Disclaimer:</strong> For informational purposes only. Not investment advice.<br/>
                Consult a qualified financial advisor before making investment decisions.
            </p>
            <p style="margin-top: 1rem; color: rgba(255,255,255,0.7);">
                Built with ❤️ using Gradio, Gemini, and open-source ML
            </p>
        </div>
        """)
    
    return app


def save_offline_snapshot(results, filepath=OFFLINE_DATA_PATH):
    """Save analysis results as Parquet snapshot for offline mode."""
    try:
        # Convert results to DataFrame
        snapshot = pd.DataFrame([results])
        snapshot.to_parquet(filepath)
        print(f"✓ Saved offline snapshot to {filepath}")
    except Exception as e:
        print(f"✗ Failed to save snapshot: {e}")


def load_offline_analysis(filepath=OFFLINE_DATA_PATH):
    """Load frozen analysis from Parquet."""
    try:
        snapshot = pd.read_parquet(filepath)
        results = snapshot.iloc[0].to_dict()
        print("✓ Loaded offline snapshot")
        return results
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to load offline snapshot: {e}"
        }


def main():
    """Main entry point."""
    global OFFLINE_MODE
    
    # Parse arguments
    parser = argparse.ArgumentParser(description="Portfolio Monitoring Agent")
    parser.add_argument("--offline", action="store_true", help="Run in offline mode (frozen data)")
    parser.add_argument("--port", type=int, default=7860, help="Port to run on (default: 7860)")
    parser.add_argument("--share", action="store_true", help="Create public link")
    args = parser.parse_args()
    
    OFFLINE_MODE = args.offline
    
    if OFFLINE_MODE:
        print("=" * 60)
        print("OFFLINE MODE")
        print("=" * 60)
        print(f"Using frozen data from: {OFFLINE_DATA_PATH}")
        print("No live API calls will be made")
        print("=" * 60)
    
    # Build and launch app
    app = build_app()
    
    print("\n" + "=" * 60)
    print("Portfolio Monitoring Agent - Gradio Interface")
    print("=" * 60)
    print(f"Model: {config.get_primary_model()['name']}")
    print(f"Port: {args.port}")
    print(f"Offline Mode: {OFFLINE_MODE}")
    print("=" * 60)
    
    # Hugging Face Spaces sets these automatically
    app.launch(
        server_name="0.0.0.0",
        server_port=args.port if args else 7860,
        share=args.share if args else False
    )


if __name__ == "__main__":
    if not GRADIO_AVAILABLE:
        print("ERROR: Gradio not installed")
        print("Install with: pip install gradio plotly")
        sys.exit(1)
    
    main()
