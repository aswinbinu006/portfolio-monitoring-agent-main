"""
Authentication Router.
Handles user registration, login, JWT token issuance, and session verification.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any

from backend.data.db import create_user, get_user_by_email
from backend.core.auth import hash_password, verify_password, create_access_token
from backend.api.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class AuthRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="User email address")
    password: str = Field(..., min_length=6, max_length=128, description="User password")


class AuthResponse(BaseModel):
    status: str
    message: str
    token: str
    user: Dict[str, Any]


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: AuthRequest):
    """Register a new user account and return signed JWT."""
    existing = get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    hashed = hash_password(payload.password)
    user = create_user(payload.email, hashed)

    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})

    return AuthResponse(
        status="success",
        message="Account created successfully.",
        token=token,
        user=user,
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest):
    """Authenticate existing credentials and return signed JWT."""
    user = get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_profile = {"id": user["id"], "email": user["email"]}
    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})

    return AuthResponse(
        status="success",
        message="Authenticated successfully.",
        token=token,
        user=user_profile,
    )


@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Verify session token and return authenticated user profile."""
    return {
        "status": "success",
        "user": current_user
    }
