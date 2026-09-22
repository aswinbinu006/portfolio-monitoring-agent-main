"""
FastAPI Dependencies and State Providers.
Provides dependency injection for portfolio state, services, and security checks.
"""
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from backend.core.portfolio import Portfolio
from backend.services.portfolio_service import portfolio_service, PortfolioService
from backend.services.market_service import market_service, MarketService


class AppState:
    """
    Session and portfolio execution state.
    Maintains currently loaded portfolio and latest multi-agent run telemetry.
    """
    def __init__(self):
        self.current_portfolio: Optional[Portfolio] = None
        self.latest_results: Optional[Dict[str, Any]] = None

    def reset(self):
        self.current_portfolio = None
        self.latest_results = None


# Global singleton application state
app_state = AppState()


def get_app_state() -> AppState:
    """Dependency provider for global application state."""
    return app_state


def get_portfolio_service() -> PortfolioService:
    """Dependency provider for portfolio calculation service."""
    return portfolio_service


def get_market_service() -> MarketService:
    """Dependency provider for market data and status service."""
    return market_service


def require_portfolio() -> Portfolio:
    """
    Dependency ensuring an active portfolio has been uploaded before proceeding.
    Raises HTTP 400 with a structured error if none exists.
    """
    if app_state.current_portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No portfolio loaded. Please upload a portfolio CSV first."
        )
    return app_state.current_portfolio
