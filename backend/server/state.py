"""Centralized state manager for active portfolio and monitoring results."""
from typing import Optional, Dict, Any
from backend.core.portfolio import Portfolio

class AppState:
    def __init__(self):
        self.current_portfolio: Optional[Portfolio] = None
        self.latest_results: Optional[Dict[str, Any]] = None

    def reset(self):
        self.current_portfolio = None
        self.latest_results = None

app_state = AppState()
