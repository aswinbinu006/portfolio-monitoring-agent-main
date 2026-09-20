"""
Writer Agent - generates final briefing from structured findings.
Receives only computed data and cited sources - has zero tools.
"""
import sys
from pathlib import Path
from typing import Dict, List
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))


class WriterAgent:
    """
    Specialist agent for briefing generation.
    
    CRITICAL: This agent has NO TOOLS. It receives structured findings
    and generates language output. It cannot fabricate data.
    """
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "WriterAgent"
        self.description = "Generates investor briefings from structured findings"
        self.tools = []  # Explicitly no tools
    
    def generate_briefing(
        self,
        portfolio_summary: Dict,
        risk_metrics: Dict,
        anomalies: List[Dict],
        news_analyses: List[Dict],
        mandate: str = "balanced"
    ) -> str:
        """
        Generate investor briefing from structured findings.
        
        Args:
            portfolio_summary: Portfolio stats (value, holdings count, etc.)
            risk_metrics: Risk metrics with interpretations
            anomalies: List of detected anomalies
            news_analyses: List of news analysis results
            mandate: Investment mandate (conservative/balanced/aggressive)
        
        Returns:
            Formatted briefing text
        """
        sections = []
        
        # Header
        sections.append("=" * 70)
        sections.append("PORTFOLIO MONITORING BRIEFING")
        sections.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        sections.append(f"Mandate: {mandate.upper()}")
        sections.append("=" * 70)
        
        # Executive Summary
        sections.append("\n## EXECUTIVE SUMMARY\n")
        sections.append(self._generate_executive_summary(
            portfolio_summary,
            risk_metrics,
            len(anomalies)
        ))
        
        # Risk Assessment
        sections.append("\n## RISK ASSESSMENT\n")
        sections.append(self._generate_risk_section(risk_metrics))
        
        # Alerts & Events
        if anomalies:
            sections.append("\n## ALERTS & MATERIAL EVENTS\n")
            sections.append(self._generate_alerts_section(anomalies, news_analyses))
        else:
            sections.append("\n## ALERTS & MATERIAL EVENTS\n")
            sections.append("No material risk events detected in the monitoring period.")
        
        # Portfolio Status
        sections.append("\n## PORTFOLIO STATUS\n")
        sections.append(self._generate_portfolio_section(portfolio_summary))
        
        # Footer
        sections.append("\n" + "=" * 70)
        sections.append("DISCLAIMER")
        sections.append("=" * 70)
        sections.append("This briefing is for informational purposes only.")
        sections.append("It does not constitute investment advice.")
        sections.append("Consult a qualified financial advisor before making decisions.")
        
        return "\n".join(sections)
    
    def _generate_executive_summary(
        self,
        portfolio_summary: Dict,
        risk_metrics: Dict,
        anomaly_count: int
    ) -> str:
        """Generate executive summary section."""
        lines = []
        
        # Portfolio value
        current_value = risk_metrics.get("metrics", {}).current_value
        if current_value:
            lines.append(f"Portfolio Value: {current_value:,.2f}")
        
        # Holdings
        holdings_count = portfolio_summary.get("holdings_count", 0)
        lines.append(f"Holdings: {holdings_count} positions")
        
        # Risk overview
        metrics = risk_metrics.get("metrics")
        if metrics:
            lines.append(f"Volatility: {metrics.annualized_volatility:.1%} (annualized)")
            lines.append(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
            lines.append(f"Max Drawdown: {metrics.max_drawdown:.1%}")
        
        # Alerts
        if anomaly_count > 0:
            lines.append(f"\n⚠️  {anomaly_count} material event(s) detected requiring attention")
        else:
            lines.append("\n✓ No material risk events detected")
        
        return "\n".join(lines)
    
    def _generate_risk_section(self, risk_metrics: Dict) -> str:
        """Generate risk assessment section."""
        lines = []
        
        metrics = risk_metrics.get("metrics")
        interpretations = risk_metrics.get("interpretation", {})
        
        if not metrics:
            return "Risk metrics unavailable"
        
        # Volatility
        lines.append(f"**Volatility**: {metrics.annualized_volatility:.2%}")
        if "volatility" in interpretations:
            lines.append(f"  → {interpretations['volatility']}")
        
        # Risk-adjusted returns
        lines.append(f"\n**Sharpe Ratio**: {metrics.sharpe_ratio:.2f}")
        if "sharpe" in interpretations:
            lines.append(f"  → {interpretations['sharpe']}")
        
        lines.append(f"\n**Sortino Ratio**: {metrics.sortino_ratio:.2f}")
        
        # Downside risk
        lines.append(f"\n**Maximum Drawdown**: {metrics.max_drawdown:.2%}")
        if "drawdown" in interpretations:
            lines.append(f"  → {interpretations['drawdown']}")
        
        if metrics.max_drawdown_date:
            lines.append(f"  Occurred: {metrics.max_drawdown_date.strftime('%Y-%m-%d')}")
        
        # Value at Risk
        lines.append(f"\n**Value at Risk (95%)**: {metrics.var_95:.2%}")
        lines.append(f"**CVaR (95%)**: {metrics.cvar_95:.2%}")
        
        # Concentration
        lines.append(f"\n**Concentration (HHI)**: {metrics.hhi:.3f}")
        lines.append(f"**Effective Holdings**: {metrics.effective_holdings:.1f}")
        if "concentration" in interpretations:
            lines.append(f"  → {interpretations['concentration']}")
        
        # Market relation
        if metrics.beta is not None:
            lines.append(f"\n**Beta**: {metrics.beta:.2f}")
            if "beta" in interpretations:
                lines.append(f"  → {interpretations['beta']}")
        
        return "\n".join(lines)
    
    def _generate_alerts_section(
        self,
        anomalies: List[Dict],
        news_analyses: List[Dict]
    ) -> str:
        """Generate alerts section with news attributions."""
        lines = []
        
        for i, anomaly in enumerate(anomalies, 1):
            lines.append(f"\n### Alert {i}: {anomaly['ticker']}")
            lines.append(f"Date: {anomaly['date']}")
            lines.append(f"Return: {anomaly['return']}")
            lines.append(f"Z-score: {anomaly['z_score']}")
            lines.append(f"Trigger: {anomaly['trigger']}")
            
            # Find corresponding news analysis
            news_found = False
            for news in news_analyses:
                if news.get("ticker") == anomaly["ticker"]:
                    if news.get("status") == "explained":
                        lines.append(f"\n**Probable Cause**: {news.get('explanation', 'See news citation')}")
                        if news.get("news_title"):
                            lines.append(f"Source: {news['news_title']}")
                        if news.get("news_url"):
                            lines.append(f"URL: {news['news_url']}")
                        news_found = True
                    elif news.get("status") == "unexplained":
                        lines.append("\n**Cause**: Unexplained move — no public cause found")
                        news_found = True
                    break
            
            if not news_found:
                lines.append("\n**Cause**: Analysis pending")
        
        return "\n".join(lines)
    
    def _generate_portfolio_section(self, portfolio_summary: Dict) -> str:
        """Generate portfolio status section."""
        lines = []
        
        lines.append(f"Total Holdings: {portfolio_summary.get('holdings_count', 'N/A')}")
        lines.append(f"Date Range: {portfolio_summary.get('date_range', 'N/A')}")
        
        # Current weights (if provided)
        if "current_weights" in portfolio_summary:
            lines.append("\n**Current Allocation**:")
            weights = portfolio_summary["current_weights"]
            for ticker, weight in sorted(weights.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"  {ticker}: {weight:.1%}")
        
        return "\n".join(lines)


if __name__ == "__main__":
    print("Writer Agent - generates briefings from structured data only")
    print("Has zero tools - cannot fabricate data or make network calls")
