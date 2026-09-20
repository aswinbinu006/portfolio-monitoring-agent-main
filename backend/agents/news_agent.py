"""
News Agent - searches and explains market events using news sources.
Uses OpenAI Agents SDK with LiteLLM integration.
"""
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from memory.store import get_memory_store
from tools.news_tools import search_ticker_news_tool, find_event_cause_tool
from tools.market_tools import get_fundamentals_tool

# Note: The openai-agents package structure may vary by version
# This is a placeholder implementation that follows the general pattern
# Actual import paths should be verified against installed version

try:
    # Try to import from openai-agents
    from openai import OpenAI
    OPENAI_AGENTS_AVAILABLE = True
except ImportError:
    OPENAI_AGENTS_AVAILABLE = False
    print("Warning: openai-agents not installed. Agent functionality will be limited.")


class NewsAgent:
    """
    Specialist agent for news retrieval and event explanation.
    
    Capabilities:
    - Search recent news for tickers
    - Find probable causes for market events
    - Check for duplicate alerts (7-day window)
    - Format news citations
    """
    
    def __init__(self, session_id: str = "default"):
        """
        Initialize news agent.
        
        Args:
            session_id: Session identifier for memory tracking
        """
        self.session_id = session_id
        self.memory = get_memory_store()
        self.model_config = config.get_primary_model()
        
        # Agent metadata
        self.name = "NewsAgent"
        self.description = "Searches news and explains market events"
        
        # Available tools
        self.tools = [
            {
                "name": "search_ticker_news",
                "description": "Search recent news for a stock ticker",
                "function": search_ticker_news_tool
            },
            {
                "name": "find_event_cause",
                "description": "Find news that explains a specific market event",
                "function": find_event_cause_tool
            },
            {
                "name": "get_fundamentals",
                "description": "Get company fundamental information",
                "function": get_fundamentals_tool
            }
        ]
        
        # System prompt
        self.system_prompt = """You are a financial news analyst specializing in explaining market events.

Your responsibilities:
1. Search for relevant news when a stock shows unusual behavior
2. Find and cite specific news articles that explain events
3. If no clear cause is found, explicitly state "unexplained move — no public cause found"
4. Always cite sources with publication date and URL
5. Never fabricate or speculate on causes without evidence

Guidelines:
- Be factual and precise
- Always provide citations for claims
- Distinguish between correlation and causation
- If multiple factors are at play, list them all
- Format: "According to [Source], published [Date]: [Summary]"

You have access to:
- Tavily (AI-optimized news search)
- Marketaux (financial news API)
- Company fundamentals data

Never issue buy/sell advice. Your role is explanation only."""
    
    def analyze_event(
        self,
        ticker: str,
        event_date: datetime,
        event_description: str,
        z_score: float,
        return_value: float,
        company_name: Optional[str] = None
    ) -> Dict:
        """
        Analyze a market event and find probable cause.
        
        Args:
            ticker: Stock ticker
            event_date: Date of event
            event_description: Description (e.g., "high volatility")
            z_score: Statistical z-score
            return_value: Return value
            company_name: Company name (optional)
        
        Returns:
            Dict with analysis results and citations
        """
        # Check for duplicate alert
        cause_key = f"{event_description}_{z_score:.1f}"
        is_duplicate = self.memory.check_duplicate_alert(
            ticker=ticker,
            cause=cause_key,
            days_window=config.ALERT_DEDUP_DAYS
        )
        
        if is_duplicate:
            return {
                "status": "suppressed",
                "reason": "Duplicate alert within 7-day window",
                "ticker": ticker
            }
        
        # Get fundamentals for context
        if not company_name:
            fund = get_fundamentals_tool(ticker)
            # Extract company name from fundamentals response
            for line in fund.split('\n'):
                if 'Company:' in line:
                    company_name = line.split('Company:')[1].strip()
                    break
        
        # Search for event cause
        date_str = event_date.strftime('%Y-%m-%d')
        cause_result = find_event_cause_tool(
            ticker=ticker,
            event_date=date_str,
            event_description=event_description,
            company_name=company_name or ""
        )
        
        # Parse result
        if "unexplained move" in cause_result.lower():
            analysis = {
                "status": "unexplained",
                "ticker": ticker,
                "event_date": date_str,
                "description": event_description,
                "z_score": z_score,
                "return_value": return_value,
                "explanation": cause_result,
                "news_found": False
            }
        else:
            # Extract URL and title from result
            lines = cause_result.split('\n')
            news_url = None
            news_title = None
            
            for line in lines:
                if line.startswith('http'):
                    news_url = line.strip()
                elif '"' in line:
                    # Extract title from citation
                    parts = line.split('"')
                    if len(parts) >= 2:
                        news_title = parts[1]
            
            analysis = {
                "status": "explained",
                "ticker": ticker,
                "event_date": date_str,
                "description": event_description,
                "z_score": z_score,
                "return_value": return_value,
                "explanation": cause_result,
                "news_found": True,
                "news_url": news_url,
                "news_title": news_title
            }
            
            # Store in memory
            self.memory.add_alert(
                ticker=ticker,
                cause=cause_key,
                event_date=event_date,
                z_score=z_score,
                return_value=return_value,
                news_url=news_url,
                news_title=news_title,
                details={"description": event_description}
            )
        
        # Log execution
        tools_used = ["find_event_cause"]
        if company_name is None:
            tools_used.append("get_fundamentals")
        
        self.memory.log_agent_execution(
            session_id=self.session_id,
            agent_name=self.name,
            tools_called=tools_used,
            tokens_used=0,  # TODO: Track actual token usage
            status="success"
        )
        
        return analysis
    
    def search_general_news(self, ticker: str, company_name: Optional[str] = None) -> Dict:
        """
        Search general news for a ticker.
        
        Args:
            ticker: Stock ticker
            company_name: Company name (optional)
        
        Returns:
            Dict with news results
        """
        result = search_ticker_news_tool(
            ticker=ticker,
            company_name=company_name or "",
            max_results=5
        )
        
        self.memory.log_agent_execution(
            session_id=self.session_id,
            agent_name=self.name,
            tools_called=["search_ticker_news"],
            tokens_used=0,
            status="success"
        )
        
        return {
            "status": "success",
            "ticker": ticker,
            "news": result
        }


# Simple function-based interface for backward compatibility
def analyze_news_event(
    ticker: str,
    event_date: datetime,
    event_description: str,
    z_score: float,
    return_value: float,
    company_name: Optional[str] = None,
    session_id: str = "default"
) -> Dict:
    """
    Analyze a market event using the news agent.
    
    Simple function wrapper for the NewsAgent class.
    """
    agent = NewsAgent(session_id=session_id)
    return agent.analyze_event(
        ticker=ticker,
        event_date=event_date,
        event_description=event_description,
        z_score=z_score,
        return_value=return_value,
        company_name=company_name
    )


if __name__ == "__main__":
    # Demo usage
    print("News Agent Demo")
    print("=" * 60)
    
    agent = NewsAgent(session_id="demo_session")
    
    print(f"\nAgent: {agent.name}")
    print(f"Description: {agent.description}")
    print(f"Model: {agent.model_config['name']}")
    print(f"Available tools: {len(agent.tools)}")
    
    # Example: Search news
    print("\n" + "=" * 60)
    print("Searching news for RELIANCE.NS...")
    result = agent.search_general_news("RELIANCE.NS", "Reliance Industries")
    print(result['news'])
    
    # Example: Analyze event (with synthetic data)
    print("\n" + "=" * 60)
    print("Analyzing synthetic event...")
    event_result = agent.analyze_event(
        ticker="RELIANCE.NS",
        event_date=datetime(2024, 1, 15),
        event_description="high_volatility",
        z_score=2.5,
        return_value=0.05,
        company_name="Reliance Industries"
    )
    
    print(f"Status: {event_result['status']}")
    print(f"Explanation: {event_result.get('explanation', 'N/A')}")
