"""
LangGraph state machine for portfolio monitoring workflow.
Reimplements the orchestrator workflow as a composable state graph.
"""
import sys
from pathlib import Path
from typing import TypedDict, Annotated, List, Dict
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from langgraph.graph import StateGraph, END
    from langgraph.graph.message import add_messages
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    print("Warning: LangGraph not installed. Install with: pip install langgraph")

try:
    from backend.core.portfolio import Portfolio
    from backend.agents.market_agent import MarketAgent
    from backend.agents.risk_agent import RiskAgent
    from backend.agents.anomaly_agent import AnomalyAgent
    from backend.agents.news_agent import NewsAgent
    from backend.agents.rebalance_agent import RebalanceAgent
    from backend.agents.ml_agent import MLAgent
    from backend.agents.writer_agent import WriterAgent
except ImportError:
    from core.portfolio import Portfolio
    from agents.market_agent import MarketAgent
    from agents.risk_agent import RiskAgent
    from agents.anomaly_agent import AnomalyAgent
    from agents.news_agent import NewsAgent
    from agents.rebalance_agent import RebalanceAgent
    from agents.ml_agent import MLAgent
    from agents.writer_agent import WriterAgent


# Define state schema
class PortfolioMonitoringState(TypedDict):
    """State object passed through the workflow."""
    # Input
    portfolio: Portfolio
    session_id: str
    mandate: str
    days: int
    drawdown_tolerance: float
    
    # Intermediate results
    market_data_fetched: bool
    risk_metrics: Dict
    anomalies: List[Dict]
    news_analyses: List[Dict]
    drift_analysis: Dict
    ml_forecast: Dict
    
    # Output
    briefing: str
    status: str
    error: str
    
    # Logging
    execution_log: Annotated[List[str], add_messages]


def create_initial_state(
    portfolio: Portfolio,
    session_id: str = None,
    mandate: str = "balanced",
    days: int = 90,
    drawdown_tolerance: float = -0.15
) -> PortfolioMonitoringState:
    """Create initial state for workflow."""
    if session_id is None:
        session_id = f"graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    return {
        "portfolio": portfolio,
        "session_id": session_id,
        "mandate": mandate,
        "days": days,
        "drawdown_tolerance": drawdown_tolerance,
        "market_data_fetched": False,
        "risk_metrics": {},
        "anomalies": [],
        "news_analyses": [],
        "drift_analysis": {},
        "ml_forecast": {},
        "briefing": "",
        "status": "running",
        "error": "",
        "execution_log": []
    }


# Node functions
def fetch_market_data(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: Fetch market data."""
    state["execution_log"].append(f"[{datetime.now()}] Fetching market data...")
    
    try:
        agent = MarketAgent(state["session_id"])
        result = agent.update_portfolio_prices(state["portfolio"], state["days"])
        
        if result["status"] == "success":
            state["market_data_fetched"] = True
            state["execution_log"].append(f"[{datetime.now()}] Market data fetched successfully")
        else:
            state["status"] = "error"
            state["error"] = result.get("message", "Failed to fetch market data")
            state["execution_log"].append(f"[{datetime.now()}] ERROR: {state['error']}")
    
    except Exception as e:
        state["status"] = "error"
        state["error"] = str(e)
        state["execution_log"].append(f"[{datetime.now()}] EXCEPTION: {e}")
    
    return state


def calculate_risk_metrics(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: Calculate risk metrics."""
    state["execution_log"].append(f"[{datetime.now()}] Calculating risk metrics...")
    
    try:
        agent = RiskAgent(state["session_id"])
        result = agent.calculate_metrics(state["portfolio"])
        
        state["risk_metrics"] = result
        state["execution_log"].append(f"[{datetime.now()}] Risk metrics calculated")
    
    except Exception as e:
        state["status"] = "error"
        state["error"] = f"Risk calculation failed: {str(e)}"
        state["execution_log"].append(f"[{datetime.now()}] ERROR: {state['error']}")
    
    return state


def detect_anomalies(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: Stage 1 anomaly detection."""
    state["execution_log"].append(f"[{datetime.now()}] Running anomaly detection...")
    
    try:
        agent = AnomalyAgent(state["session_id"])
        metrics = state["risk_metrics"].get("metrics")
        
        if metrics:
            result = agent.detect_anomalies(
                state["portfolio"],
                max_drawdown=metrics.max_drawdown,
                drawdown_tolerance=state["drawdown_tolerance"]
            )
            
            state["anomalies"] = result["anomalies"]
            state["execution_log"].append(
                f"[{datetime.now()}] Detected {len(state['anomalies'])} potential anomalies"
            )
    
    except Exception as e:
        state["execution_log"].append(f"[{datetime.now()}] WARNING: Anomaly detection failed: {e}")
        state["anomalies"] = []
    
    return state


def analyze_news(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: Stage 2 news analysis for flagged events."""
    state["execution_log"].append(f"[{datetime.now()}] Analyzing news for flagged events...")
    
    try:
        news_agent = NewsAgent(state["session_id"])
        anomaly_agent = AnomalyAgent(state["session_id"])
        analyses = []
        
        for anomaly_data in state["anomalies"]:
            raw_event = anomaly_data.get("raw_event")
            if not raw_event:
                continue
            
            # Only analyze high-priority events
            if anomaly_agent.should_alert(raw_event):
                analysis = news_agent.analyze_event(
                    ticker=raw_event.ticker,
                    event_date=raw_event.date,
                    event_description="high_volatility" if abs(raw_event.z_score) > 2 else "unusual_move",
                    z_score=raw_event.z_score,
                    return_value=raw_event.return_value
                )
                analyses.append(analysis)
        
        state["news_analyses"] = analyses
        state["execution_log"].append(f"[{datetime.now()}] Completed {len(analyses)} event analyses")
    
    except Exception as e:
        state["execution_log"].append(f"[{datetime.now()}] WARNING: News analysis failed: {e}")
        state["news_analyses"] = []
    
    return state


def check_drift(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: Check portfolio drift."""
    state["execution_log"].append(f"[{datetime.now()}] Checking portfolio drift...")
    
    try:
        agent = RebalanceAgent(state["session_id"])
        
        if state["portfolio"].target_weights:
            current_weights = state["portfolio"].get_weights()
            result = agent.check_drift(current_weights, state["portfolio"].target_weights)
            state["drift_analysis"] = result
            state["execution_log"].append(f"[{datetime.now()}] Drift check: {result['status']}")
        else:
            state["drift_analysis"] = {"status": "no_targets", "message": "No target weights defined"}
            state["execution_log"].append(f"[{datetime.now()}] No target weights defined")
    
    except Exception as e:
        state["execution_log"].append(f"[{datetime.now()}] WARNING: Drift check failed: {e}")
        state["drift_analysis"] = {}
    
    return state


def forecast_volatility(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: ML volatility forecasting."""
    state["execution_log"].append(f"[{datetime.now()}] Running ML forecasting...")
    
    try:
        agent = MLAgent(state["session_id"])
        result = agent.forecast_volatility(state["portfolio"])
        state["ml_forecast"] = result
        
        if result.get("status") == "success":
            state["execution_log"].append(
                f"[{datetime.now()}] Forecast complete: Best model = {result.get('best_model')}"
            )
        else:
            state["execution_log"].append(
                f"[{datetime.now()}] Forecast: {result.get('message', 'Not available')}"
            )
    
    except Exception as e:
        state["execution_log"].append(f"[{datetime.now()}] WARNING: ML forecast failed: {e}")
        state["ml_forecast"] = {"status": "error", "message": str(e)}
    
    return state


def generate_briefing(state: PortfolioMonitoringState) -> PortfolioMonitoringState:
    """Node: Generate final briefing."""
    state["execution_log"].append(f"[{datetime.now()}] Generating briefing...")
    
    try:
        agent = WriterAgent(state["session_id"])
        
        portfolio_summary = {
            "holdings_count": len(state["portfolio"].holdings),
            "date_range": f"{state['portfolio'].prices.index[0].strftime('%Y-%m-%d')} to {state['portfolio'].prices.index[-1].strftime('%Y-%m-%d')}",
            "current_weights": state["portfolio"].get_weights()
        }
        
        briefing = agent.generate_briefing(
            portfolio_summary=portfolio_summary,
            risk_metrics=state["risk_metrics"],
            anomalies=state["anomalies"],
            news_analyses=state["news_analyses"],
            mandate=state["mandate"]
        )
        
        state["briefing"] = briefing
        state["status"] = "completed"
        state["execution_log"].append(f"[{datetime.now()}] Briefing generated successfully")
    
    except Exception as e:
        state["status"] = "error"
        state["error"] = f"Briefing generation failed: {str(e)}"
        state["execution_log"].append(f"[{datetime.now()}] ERROR: {state['error']}")
    
    return state


def check_error_condition(state: PortfolioMonitoringState) -> str:
    """Conditional edge: Check if error occurred."""
    if state["status"] == "error":
        return "error"
    return "continue"


def build_workflow_graph() -> StateGraph:
    """
    Build the LangGraph workflow.
    
    Flow:
    START → fetch_market_data → calculate_risk_metrics → detect_anomalies → 
    analyze_news → check_drift → forecast_volatility → generate_briefing → END
    
    Error handling at each step.
    """
    if not LANGGRAPH_AVAILABLE:
        raise ImportError("LangGraph not available. Install with: pip install langgraph")
    
    # Create graph
    workflow = StateGraph(PortfolioMonitoringState)
    
    # Add nodes
    workflow.add_node("fetch_market_data", fetch_market_data)
    workflow.add_node("calculate_risk_metrics", calculate_risk_metrics)
    workflow.add_node("detect_anomalies", detect_anomalies)
    workflow.add_node("analyze_news", analyze_news)
    workflow.add_node("check_drift", check_drift)
    workflow.add_node("forecast_volatility", forecast_volatility)
    workflow.add_node("generate_briefing", generate_briefing)
    
    # Add edges
    workflow.set_entry_point("fetch_market_data")
    
    workflow.add_conditional_edges(
        "fetch_market_data",
        check_error_condition,
        {
            "continue": "calculate_risk_metrics",
            "error": END
        }
    )
    
    workflow.add_conditional_edges(
        "calculate_risk_metrics",
        check_error_condition,
        {
            "continue": "detect_anomalies",
            "error": END
        }
    )
    
    workflow.add_edge("detect_anomalies", "analyze_news")
    workflow.add_edge("analyze_news", "check_drift")
    workflow.add_edge("check_drift", "forecast_volatility")
    workflow.add_edge("forecast_volatility", "generate_briefing")
    
    workflow.add_conditional_edges(
        "generate_briefing",
        check_error_condition,
        {
            "continue": END,
            "error": END
        }
    )
    
    return workflow.compile()


# Convenience function
def run_portfolio_monitoring_workflow(
    portfolio: Portfolio,
    session_id: str = None,
    mandate: str = "balanced",
    days: int = 90,
    drawdown_tolerance: float = -0.15
) -> Dict:
    """
    Run complete portfolio monitoring workflow using LangGraph.
    
    Args:
        portfolio: Portfolio to analyze
        session_id: Unique session identifier
        mandate: Investment mandate
        days: Days of historical data
        drawdown_tolerance: Max acceptable drawdown
    
    Returns:
        Final state dict with all results
    """
    # Create initial state
    initial_state = create_initial_state(
        portfolio=portfolio,
        session_id=session_id,
        mandate=mandate,
        days=days,
        drawdown_tolerance=drawdown_tolerance
    )
    
    # Build and run workflow
    graph = build_workflow_graph()
    final_state = graph.invoke(initial_state)
    
    return final_state


if __name__ == "__main__":
    print("LangGraph Workflow for Portfolio Monitoring")
    print("=" * 60)
    
    if not LANGGRAPH_AVAILABLE:
        print("ERROR: LangGraph not installed")
        print("Install with: pip install langgraph")
    else:
        print("✓ LangGraph available")
        print("\nWorkflow nodes:")
        print("  1. fetch_market_data")
        print("  2. calculate_risk_metrics")
        print("  3. detect_anomalies")
        print("  4. analyze_news")
        print("  5. check_drift")
        print("  6. forecast_volatility")
        print("  7. generate_briefing")
        
        print("\nConditional edges handle errors at each step")
        print("State passed through entire workflow")
