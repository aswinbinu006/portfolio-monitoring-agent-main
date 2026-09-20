"""
Market data providers with caching.
Primary: yfinance (no API key required)
Fallback: Finnhub (for US tickers or when yfinance fails)

Supports NSE (.NS suffix) and BSE (.BO suffix) for Indian stocks.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from data.cache import get_price_cache, get_fundamental_cache


def normalize_ticker(ticker: str, exchange: str = "NSE") -> str:
    """
    Normalize ticker symbol for Indian exchanges.
    
    Args:
        ticker: Base ticker symbol (e.g., "RELIANCE")
        exchange: Exchange name ("NSE" or "BSE")
    
    Returns:
        Normalized ticker (e.g., "RELIANCE.NS" or "RELIANCE.BO")
    """
    # If already has suffix, return as-is
    if ticker.endswith(".NS") or ticker.endswith(".BO"):
        return ticker
    
    # Add appropriate suffix
    if exchange.upper() == "BSE":
        return f"{ticker}.BO"
    else:  # Default to NSE
        return f"{ticker}.NS"


def fetch_prices_yfinance(
    tickers: List[str],
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    period: str = "90d"
) -> pd.DataFrame:
    """
    Fetch historical prices using yfinance.
    
    Args:
        tickers: List of ticker symbols
        start_date: Start date (optional, use period if not provided)
        end_date: End date (optional, defaults to today)
        period: Period string (e.g., "1mo", "3mo", "1y") if dates not provided
    
    Returns:
        DataFrame with dates as index, tickers as columns (adjusted close prices)
    """
    try:
        import yfinance as yf
    except ImportError:
        raise ImportError("yfinance not installed. Run: pip install yfinance")
    
    # Check cache first
    cache = get_price_cache()
    cache_key = f"yf:{'_'.join(sorted(tickers))}:{start_date}:{end_date}:{period}"
    cached_data = cache.get(cache_key, ttl=config.CACHE_TTL_PRICES)
    
    if cached_data is not None:
        return cached_data
    
    try:
        if start_date and end_date:
            data = yf.download(
                tickers,
                start=start_date,
                end=end_date,
                progress=False,
                auto_adjust=True  # Use adjusted prices
            )
        else:
            data = yf.download(
                tickers,
                period=period,
                progress=False,
                auto_adjust=True
            )
        
        # Extract Close prices
        if len(tickers) == 1:
            # Single ticker returns Series, convert to DataFrame
            if isinstance(data, pd.DataFrame) and 'Close' in data.columns:
                prices = data[['Close']].copy()
                prices.columns = [tickers[0]]
            else:
                prices = pd.DataFrame({tickers[0]: data['Close']})
        else:
            # Multiple tickers
            if 'Close' in data.columns:
                prices = data['Close'].copy()
            else:
                prices = data
        
        # Drop NaN rows
        prices = prices.dropna(how='all')
        
        # Cache the result
        cache.set(cache_key, prices)
        
        return prices
    
    except Exception as e:
        print(f"yfinance error: {e}")
        return pd.DataFrame()


def fetch_prices_finnhub(
    tickers: List[str],
    start_date: datetime,
    end_date: datetime
) -> pd.DataFrame:
    """
    Fetch historical prices using Finnhub (fallback).
    
    Args:
        tickers: List of ticker symbols (US format, no .NS/.BO)
        start_date: Start date
        end_date: End date
    
    Returns:
        DataFrame with dates as index, tickers as columns
    """
    if not config.FINNHUB_API_KEY:
        raise ValueError("FINNHUB_API_KEY not configured")
    
    import requests
    
    # Check cache
    cache = get_price_cache()
    cache_key = f"fh:{'_'.join(sorted(tickers))}:{start_date}:{end_date}"
    cached_data = cache.get(cache_key, ttl=config.CACHE_TTL_PRICES)
    
    if cached_data is not None:
        return cached_data
    
    all_prices = {}
    
    # Finnhub requires Unix timestamps
    start_ts = int(start_date.timestamp())
    end_ts = int(end_date.timestamp())
    
    for ticker in tickers:
        # Remove exchange suffix for Finnhub
        clean_ticker = ticker.replace(".NS", "").replace(".BO", "")
        
        try:
            url = f"https://finnhub.io/api/v1/stock/candle"
            params = {
                "symbol": clean_ticker,
                "resolution": "D",  # Daily
                "from": start_ts,
                "to": end_ts,
                "token": config.FINNHUB_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("s") == "ok":
                # Convert to DataFrame
                df = pd.DataFrame({
                    "timestamp": data["t"],
                    "close": data["c"]
                })
                df["date"] = pd.to_datetime(df["timestamp"], unit="s")
                df = df.set_index("date")["close"]
                
                all_prices[ticker] = df
            else:
                print(f"Finnhub: No data for {ticker}")
        
        except Exception as e:
            print(f"Finnhub error for {ticker}: {e}")
    
    if not all_prices:
        return pd.DataFrame()
    
    # Combine all tickers
    prices = pd.DataFrame(all_prices)
    
    # Cache the result
    cache.set(cache_key, prices)
    
    return prices


def fetch_prices(
    tickers: List[str],
    days: int = 90,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Fetch historical prices with automatic fallback.
    
    Primary: yfinance (works for NSE/BSE with .NS/.BO suffix)
    Fallback: Finnhub (for US tickers)
    
    Args:
        tickers: List of ticker symbols
        days: Number of days of history (default 90)
        start_date: Start date (optional, overrides days)
        end_date: End date (optional, defaults to today)
    
    Returns:
        DataFrame with dates as index, tickers as columns
    """
    if end_date is None:
        end_date = datetime.now()
    
    if start_date is None:
        start_date = end_date - timedelta(days=days)
    
    # Try yfinance first (works for all markets)
    try:
        prices = fetch_prices_yfinance(
            tickers,
            start_date=start_date,
            end_date=end_date
        )
        
        if not prices.empty:
            return prices
    
    except Exception as e:
        print(f"yfinance failed: {e}")
    
    # Fallback to Finnhub (only for US tickers)
    if config.FINNHUB_API_KEY:
        try:
            prices = fetch_prices_finnhub(tickers, start_date, end_date)
            if not prices.empty:
                return prices
        except Exception as e:
            print(f"Finnhub fallback failed: {e}")
    
    # If all fail, return empty DataFrame
    print(f"Warning: Could not fetch prices for {tickers}")
    return pd.DataFrame()


def fetch_fundamentals(ticker: str) -> Dict:
    """
    Fetch fundamental data for a ticker.
    
    Args:
        ticker: Ticker symbol
    
    Returns:
        Dict with fundamental data (sector, industry, marketCap, etc.)
    """
    # Check cache (24 hour TTL for fundamentals)
    cache = get_fundamental_cache()
    cache_key = f"fundamentals:{ticker}"
    cached_data = cache.get(cache_key, ttl=config.CACHE_TTL_FUNDAMENTALS)
    
    if cached_data is not None:
        return cached_data
    
    try:
        import yfinance as yf
        
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Extract relevant fields
        fundamentals = {
            "symbol": info.get("symbol", ticker),
            "longName": info.get("longName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "marketCap": info.get("marketCap", 0),
            "currency": info.get("currency", "INR"),
            "exchange": info.get("exchange", ""),
            "website": info.get("website", ""),
        }
        
        # Cache the result
        cache.set(cache_key, fundamentals)
        
        return fundamentals
    
    except Exception as e:
        print(f"Error fetching fundamentals for {ticker}: {e}")
        return {
            "symbol": ticker,
            "longName": ticker,
            "error": str(e)
        }


def fetch_benchmark(
    benchmark_ticker: str = "^NSEI",
    days: int = 90,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> pd.Series:
    """
    Fetch benchmark index data.
    
    Default: ^NSEI (Nifty 50)
    
    Args:
        benchmark_ticker: Benchmark ticker (e.g., ^NSEI, ^BSESN, ^GSPC)
        days: Number of days
        start_date: Start date (optional)
        end_date: End date (optional)
    
    Returns:
        Series of benchmark prices
    """
    prices = fetch_prices([benchmark_ticker], days, start_date, end_date)
    
    if prices.empty:
        return pd.Series(dtype=float)
    
    return prices[benchmark_ticker]


def validate_tickers(tickers: List[str]) -> Dict[str, bool]:
    """
    Validate that tickers are available and have data.
    
    Args:
        tickers: List of ticker symbols
    
    Returns:
        Dict of ticker -> is_valid
    """
    # Fetch 5 days of data as test
    prices = fetch_prices(tickers, days=5)
    
    results = {}
    for ticker in tickers:
        if ticker in prices.columns and not prices[ticker].isna().all():
            results[ticker] = True
        else:
            results[ticker] = False
    
    return results


def get_latest_price(ticker: str) -> Optional[float]:
    """
    Get the most recent price for a ticker.
    
    Args:
        ticker: Ticker symbol
    
    Returns:
        Latest price or None if unavailable
    """
    prices = fetch_prices([ticker], days=5)
    
    if prices.empty or ticker not in prices.columns:
        return None
    
    latest = prices[ticker].dropna()
    if len(latest) == 0:
        return None
    
    return float(latest.iloc[-1])


def get_price_change(ticker: str, days: int = 1) -> Optional[Dict[str, float]]:
    """
    Get price change over specified period.
    
    Args:
        ticker: Ticker symbol
        days: Number of days to look back
    
    Returns:
        Dict with 'change' (absolute) and 'change_pct' (percentage)
    """
    prices = fetch_prices([ticker], days=days+5)
    
    if prices.empty or ticker not in prices.columns:
        return None
    
    price_series = prices[ticker].dropna()
    if len(price_series) < days + 1:
        return None
    
    current = price_series.iloc[-1]
    previous = price_series.iloc[-(days+1)]
    
    change = current - previous
    change_pct = (change / previous) * 100
    
    return {
        "current": float(current),
        "previous": float(previous),
        "change": float(change),
        "change_pct": float(change_pct)
    }


# Convenience function for common Indian indices
def get_indian_indices() -> Dict[str, str]:
    """Get mapping of common Indian index names to tickers."""
    return {
        "Nifty 50": "^NSEI",
        "Sensex": "^BSESN",
        "Nifty Bank": "^NSEBANK",
        "Nifty IT": "^CNXIT",
        "Nifty Pharma": "^CNXPHARMA",
        "Nifty Auto": "^CNXAUTO"
    }


if __name__ == "__main__":
    # Demo usage
    print("Fetching prices for Indian stocks...")
    tickers = ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
    
    prices = fetch_prices(tickers, days=30)
    print(f"\nPrices shape: {prices.shape}")
    print(f"Date range: {prices.index[0]} to {prices.index[-1]}")
    print("\nLatest prices:")
    print(prices.iloc[-1])
    
    print("\n" + "="*50)
    print("Fetching fundamentals...")
    fund = fetch_fundamentals("RELIANCE.NS")
    print(f"Name: {fund.get('longName')}")
    print(f"Sector: {fund.get('sector')}")
    print(f"Market Cap: {fund.get('marketCap'):,.0f}")
