"""
Market Status and Movers Router.
"""
from fastapi import APIRouter
from backend.server.schemas.common import MarketStatus
from backend.server.services.market_service import market_service

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/status", response_model=MarketStatus)
async def get_market_status():
    return market_service.get_market_status()
