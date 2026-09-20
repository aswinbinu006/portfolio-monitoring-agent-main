"""
Portfolio data structure and basic operations.
Pure Python - zero network calls, zero LLM calls.
"""
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime, timedelta


@dataclass
class Holding:
    """Represents a single position in the portfolio."""
    ticker: str
    quantity: float
    target_weight: Optional[float] = None  # For mandate-based rebalancing


@dataclass
class Portfolio:
    """
    Portfolio data structure.
    
    Holds positions and price history.
    All computations delegated to metrics.py.
    """
    holdings: List[Holding] = field(default_factory=list)
    prices: pd.DataFrame = field(default_factory=pd.DataFrame)  # columns: tickers, index: dates
    benchmark_ticker: str = "^NSEI"  # Nifty 50 default
    risk_free_rate: float = 0.06  # Annual rate (6% India 10Y G-Sec)
    
    def __post_init__(self):
        """Validate portfolio structure."""
        if not self.holdings:
            return  # Empty portfolio is valid
        
        # Check for duplicate tickers
        tickers = [h.ticker for h in self.holdings]
        if len(tickers) != len(set(tickers)):
            raise ValueError("Duplicate tickers found in portfolio")
    
    @property
    def tickers(self) -> List[str]:
        """Get list of all tickers in portfolio."""
        return [h.ticker for h in self.holdings]
    
    @property
    def quantities(self) -> Dict[str, float]:
        """Get dict of ticker -> quantity."""
        return {h.ticker: h.quantity for h in self.holdings}
    
    @property
    def target_weights(self) -> Dict[str, float]:
        """Get dict of ticker -> target_weight (if set)."""
        return {h.ticker: h.target_weight for h in self.holdings if h.target_weight is not None}
    
    def add_holding(self, ticker: str, quantity: float, target_weight: Optional[float] = None):
        """Add a new holding to the portfolio."""
        if ticker in self.tickers:
            raise ValueError(f"Ticker {ticker} already exists in portfolio")
        self.holdings.append(Holding(ticker, quantity, target_weight))
    
    def remove_holding(self, ticker: str):
        """Remove a holding from the portfolio."""
        self.holdings = [h for h in self.holdings if h.ticker != ticker]
    
    def update_quantity(self, ticker: str, new_quantity: float):
        """Update the quantity for a holding."""
        for holding in self.holdings:
            if holding.ticker == ticker:
                holding.quantity = new_quantity
                return
        raise ValueError(f"Ticker {ticker} not found in portfolio")
    
    def set_prices(self, prices_df: pd.DataFrame):
        """
        Set price history.
        
        Args:
            prices_df: DataFrame with dates as index, tickers as columns
        """
        # Validate that all portfolio tickers are in the price data
        missing = set(self.tickers) - set(prices_df.columns)
        if missing:
            raise ValueError(f"Missing price data for tickers: {missing}")
        
        # Keep only relevant columns and sort by date
        self.prices = prices_df[self.tickers].sort_index()
    
    def get_latest_prices(self) -> Dict[str, float]:
        """Get the most recent price for each ticker."""
        if self.prices.empty:
            raise ValueError("No price data available")
        
        latest = self.prices.iloc[-1]
        return {ticker: latest[ticker] for ticker in self.tickers}
    
    def get_portfolio_value(self, date: Optional[pd.Timestamp] = None) -> float:
        """
        Calculate total portfolio value at a given date.
        V_t = sum(q_i * p_i,t)
        
        Args:
            date: Date to calculate value at (default: latest)
        
        Returns:
            Total portfolio value
        """
        if self.prices.empty:
            raise ValueError("No price data available")
        
        if date is None:
            prices = self.prices.iloc[-1]
        else:
            if date not in self.prices.index:
                raise ValueError(f"Date {date} not found in price data")
            prices = self.prices.loc[date]
        
        value = 0.0
        for holding in self.holdings:
            value += holding.quantity * prices[holding.ticker]
        
        return value
    
    def get_weights(self, date: Optional[pd.Timestamp] = None) -> Dict[str, float]:
        """
        Calculate portfolio weights at a given date.
        w_i,t = q_i * p_i,t / V_t
        
        Args:
            date: Date to calculate weights at (default: latest)
        
        Returns:
            Dict of ticker -> weight
        """
        if self.prices.empty:
            raise ValueError("No price data available")
        
        if date is None:
            prices = self.prices.iloc[-1]
        else:
            if date not in self.prices.index:
                raise ValueError(f"Date {date} not found in price data")
            prices = self.prices.loc[date]
        
        total_value = self.get_portfolio_value(date)
        
        weights = {}
        for holding in self.holdings:
            position_value = holding.quantity * prices[holding.ticker]
            weights[holding.ticker] = position_value / total_value
        
        return weights
    
    def get_value_series(self) -> pd.Series:
        """
        Calculate portfolio value time series.
        
        Returns:
            Series with dates as index, portfolio values
        """
        if self.prices.empty:
            raise ValueError("No price data available")
        
        values = []
        for date in self.prices.index:
            values.append(self.get_portfolio_value(date))
        
        return pd.Series(values, index=self.prices.index, name='portfolio_value')
    
    def get_weights_series(self) -> pd.DataFrame:
        """
        Calculate portfolio weights time series.
        
        Returns:
            DataFrame with dates as index, tickers as columns (weights)
        """
        if self.prices.empty:
            raise ValueError("No price data available")
        
        weights_list = []
        for date in self.prices.index:
            weights_list.append(self.get_weights(date))
        
        return pd.DataFrame(weights_list, index=self.prices.index)
    
    @classmethod
    def from_csv(cls, filepath: str, **kwargs) -> 'Portfolio':
        """
        Create portfolio from CSV file.
        
        CSV format:
            ticker,quantity[,target_weight]
            RELIANCE.NS,100[,0.20]
            TCS.NS,50[,0.15]
        
        Args:
            filepath: Path to CSV file
            **kwargs: Additional portfolio parameters (risk_free_rate, benchmark_ticker)
        
        Returns:
            Portfolio instance
        """
        df = pd.read_csv(filepath)
        
        required_cols = {'ticker', 'quantity'}
        if not required_cols.issubset(df.columns):
            raise ValueError(f"CSV must contain columns: {required_cols}")
        
        holdings = []
        for _, row in df.iterrows():
            target_weight = row.get('target_weight', None)
            if pd.notna(target_weight):
                target_weight = float(target_weight)
            else:
                target_weight = None
            
            holdings.append(Holding(
                ticker=str(row['ticker']),
                quantity=float(row['quantity']),
                target_weight=target_weight
            ))
        
        return cls(holdings=holdings, **kwargs)
    
    def to_csv(self, filepath: str):
        """Save portfolio holdings to CSV."""
        data = []
        for holding in self.holdings:
            row = {
                'ticker': holding.ticker,
                'quantity': holding.quantity,
            }
            if holding.target_weight is not None:
                row['target_weight'] = holding.target_weight
            data.append(row)
        
        df = pd.DataFrame(data)
        df.to_csv(filepath, index=False)
    
    def __repr__(self) -> str:
        """String representation of portfolio."""
        if not self.holdings:
            return "Portfolio(empty)"
        
        lines = [f"Portfolio({len(self.holdings)} holdings):"]
        for h in self.holdings:
            target = f", target={h.target_weight:.1%}" if h.target_weight else ""
            lines.append(f"  {h.ticker}: {h.quantity}{target}")
        
        if not self.prices.empty:
            lines.append(f"Price data: {len(self.prices)} days ({self.prices.index[0]} to {self.prices.index[-1]})")
        
        return "\n".join(lines)
