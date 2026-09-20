"""
Market data tools for agents.
"""
import sys
from pathlib import Path
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent.parent))

from data.providers import get_price_change, fetch_fundamentals, get_latest_price


def get_price_change_tool(ticker: str, days: int = 1) -> str:
    """
    Get price change for a ticker over specified period.
    
    Args:
        ticker: Stock ticker symbol
        days: Number of days to look back (default 1)
    
    Returns:
        Formatted string with price change information
    """
    try:
        result = get_price_change(ticker, days)
        
        if not result:
            return f"Unable to retrieve price data for {ticker}"
        
        change_pct = result['change_pct']
        direction = "up" if change_pct > 0 else "down"
        
        output = []
        output.append(f"{ticker} price change over {days} day(s):")
        output.append(f"  Current: {result['current']:.2f}")
        output.append(f"  Previous: {result['previous']:.2f}")
        output.append(f"  Change: {result['change']:+.2f} ({change_pct:+.2f}%)")
        output.append(f"  Direction: {direction}")
        
        return "\n".join(output)
    
    except Exception as e:
        return f"Error retrieving price change: {str(e)}"


def get_fundamentals_tool(ticker: str) -> str:
    """
    Get fundamental company information.
    
    Args:
        ticker: Stock ticker symbol
    
    Returns:
        Formatted string with company fundamentals
    """
    try:
        fund = fetch_fundamentals(ticker)
        
        if 'error' in fund:
            return f"Error retrieving fundamentals: {fund['error']}"
        
        output = []
        output.append(f"Fundamentals for {ticker}:")
        output.append(f"  Company: {fund.get('longName', 'N/A')}")
        output.append(f"  Sector: {fund.get('sector', 'N/A')}")
        output.append(f"  Industry: {fund.get('industry', 'N/A')}")
        
        market_cap = fund.get('marketCap', 0)
        if market_cap:
            market_cap_formatted = f"{market_cap/1e9:.2f}B" if market_cap > 1e9 else f"{market_cap/1e6:.2f}M"
            output.append(f"  Market Cap: {market_cap_formatted} {fund.get('currency', '')}")
        
        output.append(f"  Exchange: {fund.get('exchange', 'N/A')}")
        
        return "\n".join(output)
    
    except Exception as e:
        return f"Error retrieving fundamentals: {str(e)}"


def get_latest_price_tool(ticker: str) -> str:
    """
    Get the latest price for a ticker.
    
    Args:
        ticker: Stock ticker symbol
    
    Returns:
        Latest price as string
    """
    try:
        price = get_latest_price(ticker)
        
        if price is None:
            return f"Unable to retrieve latest price for {ticker}"
        
        return f"{ticker} latest price: {price:.2f}"
    
    except Exception as e:
        return f"Error retrieving latest price: {str(e)}"


__all__ = ['get_price_change_tool', 'get_fundamentals_tool', 'get_latest_price_tool']
