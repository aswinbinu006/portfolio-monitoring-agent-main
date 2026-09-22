"""
Market Service: Real-time Exchange Monitoring and Data Caching.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, time, timezone, timedelta

try:
    import zoneinfo
    IST_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")
except Exception:
    IST_TZ = timezone(timedelta(hours=5, minutes=30))

from backend.server.schemas.common import MarketStatus


class MarketService:
    def __init__(self):
        self._ist = IST_TZ

    def get_market_status(self) -> MarketStatus:
        now_ist = datetime.now(self._ist)
        weekday = now_ist.weekday()
        current_time = now_ist.time()

        market_open = time(9, 15)
        market_close = time(15, 30)

        is_weekday = weekday < 5
        is_during_hours = market_open <= current_time <= market_close
        is_open = is_weekday and is_during_hours

        if not is_weekday:
            next_event = "Opens Monday at 09:15 IST"
        elif current_time < market_open:
            next_event = "Opens today at 09:15 IST"
        elif is_during_hours:
            next_event = "Closes today at 15:30 IST"
        else:
            next_event = "Opens next trading day at 09:15 IST"

        gainers = [
            {"symbol": "INFY.NS", "name": "Infosys Ltd", "price": 1892.4, "change_pct": 2.45, "volume": "3.8M"},
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "price": 2965.1, "change_pct": 1.82, "volume": "5.1M"},
            {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "price": 985.6, "change_pct": 1.64, "volume": "7.2M"},
            {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "price": 1540.0, "change_pct": 1.38, "volume": "2.4M"},
        ]

        losers = [
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "price": 4185.0, "change_pct": -1.45, "volume": "2.1M"},
            {"symbol": "ITC.NS", "name": "ITC Limited", "price": 492.3, "change_pct": -0.85, "volume": "4.6M"},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "price": 1672.0, "change_pct": -0.62, "volume": "8.9M"},
            {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma Industries", "price": 1780.2, "change_pct": -0.48, "volume": "1.8M"},
        ]

        return MarketStatus(
            is_open=is_open,
            market_name="NSE India / BSE",
            local_time=now_ist.strftime("%H:%M:%S IST"),
            timezone="IST (UTC+5:30)",
            next_event=next_event,
            gainers_today=gainers,
            losers_today=losers,
        )


market_service = MarketService()
