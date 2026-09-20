"""
Market Agent - fetches and validates market data.
"""
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent))

from data.providers import fetch_prices, validate_tickers, fetch_benchmark
from core.portfolio import Portfolio


class MarketAgent:
    """
    Specialist agent for market data retrieval.
    
    Responsibilities:
    - Fetch historical prices for portfolio tickers
    - Validate ticker availability
    - Fetch benchmark data
    - Handle data quality issues
    """
    
    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.name = "MarketAgent"
        self.description = "Fetches and validates market data"
    
    def fetch_portfolio_data(
        self,
        portfolio: Portfolio,
        days: int = 90
    ) -> Dict:
        """
        Fetch historical prices for all portfolio tickers.
        
        Args:
            portfolio: Portfolio object
            days: Number of days of history to fetch
        
        Returns:
            Dict with status and price data
        """
        tickers = portfolio.tickers
        
        # Validate tickers first
        validation = validate_tickers(tickers)
        invalid_tickers = [t for t, valid in validation.items() if not valid]
        
        if invalid_tickers:
            return {
                "status": "error",
                "message": f"Invalid tickers: {', '.join(invalid_tickers)}",
                "invalid_tickers": invalid_tickers
            }
        
        # Fetch prices
        prices = fetch_prices(tickers, days=days)
        
        if prices.empty:
            return {
                "status": "error",
                "message": "Failed to fetch price data",
                "tickers": tickers
            }
        
        # Check data completeness
        missing_data = []
        for ticker in tickers:
            if ticker not in prices.columns or prices[ticker].isna().all():
                missing_data.append(ticker)
        
        if missing_data:
            return {
                "status": "partial",
                "message": f"Incomplete data for: {', '.join(missing_data)}",
                "prices": prices,
                "missing_tickers": missing_data,
                "days_fetched": len(prices)
            }
        
        # Success
        return {
            "status": "success",
            "prices": prices,
            "tickers": tickers,
            "days_fetched": len(prices),
            "date_range": {
                "start": prices.index[0].strftime('%Y-%m-%d'),
                "end": prices.index[-1].strftime('%Y-%m-%d')
            }
        }
    
    def update_portfolio_prices(
        self,
        portfolio: Portfolio,
        days: int = 90
    ) -> Dict:
        """
        Fetch data and update portfolio in one step.
        
        Args:
            portfolio: Portfolio to update
            days: Days of history
        
        Returns:
            Status dict
        """
        result = self.fetch_portfolio_data(portfolio, days)
        
        if result["status"] in ["success", "partial"]:
            portfolio.set_prices(result["prices"])
            return {
                "status": "success",
                "message": f"Updated portfolio with {result['days_fetched']} days of data"
            }
        else:
            return result
    
    def fetch_benchmark_data(
        self,
        benchmark_ticker: str = "^NSEI",
        days: int = 90
    ) -> Dict:
        """
        Fetch benchmark index data.
        
        Args:
            benchmark_ticker: Benchmark ticker (default Nifty 50)
            days: Days of history
        
        Returns:
            Status dict with benchmark data
        """
        benchmark = fetch_benchmark(benchmark_ticker, days=days)
        
        if benchmark.empty:
            return {
                "status": "error",
                "message": f"Failed to fetch benchmark {benchmark_ticker}"
            }
        
        return {
            "status": "success",
            "benchmark_ticker": benchmark_ticker,
            "prices": benchmark,
            "days_fetched": len(benchmark)
        }


if __name__ == "__main__":
    print("Market Agent - handles all data fetching")
    print("Uses yfinance (primary) and Finnhub (fallback)")
    print("All responses cached per config TTL settings")
