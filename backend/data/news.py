"""
News retrieval from multiple providers with caching.
Primary: Tavily (AI-optimized search)
Secondary: Marketaux (financial news API)

All responses cached to respect rate limits.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from data.cache import get_news_cache


def search_tavily(
    query: str,
    max_results: int = 5,
    days_back: int = 7,
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None
) -> List[Dict]:
    """
    Search news using Tavily API.
    
    Tavily is optimized for AI applications with high-quality results.
    
    Args:
        query: Search query
        max_results: Maximum number of results (default 5)
        days_back: How many days back to search (default 7)
        include_domains: List of domains to include (optional)
        exclude_domains: List of domains to exclude (optional)
    
    Returns:
        List of news articles with title, url, content, published_date, score
    """
    if not config.TAVILY_API_KEY:
        print("Warning: TAVILY_API_KEY not configured")
        return []
    
    # Check cache
    cache = get_news_cache()
    cache_key = f"tavily:{query}:{max_results}:{days_back}"
    cached_results = cache.get(cache_key, ttl=config.CACHE_TTL_NEWS)
    
    if cached_results is not None:
        return cached_results
    
    try:
        from tavily import TavilyClient
        
        client = TavilyClient(api_key=config.TAVILY_API_KEY)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Build search params
        search_params = {
            "query": query,
            "max_results": max_results,
            "search_depth": "advanced",  # More comprehensive search
            "include_answer": False,  # We want raw results, not summary
            "include_raw_content": True,  # Get full content
        }
        
        if include_domains:
            search_params["include_domains"] = include_domains
        if exclude_domains:
            search_params["exclude_domains"] = exclude_domains
        
        # Execute search
        response = client.search(**search_params)
        
        # Parse results
        results = []
        for result in response.get("results", []):
            article = {
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "content": result.get("content", ""),
                "raw_content": result.get("raw_content", ""),
                "published_date": result.get("published_date", ""),
                "score": result.get("score", 0.0),
                "source": "tavily"
            }
            results.append(article)
        
        # Cache results
        cache.set(cache_key, results)
        
        return results
    
    except Exception as e:
        print(f"Tavily search error: {e}")
        return []


def search_marketaux(
    query: Optional[str] = None,
    symbols: Optional[List[str]] = None,
    max_results: int = 5,
    days_back: int = 7
) -> List[Dict]:
    """
    Search financial news using Marketaux API.
    
    Args:
        query: Search query (optional)
        symbols: List of stock symbols (optional, e.g., ["AAPL", "TSLA"])
        max_results: Maximum number of results
        days_back: How many days back to search
    
    Returns:
        List of news articles
    """
    if not config.MARKETAUX_API_KEY:
        print("Warning: MARKETAUX_API_KEY not configured")
        return []
    
    # Check cache
    cache = get_news_cache()
    cache_key = f"marketaux:{query}:{symbols}:{max_results}:{days_back}"
    cached_results = cache.get(cache_key, ttl=config.CACHE_TTL_NEWS)
    
    if cached_results is not None:
        return cached_results
    
    try:
        import requests
        
        # Build API request
        url = "https://api.marketaux.com/v1/news/all"
        
        params = {
            "api_token": config.MARKETAUX_API_KEY,
            "limit": max_results,
            "language": "en"
        }
        
        if query:
            params["search"] = query
        
        if symbols:
            # Remove exchange suffixes (.NS, .BO) for API
            clean_symbols = [s.replace(".NS", "").replace(".BO", "") for s in symbols]
            params["symbols"] = ",".join(clean_symbols)
        
        # Calculate date filter
        published_after = datetime.now() - timedelta(days=days_back)
        params["published_after"] = published_after.strftime("%Y-%m-%dT%H:%M:%S")
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Parse results
        results = []
        for article in data.get("data", []):
            result = {
                "title": article.get("title", ""),
                "url": article.get("url", ""),
                "content": article.get("description", ""),
                "snippet": article.get("snippet", ""),
                "published_date": article.get("published_at", ""),
                "entities": article.get("entities", []),
                "source": "marketaux",
                "source_name": article.get("source", "")
            }
            results.append(result)
        
        # Cache results
        cache.set(cache_key, results)
        
        return results
    
    except Exception as e:
        print(f"Marketaux search error: {e}")
        return []


def search_news(
    query: str,
    symbols: Optional[List[str]] = None,
    max_results: int = 5,
    days_back: int = 7,
    providers: List[str] = ["tavily", "marketaux"]
) -> List[Dict]:
    """
    Search news across multiple providers.
    
    Args:
        query: Search query
        symbols: Stock symbols (optional)
        max_results: Max results per provider
        days_back: Days to search back
        providers: List of providers to use (["tavily", "marketaux"])
    
    Returns:
        Combined list of articles from all providers
    """
    all_results = []
    
    if "tavily" in providers and config.TAVILY_API_KEY:
        tavily_results = search_tavily(query, max_results, days_back)
        all_results.extend(tavily_results)
    
    if "marketaux" in providers and config.MARKETAUX_API_KEY:
        marketaux_results = search_marketaux(query, symbols, max_results, days_back)
        all_results.extend(marketaux_results)
    
    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for result in all_results:
        url = result.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_results.append(result)
    
    # Sort by published date (most recent first)
    def get_date(article):
        date_str = article.get("published_date", "")
        if not date_str:
            return datetime.min
        try:
            # Try parsing ISO format
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            return datetime.min
    
    unique_results.sort(key=get_date, reverse=True)
    
    return unique_results[:max_results * len(providers)]


def search_ticker_news(
    ticker: str,
    company_name: Optional[str] = None,
    max_results: int = 5,
    days_back: int = 7
) -> List[Dict]:
    """
    Search news specifically for a ticker.
    
    Combines ticker symbol and company name for better results.
    
    Args:
        ticker: Stock ticker (e.g., "RELIANCE.NS")
        company_name: Company name (optional, e.g., "Reliance Industries")
        max_results: Maximum results
        days_back: Days back to search
    
    Returns:
        List of relevant news articles
    """
    # Build search query
    base_ticker = ticker.replace(".NS", "").replace(".BO", "")
    
    if company_name:
        query = f"{company_name} {base_ticker}"
    else:
        query = base_ticker
    
    # Search with both ticker and company name
    results = search_news(
        query=query,
        symbols=[base_ticker],
        max_results=max_results,
        days_back=days_back
    )
    
    return results


def find_cause_for_event(
    ticker: str,
    event_date: datetime,
    event_description: str,
    company_name: Optional[str] = None,
    search_window_days: int = 3
) -> Optional[Dict]:
    """
    Find news that may explain a market event.
    
    Searches news around the event date for relevant context.
    
    Args:
        ticker: Stock ticker
        event_date: Date of the event
        event_description: Description of event (e.g., "5% drop", "high volatility")
        company_name: Company name (optional)
        search_window_days: Days before/after event to search (default 3)
    
    Returns:
        Dict with best matching article or None if not found
    """
    # Build search query incorporating event
    base_ticker = ticker.replace(".NS", "").replace(".BO", "")
    
    if company_name:
        query = f"{company_name} {base_ticker} {event_description}"
    else:
        query = f"{base_ticker} {event_description}"
    
    # Search around event date
    results = search_news(
        query=query,
        symbols=[base_ticker],
        max_results=10,
        days_back=search_window_days * 2
    )
    
    if not results:
        return None
    
    # Filter to window around event
    def parse_date(date_str):
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            return None
    
    window_start = event_date - timedelta(days=search_window_days)
    window_end = event_date + timedelta(days=search_window_days)
    
    relevant_results = []
    for result in results:
        pub_date = parse_date(result.get("published_date", ""))
        if pub_date and window_start <= pub_date <= window_end:
            # Calculate relevance score based on date proximity
            days_diff = abs((pub_date - event_date).days)
            result["proximity_score"] = 1.0 / (1.0 + days_diff)
            relevant_results.append(result)
    
    if not relevant_results:
        return None
    
    # Return most relevant (by Tavily score and date proximity)
    relevant_results.sort(
        key=lambda x: (x.get("score", 0) * x.get("proximity_score", 0)),
        reverse=True
    )
    
    best_match = relevant_results[0]
    best_match["explanation"] = (
        f"Found news from {best_match.get('source_name', best_match.get('source'))} "
        f"published {parse_date(best_match['published_date']).strftime('%Y-%m-%d')}"
    )
    
    return best_match


def format_news_citation(article: Dict) -> str:
    """
    Format a news article as a citation.
    
    Args:
        article: Article dict
    
    Returns:
        Formatted citation string
    """
    title = article.get("title", "Untitled")
    url = article.get("url", "")
    source = article.get("source_name", article.get("source", "Unknown"))
    date = article.get("published_date", "")
    
    if date:
        try:
            date_obj = datetime.fromisoformat(date.replace("Z", "+00:00"))
            date_str = date_obj.strftime("%B %d, %Y")
        except:
            date_str = date
    else:
        date_str = "Date unknown"
    
    citation = f'"{title}" - {source}, {date_str}'
    if url:
        citation += f"\n{url}"
    
    return citation


if __name__ == "__main__":
    # Demo usage
    print("Searching news about Indian markets...")
    
    # General search
    results = search_news("Nifty 50 market movement", max_results=3, days_back=7)
    
    print(f"\nFound {len(results)} articles:")
    for i, article in enumerate(results, 1):
        print(f"\n{i}. {article['title']}")
        print(f"   Source: {article.get('source')}")
        print(f"   URL: {article.get('url', 'N/A')}")
        print(f"   Date: {article.get('published_date', 'N/A')}")
    
    # Ticker-specific search
    print("\n" + "="*60)
    print("Searching news for RELIANCE.NS...")
    ticker_results = search_ticker_news("RELIANCE.NS", "Reliance Industries", max_results=2)
    
    for article in ticker_results:
        print("\n" + format_news_citation(article))
