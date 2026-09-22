"""
Portfolio Management and Holdings Router.
Handles CSV upload, holding inspection, and watchlist maintenance with SQLite persistence.
"""
import os
import tempfile
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from pydantic import BaseModel, Field

from backend.schemas.common import (
    HoldingItem,
    PortfolioUploadResponse,
    WatchlistItem,
)
from backend.data.db import save_user_portfolio, get_user_portfolio
from backend.api.dependencies import get_current_user
from backend.services.portfolio_service import portfolio_service, get_sector_for_ticker
from backend.core.portfolio import Portfolio

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024


@router.post("/upload", response_model=PortfolioUploadResponse)
async def upload_portfolio(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Import and validate a portfolio CSV file for the authenticated user.
    Saves positions directly to SQLite.
    """
    filename = file.filename or ""
    if not (filename.lower().endswith(".csv") or filename.lower().endswith(".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a standard CSV (.csv) file."
        )

    tmp_path = None
    try:
        content = await file.read()
        if len(content) > MAX_CSV_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 5MB limit."
            )
        if len(content.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty. Please provide a valid portfolio CSV."
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv", mode="wb") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        parsed_portfolio = Portfolio.from_csv(tmp_path)
        n_holdings = len(parsed_portfolio.holdings)
        default_weight = round(1.0 / n_holdings, 4) if n_holdings > 0 else 0.0

        holdings_data = []
        holdings_list: List[HoldingItem] = []
        for h in parsed_portfolio.holdings:
            item = {
                "symbol": h.ticker,
                "quantity": h.quantity,
                "weight": h.target_weight if h.target_weight is not None else default_weight,
                "target_weight": h.target_weight,
                "sector": get_sector_for_ticker(h.ticker),
            }
            holdings_data.append(item)
            holdings_list.append(HoldingItem(
                symbol=item["symbol"],
                quantity=item["quantity"],
                weight=item["weight"],
                target_weight=item["target_weight"],
                sector=item["sector"],
                current_price=None,
                current_value=None,
            ))

        # Persist to SQLite under active user_id
        save_user_portfolio(current_user["id"], holdings_data)

        return PortfolioUploadResponse(
            message=f"Successfully imported {n_holdings} position{'s' if n_holdings != 1 else ''}.",
            holdings=holdings_list,
            total_holdings=n_holdings,
            total_value=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse portfolio CSV: {str(e)}"
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@router.get("/holdings", response_model=List[HoldingItem])
async def get_current_holdings(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the list of positions currently stored in SQLite for the authenticated user."""
    holdings_data = get_user_portfolio(current_user["id"])
    if not holdings_data:
        return []

    return [HoldingItem(**h) for h in holdings_data]


class WatchlistAddRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20, description="Ticker symbol")
    name: Optional[str] = Field(None, max_length=100, description="Company or asset name")


@router.get("/watchlist", response_model=List[WatchlistItem])
async def get_watchlist():
    """Retrieve all monitored watchlist assets."""
    return portfolio_service.get_watchlist()


@router.post("/watchlist", response_model=WatchlistItem)
async def add_to_watchlist(
    req: WatchlistAddRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add a new ticker symbol to the monitoring watchlist."""
    return portfolio_service.add_to_watchlist(req.symbol, req.name)


@router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Remove a ticker symbol from the active watchlist."""
    success = portfolio_service.remove_from_watchlist(symbol)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticker '{symbol}' not found on watchlist."
        )
    return {"message": f"Ticker '{symbol}' removed from watchlist."}
