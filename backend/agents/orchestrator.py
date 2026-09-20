"""
Orchestrator - coordinates all specialist agents in the monitoring workflow.

Workflow:
1. Market Agent: Fetch data
2. Risk Agent: Calculate metrics (deterministic)
3. Anomaly Agent: Stage 1 detection (deterministic)
4. News Agent: Stage 2 - explain flagged events (LLM with tools)
5. Rebalance Agent: Check drift
6. ML Agent: Forecast (Phase 5)
7. Writer Agent: Generate briefing (LLM, zero tools)
"""
import sys
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
import uuid

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.portfolio import Portfolio
from memory.store import get_memory_store
from agents.market_agent import MarketAgent
from agents.risk_agent import RiskAgent
from agents.anomaly_agent import AnomalyAgent
from agents.news_agent import NewsAgent
from agents.rebalance_agent import RebalanceAgent
from agents.ml_agent import MLAgent
from agents.writer_agent import WriterAgent


class Orchestrator:
    """
    Main orchestrator coordinating all specialist agents.
    
    Implements the two-stage detection model:
    - Stage 1: Deterministic detection (no LLM, no network)
    - Stage 2: LLM-based explanation for flagged events only
    """
    
    def __init__(self, session_id: Optional[str] = None):
        """
        Initialize orchestrator.
        
        Args:
            session_id: Unique session ID (auto-generated if None)
        """
        if session_id is None:
            session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        self.session_id = session_id
        self.memory = get_memory_store()
        
        # Initialize all specialist agents
        self.market_agent = MarketAgent(session_id)
        self.risk_agent = RiskAgent(session_id)
        self.anomaly_agent = AnomalyAgent(session_id)
        self.news_agent = NewsAgent(session_id)
        self.rebalance_agent = RebalanceAgent(session_id)
        self.ml_agent = MLAgent(session_id)
        self.writer_agent = WriterAgent(session_id)
        
        # Execution log
        self.execution_log = []
    
    def run_full_analysis(
        self,
        portfolio: Portfolio,
        days: int = 90,
        mandate: str = "balanced",
        drawdown_tolerance: float = -0.15
    ) -> Dict:
        """
        Run complete portfolio monitoring workflow.
        
        Args:
            portfolio: Portfolio to analyze
            days: Days of historical data to fetch
            mandate: Investment mandate (conservative/balanced/aggressive)
            drawdown_tolerance: Max acceptable drawdown
        
        Returns:
            Dict with complete analysis results and briefing
        """
        self._log(f"Starting analysis for session {self.session_id}")
        
        # Create session in memory
        self.memory.create_session(self.session_id, portfolio.tickers)
        
        try:
            # Step 1: Market Agent - Fetch data
            self._log("Step 1: Fetching market data...")
            market_result = self.market_agent.update_portfolio_prices(portfolio, days)
            
            if market_result["status"] != "success":
                return {
                    "status": "error",
                    "step": "market_data",
                    "error": market_result.get("message", "Failed to fetch data")
                }
            
            # Step 2: Risk Agent - Calculate metrics
            self._log("Step 2: Calculating risk metrics...")
            risk_result = self.risk_agent.calculate_metrics(
                portfolio,
                benchmark_ticker=portfolio.benchmark_ticker
            )
            
            metrics = risk_result["metrics"]
            
            # Step 3: Anomaly Agent - Stage 1 detection (deterministic)
            self._log("Step 3: Running Stage 1 anomaly detection...")
            anomaly_result = self.anomaly_agent.detect_anomalies(
                portfolio,
                max_drawdown=metrics.max_drawdown,
                drawdown_tolerance=drawdown_tolerance
            )
            
            anomalies = anomaly_result["anomalies"]
            self._log(f"Detected {len(anomalies)} potential anomalies")
            
            # Step 4: News Agent - Stage 2 explanation (LLM + tools, only for flagged events)
            self._log("Step 4: Analyzing flagged events with news agent...")
            news_analyses = []
            
            for anomaly_data in anomalies:
                raw_event = anomaly_data["raw_event"]
                
                # Skip if not high priority
                if not self.anomaly_agent.should_alert(raw_event):
                    continue
                
                # Get company name from fundamentals (cached)
                company_name = None
                # In production, would fetch from cache
                
                # Analyze event with news agent
                analysis = self.news_agent.analyze_event(
                    ticker=raw_event.ticker,
                    event_date=raw_event.date,
                    event_description="high_volatility" if abs(raw_event.z_score) > 2 else "unusual_move",
                    z_score=raw_event.z_score,
                    return_value=raw_event.return_value,
                    company_name=company_name
                )
                
                news_analyses.append(analysis)
            
            self._log(f"Completed {len(news_analyses)} event analyses")
            
            # Step 5: Rebalance Agent - Check drift
            self._log("Step 5: Checking portfolio drift...")
            drift_result = None
            if portfolio.target_weights:
                current_weights = portfolio.get_weights()
                drift_result = self.rebalance_agent.check_drift(
                    current_weights,
                    portfolio.target_weights
                )
            
            # Step 6: ML Agent - Forecast (Phase 5, placeholder for now)
            self._log("Step 6: ML forecasting (Phase 5)...")
            ml_result = self.ml_agent.forecast_volatility(portfolio)
            
            # Step 7: Writer Agent - Generate briefing
            self._log("Step 7: Generating briefing...")
            
            portfolio_summary = {
                "holdings_count": len(portfolio.holdings),
                "date_range": f"{portfolio.prices.index[0].strftime('%Y-%m-%d')} to {portfolio.prices.index[-1].strftime('%Y-%m-%d')}",
                "current_weights": portfolio.get_weights()
            }
            
            briefing = self.writer_agent.generate_briefing(
                portfolio_summary=portfolio_summary,
                risk_metrics=risk_result,
                anomalies=anomalies,
                news_analyses=news_analyses,
                mandate=mandate
            )
            
            # Update session
            self.memory.update_session(
                self.session_id,
                anomalies_detected=len(anomalies),
                status="completed"
            )
            
            self._log("Analysis complete!")
            
            return {
                "status": "success",
                "session_id": self.session_id,
                "risk_metrics": risk_result,
                "anomalies": anomalies,
                "news_analyses": news_analyses,
                "drift_analysis": drift_result,
                "ml_forecast": ml_result,
                "briefing": briefing,
                "execution_log": self.execution_log
            }
        
        except Exception as e:
            self._log(f"ERROR: {str(e)}")
            self.memory.update_session(self.session_id, status="failed")
            
            return {
                "status": "error",
                "session_id": self.session_id,
                "error": str(e),
                "execution_log": self.execution_log
            }
    
    def _log(self, message: str):
        """Add entry to execution log."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "message": message
        }
        self.execution_log.append(entry)
        print(f"[{entry['timestamp']}] {message}")
    
    def get_session_trace(self) -> Dict:
        """Get detailed execution trace from memory."""
        return self.memory.get_session_trace(self.session_id)


if __name__ == "__main__":
    print("Orchestrator - coordinates all specialist agents")
    print("\nWorkflow:")
    print("1. Market Agent → Fetch data")
    print("2. Risk Agent → Calculate metrics (deterministic)")
    print("3. Anomaly Agent → Stage 1 detection (deterministic)")
    print("4. News Agent → Stage 2 explanation (LLM for flagged events only)")
    print("5. Rebalance Agent → Check drift")
    print("6. ML Agent → Forecast (Phase 5)")
    print("7. Writer Agent → Generate briefing (LLM, zero tools)")
    
    print("\nTwo-stage model ensures LLM only processes genuinely unusual events")
