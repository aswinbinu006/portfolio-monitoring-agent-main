"""
API Routers Package.
Exports all feature routers for auth, history, portfolio, analysis, market data, and system health.
"""
from backend.api.routers.system import router as system_router
from backend.api.routers.auth import router as auth_router
from backend.api.routers.history import router as history_router
from backend.api.routers.portfolio import router as portfolio_router
from backend.api.routers.analysis import router as analysis_router
from backend.api.routers.forecast import router as forecast_router
from backend.api.routers.market import router as market_router

__all__ = [
    "system_router",
    "auth_router",
    "history_router",
    "portfolio_router",
    "analysis_router",
    "forecast_router",
    "market_router",
]
