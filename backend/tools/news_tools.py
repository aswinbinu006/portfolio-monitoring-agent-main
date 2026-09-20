"""
News retrieval tools for agents.
"""
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from data.news import search_ticker_news, find_cause_for_event, format_news_citation


def search_ticker_news_tool(
    ticker: str,
    company_name: str = "",
    max_results: int = 5
) -> str:
    """
    Search recent news for a specific stock ticker.
    
    Args:
        ticker: Stock ticker symbol (e.g., "RELIANCE.NS")
        company_name: Company name for better search results (optional)
        max_results: Maximum number of articles to return (default 5)
    
    Returns:
        Formatted string with news articles and citations
    """
    try:
        results = search_ticker_news(
            ticker=ticker,
            company_name=company_name if company_name else None,
            max_results=max_results,
            days_back=7
        )
        
        if not results:
            return f"No recent news found for {ticker}"
        
        output = []
        output.append(f"Found {len(results)} recent news articles for {ticker}:\n")
        
        for i, article in enumerate(results, 1):
            citation = format_news_citation(article)
            snippet = article.get('content', article.get('snippet', ''))[:200]
            
            output.append(f"\n{i}. {citation}")
            if snippet:
                output.append(f"   Snippet: {snippet}...")
        
        return "\n".join(output)
    
    except Exception as e:
        return f"Error searching news: {str(e)}"


def find_event_cause_tool(
    ticker: str,
    event_date: str,
    event_description: str,
    company_name: str = ""
) -> str:
    """
    Find news that may explain a specific market event.
    
    Args:
        ticker: Stock ticker symbol
        event_date: Date of event in YYYY-MM-DD format
        event_description: Description of the event (e.g., "5% drop", "high volatility")
        company_name: Company name (optional)
    
    Returns:
        Formatted explanation with news citation or "unexplained" if no cause found
    """
    try:
        # Parse date
        try:
            event_dt = datetime.fromisoformat(event_date)
        except:
            return f"Error: Invalid date format '{event_date}'. Use YYYY-MM-DD."
        
        result = find_cause_for_event(
            ticker=ticker,
            event_date=event_dt,
            event_description=event_description,
            company_name=company_name if company_name else None,
            search_window_days=3
        )
        
        if not result:
            return f"Unexplained move — no public cause found for {ticker} on {event_date}"
        
        citation = format_news_citation(result)
        content = result.get('content', result.get('snippet', ''))[:300]
        
        output = []
        output.append(f"Found probable cause for {ticker} event on {event_date}:")
        output.append(f"\n{citation}")
        output.append(f"\nRelevant content: {content}...")
        output.append(f"\nProximity score: {result.get('proximity_score', 0):.2f}")
        
        return "\n".join(output)
    
    except Exception as e:
        return f"Error finding event cause: {str(e)}"


__all__ = ['search_ticker_news_tool', 'find_event_cause_tool']
