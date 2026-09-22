"""
Multi-Agent Orchestrator for Investment Portfolio Monitoring.
Coordinates 7 specialist agents using LangGraph state machine orchestration:

Agentic Pipeline Workflow:
1. Market Agent    → Fetches historical & live price feeds, volume, and momentum.
2. Risk Agent      → Quantifies portfolio drawdown vs. mandate (conservative/balanced/aggressive).
3. Anomaly Agent   → Flags statistical return shocks & volatility outliers.
4. News Agent      → Performs real-time web search to explain WHY anomalies happened.
5. Rebalance Agent → Evaluates asset allocation drift against target weights.
6. ML Agent        → Estimates forward volatility trajectory to anticipate regime shifts.
7. Writer Agent    → LLM Synthesis Centerpiece: consolidates all agent findings into an executive memo.
"""
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.core.portfolio import Portfolio
from backend.agents.market_agent import MarketAgent
from backend.agents.risk_agent import RiskAgent
from backend.agents.anomaly_agent import AnomalyAgent
from backend.agents.news_agent import NewsAgent
from backend.agents.rebalance_agent import RebalanceAgent
from backend.agents.ml_agent import MLAgent
from backend.agents.writer_agent import WriterAgent

try:
    from backend.graph.langgraph_flow import run_portfolio_monitoring_workflow, LANGGRAPH_AVAILABLE
except ImportError:
    LANGGRAPH_AVAILABLE = False


class Orchestrator:
    """
    Coordinates the 7 specialist agents in the portfolio monitoring cycle.
    Supports native LangGraph StateGraph execution with sequential fallback.
    """

    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        self.market_agent = MarketAgent(self.session_id)
        self.risk_agent = RiskAgent(self.session_id)
        self.anomaly_agent = AnomalyAgent(self.session_id)
        self.news_agent = NewsAgent(self.session_id)
        self.rebalance_agent = RebalanceAgent(self.session_id)
        self.ml_agent = MLAgent(self.session_id)
        self.writer_agent = WriterAgent(self.session_id)
        self.execution_log: List[Dict[str, str]] = []

    def _log(self, message: str):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "message": message
        }
        self.execution_log.append(entry)
        print(f"[{entry['timestamp']}] [Orchestrator] {message}")

    def run_full_analysis(
        self,
        portfolio: Portfolio,
        days: int = 90,
        mandate: str = "balanced",
        drawdown_tolerance: float = -0.15
    ) -> Dict[str, Any]:
        """
        Execute the 7-agent monitoring pipeline.
        Tries LangGraph StateGraph first; falls back to explicit sequential execution.
        """
        self._log(f"Initiating multi-agent analysis for mandate='{mandate}', days={days}")

        if LANGGRAPH_AVAILABLE:
            try:
                self._log("Executing pipeline via compiled LangGraph StateGraph...")
                graph_state = run_portfolio_monitoring_workflow(
                    portfolio=portfolio,
                    session_id=self.session_id,
                    mandate=mandate,
                    days=days,
                    drawdown_tolerance=drawdown_tolerance
                )
                
                # Format graph state into unified response contract
                alerts = []
                for a in graph_state.get("anomalies", []):
                    raw = a.get("raw_event")
                    if raw:
                        alerts.append({
                            "ticker": raw.ticker,
                            "date": str(raw.date),
                            "z_score": float(raw.z_score),
                            "return": float(raw.return_value),
                            "trigger_reason": raw.trigger_reason,
                            "explanation": a.get("explanation", f"Flagged on {raw.trigger_reason}")
                        })
                    else:
                        alerts.append(a)

                raw_metrics = graph_state.get("risk_metrics", {}).get("metrics")
                metrics_dict = {}
                if raw_metrics:
                    metrics_dict = {
                        "annualized_volatility": getattr(raw_metrics, "annualized_volatility", 0.15),
                        "max_drawdown": getattr(raw_metrics, "max_drawdown", -0.05),
                        "historical_var_95": getattr(raw_metrics, "var_95", -0.02),
                        "total_return": getattr(raw_metrics, "total_return", 0.0),
                    }

                trace_lines = graph_state.get("execution_log", [])
                trace_str = "\n".join([str(t) for t in trace_lines]) if isinstance(trace_lines, list) else str(trace_lines)

                return {
                    "status": "success",
                    "session_id": self.session_id,
                    "risk_metrics": metrics_dict,
                    "alerts": alerts,
                    "news_analyses": graph_state.get("news_analyses", []),
                    "drift_analysis": graph_state.get("drift_analysis", {}),
                    "forecast": graph_state.get("ml_forecast", {}),
                    "briefing": graph_state.get("briefing", "Briefing generated."),
                    "trace": trace_str,
                    "orchestrator_engine": "LangGraph StateGraph"
                }
            except Exception as e:
                self._log(f"LangGraph execution exception: {e}. Falling back to sequential execution.")

        # Sequential agent pipeline execution fallback
        try:
            # 1. Market Agent
            self._log("Agent 1/7 [MarketAgent]: Fetching market data...")
            market_res = self.market_agent.update_portfolio_prices(portfolio, days)
            if market_res.get("status") != "success":
                raise RuntimeError(market_res.get("message", "Market data fetch failed"))

            # 2. Risk Agent
            self._log("Agent 2/7 [RiskAgent]: Quantifying portfolio risk metrics...")
            risk_res = self.risk_agent.calculate_metrics(portfolio)
            raw_metrics = risk_res.get("metrics")
            max_dd = getattr(raw_metrics, "max_drawdown", -0.05) if raw_metrics else -0.05

            # 3. Anomaly Agent
            self._log("Agent 3/7 [AnomalyAgent]: Detecting statistical return anomalies...")
            anomaly_res = self.anomaly_agent.detect_anomalies(
                portfolio,
                max_drawdown=max_dd,
                drawdown_tolerance=drawdown_tolerance
            )
            anomalies = anomaly_res.get("anomalies", [])

            # 4. News Agent
            self._log(f"Agent 4/7 [NewsAgent]: Investigating {len(anomalies)} flagged events via news search...")
            news_analyses = []
            for anom in anomalies:
                raw = anom.get("raw_event")
                if raw and self.anomaly_agent.should_alert(raw):
                    analysis = self.news_agent.analyze_event(
                        ticker=raw.ticker,
                        event_date=raw.date,
                        event_description="high_volatility" if abs(raw.z_score) > 2 else "unusual_move",
                        z_score=raw.z_score,
                        return_value=raw.return_value,
                    )
                    news_analyses.append(analysis)

            # 5. Rebalance Agent
            self._log("Agent 5/7 [RebalanceAgent]: Checking weight drift against targets...")
            drift_res = {}
            if portfolio.target_weights:
                drift_res = self.rebalance_agent.check_drift(
                    portfolio.get_weights(),
                    portfolio.target_weights
                )

            # 6. ML Agent
            self._log("Agent 6/7 [MLAgent]: Projecting forward volatility forecast...")
            ml_res = self.ml_agent.forecast_volatility(portfolio)

            # 7. Writer Agent (Centerpiece)
            self._log("Agent 7/7 [WriterAgent]: Invoking LLM synthesis for executive briefing...")
            portfolio_summary = {
                "holdings_count": len(portfolio.holdings),
                "current_weights": portfolio.get_weights()
            }
            briefing = self.writer_agent.generate_briefing(
                portfolio_summary=portfolio_summary,
                risk_metrics=risk_res,
                anomalies=anomalies,
                news_analyses=news_analyses,
                mandate=mandate
            )

            metrics_dict = {
                "annualized_volatility": getattr(raw_metrics, "annualized_volatility", 0.15) if raw_metrics else 0.15,
                "max_drawdown": max_dd,
                "historical_var_95": getattr(raw_metrics, "var_95", -0.02) if raw_metrics else -0.02,
                "total_return": getattr(raw_metrics, "total_return", 0.0) if raw_metrics else 0.0,
            }

            alerts = []
            for anom in anomalies:
                raw = anom.get("raw_event")
                if raw:
                    alerts.append({
                        "ticker": raw.ticker,
                        "date": str(raw.date),
                        "z_score": float(raw.z_score),
                        "return": float(raw.return_value),
                        "trigger_reason": raw.trigger_reason,
                        "explanation": anom.get("explanation", f"Flagged on {raw.trigger_reason}")
                    })

            trace_str = "\n".join([f"[{e['timestamp']}] {e['message']}" for e in self.execution_log])

            return {
                "status": "success",
                "session_id": self.session_id,
                "risk_metrics": metrics_dict,
                "alerts": alerts,
                "news_analyses": news_analyses,
                "drift_analysis": drift_res,
                "forecast": ml_res,
                "briefing": briefing,
                "trace": trace_str,
                "orchestrator_engine": "Sequential Pipeline (Fallback)"
            }

        except Exception as e:
            self._log(f"Pipeline error: {str(e)}")
            raise
