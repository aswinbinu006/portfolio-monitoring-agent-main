"""
Configuration loader for Portfolio Monitoring Agent.
Loads all settings from environment variables with sensible defaults.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the same directory as this config file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# ============================================================================
# API KEYS - All read from environment, never hardcoded
# ============================================================================

# AI Model Keys
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Data Provider Keys
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")
MARKETAUX_API_KEY = os.environ.get("MARKETAUX_API_KEY", "")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")
ALPHAVANTAGE_API_KEY = os.environ.get("ALPHAVANTAGE_API_KEY", "")
FRED_API_KEY = os.environ.get("FRED_API_KEY", "")

# Optional Tokens
HF_TOKEN = os.environ.get("HF_TOKEN", "")

# ============================================================================
# RISK DETECTION PARAMETERS
# ============================================================================

# Z-score threshold for anomaly detection
Z_THRESHOLD = float(os.environ.get("Z_THRESHOLD", "2.0"))

# Portfolio weight drift tolerance (trigger rebalance alert)
DRIFT_TOLERANCE = float(os.environ.get("DRIFT_TOLERANCE", "0.05"))

# EWMA lambda for volatility estimation (0.94 is RiskMetrics standard)
EWMA_LAMBDA = float(os.environ.get("EWMA_LAMBDA", "0.94"))

# ============================================================================
# CACHE SETTINGS
# ============================================================================

# Default cache TTL in seconds (900s = 15 minutes)
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "900"))

# Specific TTLs for different data types
CACHE_TTL_FUNDAMENTALS = 86400  # 24 hours
CACHE_TTL_NEWS = 3600           # 1 hour
CACHE_TTL_PRICES = 900          # 15 minutes

# ============================================================================
# MARKET DATA SETTINGS
# ============================================================================

# Risk-free rate default (India 10-year G-Sec ~6% annualized)
DEFAULT_RISK_FREE_RATE = 0.06

# Trading days per year
TRADING_DAYS_PER_YEAR = 252

# ============================================================================
# MODEL CONFIGURATION
# ============================================================================

def get_primary_model():
    """
    Returns the primary LLM model configuration.
    Uses Gemini 2.5 Flash if key is available, falls back to Groq Llama 3.1.
    """
    if GOOGLE_API_KEY:
        return {
            "model": "gemini/gemini-2.0-flash-exp",
            "api_key": GOOGLE_API_KEY,
            "name": "Gemini 2.0 Flash"
        }
    elif GROQ_API_KEY:
        return {
            "model": "groq/llama-3.1-8b-instant",
            "api_key": GROQ_API_KEY,
            "name": "Groq Llama 3.1 8B"
        }
    else:
        return {
            "model": None,
            "api_key": None,
            "name": "No model configured"
        }

# ============================================================================
# MEMORY & DEDUPLICATION
# ============================================================================

# Suppress duplicate alerts for the same ticker+cause within this window
ALERT_DEDUP_DAYS = 7

# SQLite database path
DB_PATH = Path(__file__).parent / "memory" / "portfolio_agent.db"

# ============================================================================
# ML SETTINGS
# ============================================================================

# Time series cross-validation splits
TS_CV_SPLITS = 5
TS_CV_GAP = 5  # Days to skip between train and test

# Forecast horizon (days ahead)
FORECAST_HORIZON = 5

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def check_required_keys(*key_names):
    """
    Check if required API keys are set.
    Returns dict of {key_name: is_set}
    """
    result = {}
    for key_name in key_names:
        value = globals().get(key_name, "")
        result[key_name] = bool(value and value.strip())
    return result

def get_config_summary():
    """
    Returns a summary of current configuration for debugging.
    """
    model_config = get_primary_model()
    
    return {
        "model": model_config["name"],
        "model_available": model_config["api_key"] is not None,
        "api_keys_configured": {
            "tavily": bool(TAVILY_API_KEY),
            "marketaux": bool(MARKETAUX_API_KEY),
            "finnhub": bool(FINNHUB_API_KEY),
            "alphavantage": bool(ALPHAVANTAGE_API_KEY),
            "fred": bool(FRED_API_KEY),
        },
        "risk_params": {
            "z_threshold": Z_THRESHOLD,
            "drift_tolerance": DRIFT_TOLERANCE,
            "ewma_lambda": EWMA_LAMBDA,
        },
        "cache_ttl": CACHE_TTL_SECONDS,
    }

if __name__ == "__main__":
    import json
    print("Portfolio Agent Configuration")
    print("=" * 50)
    summary = get_config_summary()
    print(json.dumps(summary, indent=2))
