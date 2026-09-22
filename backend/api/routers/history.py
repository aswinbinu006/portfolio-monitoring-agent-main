"""
Agent Run Persistent Memory & History Router.
Allows users to recall, inspect, and audit previous LangGraph multi-agent runs.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends

from backend.data.db import get_user_agent_runs, get_agent_run_by_id
from backend.api.dependencies import get_current_user

router = APIRouter(prefix="/api/history", tags=["Agent Memory & History"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_agent_history(
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve past LangGraph agent monitoring runs for the authenticated user.
    Enables longitudinal comparison of portfolio risk across sessions.
    """
    return get_user_agent_runs(current_user["id"], limit=limit)


@router.get("/{run_id}", response_model=Dict[str, Any])
async def get_agent_history_detail(
    run_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve full historical outputs from all 7 agent nodes and the Writer Agent
    briefing for a specific run.
    """
    run = get_agent_run_by_id(current_user["id"], run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent run #{run_id} not found."
        )
    return run
