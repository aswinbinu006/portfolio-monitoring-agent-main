"""
Portfolio Management and Holdings Router.
Handles CSV upload, holding inspection, and watchlist maintenance.
"""
import os
import tempfile
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.server.schemas.common import (
    HoldingItem,
    PortfolioUploadResponse,
    WatchlistItem,
)
from backend.server.state import app_state
from backend.server.services.portfolio_service import portfolio_service, get_sector_for_ticker
from backend.core.portfolio import Portfolio

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024


@router.post("/upload", response_model=PortfolioUploadResponse)
async def upload_portfolio(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not (filename.lower().endswith(".csv") or filename.lower().endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a standard CSV (.csv) file."
        )

    tmp_path = None
    try:
        content = await file.read()
        if len(content) > MAX_CSV_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="File size exceeds the 5MB institutional limit."
            )
        if len(content.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty. Please provide a valid portfolio CSV."
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv", mode="wb") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        parsed_portfolio = Portfolio.from_csv(tmp_path)
        app_state.current_portfolio = parsed_portfolio
        app_state.latest_results = None

        n_holdings = len(parsed_portfolio.holdings)
        default_weight = round(1.0 / n_holdings, 4) if n_holdings > 0 else 0.0

        holdings_list: List[HoldingItem] = []
        for h in parsed_portfolio.holdings:
            holdings_list.append(HoldingItem(
                symbol=h.ticker,
                quantity=h.quantity,
                weight=h.target_weight if h.target_weight is not None else default_weight,
                target_weight=h.target_weight,
                sector=get_sector_for_ticker(h.ticker),
                current_price=None,
                current_value=None,
            ))

        return PortfolioUploadResponse(
            message=f"Successfully imported {n_holdings} active position{'s' if n_holdings != 1 else ''}.",
            holdings=holdings_list,
            total_holdings=n_holdings,
            total_value=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse portfolio CSV: {str(e)}"
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@router.get("/holdings", response_model=List[HoldingItem])
async def get_current_holdings():
    if app_state.current_portfolio is None:
        return []

    n_holdings = len(app_state.current_portfolio.holdings)
    default_w = round(1.0 / n_holdings, 4) if n_holdings > 0 else 0.0

    result = []
    for h in app_state.current_portfolio.holdings:
        result.append(HoldingItem(
            symbol=h.ticker,
            quantity=h.quantity,
            weight=h.target_weight if h.target_weight is not None else default_w,
            target_weight=h.target_weight,
            sector=get_sector_for_ticker(h.ticker),
        ))
    return result


class WatchlistAddRequest(BaseModel):
    symbol: str
    name: Optional[str] = None


@router.get("/watchlist", response_model=List[WatchlistItem])
async def get_watchlist():
    return portfolio_service.get_watchlist()


@router.post("/watchlist", response_model=WatchlistItem)
async def add_to_watchlist(req: WatchlistAddRequest):
    return portfolio_service.add_to_watchlist(req.symbol, req.name)


@router.delete("/watchlist/{symbol}")
async def remove_from_watchlist(symbol: str):
    success = portfolio_service.remove_from_watchlist(symbol)
    if not success:
        raise HTTPException(status_code=404, detail=f"Ticker '{symbol}' not found on watchlist.")
    return {"message": f"Ticker '{symbol}' removed from watchlist."}
