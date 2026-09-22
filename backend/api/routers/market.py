"""
Market Status and Movers Router.
"""
from fastapi import APIRouter
from backend.schemas.common import MarketStatus
from backend.services.market_service import market_service

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/status", response_model=MarketStatus)
async def get_market_status():
    """Returns current exchange open/closed status, current time, and top gainers/losers."""
    return market_service.get_market_status()
