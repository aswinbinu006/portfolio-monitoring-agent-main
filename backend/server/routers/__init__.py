"""API Routers package."""
from backend.server.routers.portfolio import router as portfolio_router
from backend.server.routers.analysis import router as analysis_router
from backend.server.routers.forecast import router as forecast_router
from backend.server.routers.market import router as market_router
from backend.server.routers.system import router as system_router

__all__ = [
    "portfolio_router",
    "analysis_router",
    "forecast_router",
    "market_router",
    "system_router",
]
