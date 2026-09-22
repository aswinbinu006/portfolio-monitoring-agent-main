"""
FastAPI Dependencies: User Authentication & Database State Providers.
Fully replaces in-memory app_state with SQLite persistence scoped to the authenticated user.
"""
from typing import Optional, Dict, Any, List
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.core.auth import decode_access_token
from backend.data.db import get_user_by_id, get_user_portfolio
from backend.core.portfolio import Portfolio, Holding
from backend.services.portfolio_service import portfolio_service, PortfolioService
from backend.services.market_service import market_service, MarketService

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Extracts and validates the JWT bearer token, resolving the active user from SQLite.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is invalid or expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token payload.",
        )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    return user


def get_portfolio_service() -> PortfolioService:
    """Dependency provider for portfolio calculation service."""
    return portfolio_service


def get_market_service() -> MarketService:
    """Dependency provider for market data and status service."""
    return market_service


def require_user_portfolio(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Portfolio:
    """
    Retrieves the authenticated user's active portfolio from SQLite.
    Raises HTTP 400 if user has not yet uploaded a portfolio.
    """
    user_id = current_user["id"]
    holdings_data = get_user_portfolio(user_id)

    if not holdings_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No portfolio loaded for this account. Please upload a portfolio CSV first."
        )

    holdings = [
        Holding(
            ticker=h["symbol"],
            quantity=float(h["quantity"]),
            target_weight=float(h["target_weight"]) if h.get("target_weight") is not None else None,
            sector=h.get("sector")
        )
        for h in holdings_data
    ]
    return Portfolio(holdings=holdings)
