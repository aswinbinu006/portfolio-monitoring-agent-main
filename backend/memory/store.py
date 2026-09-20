"""
SQLite-based session memory for portfolio monitoring.
Tracks alerts and deduplicates within configurable time window.
"""
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
import config


class MemoryStore:
    """
    SQLite memory store for agent sessions.
    
    Features:
    - Alert deduplication (same ticker+cause within N days)
    - Session history
    - Agent execution logs
    """
    
    def __init__(self, db_path: Optional[Path] = None):
        """
        Initialize memory store.
        
        Args:
            db_path: Path to SQLite database (default: from config)
        """
        if db_path is None:
            db_path = config.DB_PATH
        
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize database
        self._init_db()
    
    def _init_db(self):
        """Create tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                cause TEXT NOT NULL,
                event_date TEXT NOT NULL,
                alert_date TEXT NOT NULL,
                z_score REAL,
                return_value REAL,
                contribution REAL,
                news_url TEXT,
                news_title TEXT,
                details TEXT
            )
        """)
        
        # Create index for deduplication
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alerts_ticker_cause 
            ON alerts(ticker, cause, alert_date)
        """)
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                portfolio_tickers TEXT,
                anomalies_detected INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active'
            )
        """)
        
        # Agent executions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                tools_called TEXT,
                tokens_used INTEGER,
                status TEXT,
                error TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def check_duplicate_alert(
        self,
        ticker: str,
        cause: str,
        days_window: int = 7
    ) -> bool:
        """
        Check if an alert for this ticker+cause was already raised recently.
        
        Args:
            ticker: Stock ticker
            cause: Alert cause/reason
            days_window: Deduplication window in days
        
        Returns:
            True if duplicate found (should suppress), False if new alert
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days_window)).isoformat()
        
        cursor.execute("""
            SELECT COUNT(*) FROM alerts
            WHERE ticker = ? AND cause = ? AND alert_date >= ?
        """, (ticker, cause, cutoff_date))
        
        count = cursor.fetchone()[0]
        conn.close()
        
        return count > 0
    
    def add_alert(
        self,
        ticker: str,
        cause: str,
        event_date: datetime,
        z_score: Optional[float] = None,
        return_value: Optional[float] = None,
        contribution: Optional[float] = None,
        news_url: Optional[str] = None,
        news_title: Optional[str] = None,
        details: Optional[Dict] = None
    ) -> int:
        """
        Add a new alert to the database.
        
        Args:
            ticker: Stock ticker
            cause: Alert cause
            event_date: Date of the event
            z_score: Z-score value
            return_value: Return value
            contribution: Portfolio contribution
            news_url: Related news URL
            news_title: Related news title
            details: Additional details as dict
        
        Returns:
            Alert ID
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        details_json = json.dumps(details) if details else None
        
        cursor.execute("""
            INSERT INTO alerts (
                ticker, cause, event_date, alert_date,
                z_score, return_value, contribution,
                news_url, news_title, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticker,
            cause,
            event_date.isoformat(),
            datetime.now().isoformat(),
            z_score,
            return_value,
            contribution,
            news_url,
            news_title,
            details_json
        ))
        
        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return alert_id
    
    def get_recent_alerts(self, days: int = 7) -> List[Dict]:
        """
        Get recent alerts.
        
        Args:
            days: Number of days to look back
        
        Returns:
            List of alert dicts
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute("""
            SELECT * FROM alerts
            WHERE alert_date >= ?
            ORDER BY alert_date DESC
        """, (cutoff_date,))
        
        columns = [desc[0] for desc in cursor.description]
        alerts = []
        
        for row in cursor.fetchall():
            alert = dict(zip(columns, row))
            if alert['details']:
                alert['details'] = json.loads(alert['details'])
            alerts.append(alert)
        
        conn.close()
        return alerts
    
    def create_session(self, session_id: str, portfolio_tickers: List[str]) -> int:
        """Create a new session."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sessions (session_id, start_time, portfolio_tickers)
            VALUES (?, ?, ?)
        """, (session_id, datetime.now().isoformat(), json.dumps(portfolio_tickers)))
        
        session_db_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return session_db_id
    
    def update_session(
        self,
        session_id: str,
        anomalies_detected: Optional[int] = None,
        status: Optional[str] = None
    ):
        """Update session information."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        updates = []
        params = []
        
        if anomalies_detected is not None:
            updates.append("anomalies_detected = ?")
            params.append(anomalies_detected)
        
        if status is not None:
            updates.append("status = ?")
            params.append(status)
            
            if status == 'completed':
                updates.append("end_time = ?")
                params.append(datetime.now().isoformat())
        
        if updates:
            params.append(session_id)
            cursor.execute(f"""
                UPDATE sessions
                SET {', '.join(updates)}
                WHERE session_id = ?
            """, params)
        
        conn.commit()
        conn.close()
    
    def log_agent_execution(
        self,
        session_id: str,
        agent_name: str,
        tools_called: List[str],
        tokens_used: int = 0,
        status: str = "success",
        error: Optional[str] = None
    ) -> int:
        """Log an agent execution."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO agent_executions (
                session_id, agent_name, start_time, end_time,
                tools_called, tokens_used, status, error
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            agent_name,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
            json.dumps(tools_called),
            tokens_used,
            status,
            error
        ))
        
        exec_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return exec_id
    
    def get_session_trace(self, session_id: str) -> Dict:
        """Get full execution trace for a session."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get session info
        cursor.execute("""
            SELECT * FROM sessions WHERE session_id = ?
        """, (session_id,))
        
        session_row = cursor.fetchone()
        if not session_row:
            conn.close()
            return {}
        
        session_cols = [desc[0] for desc in cursor.description]
        session = dict(zip(session_cols, session_row))
        
        # Get agent executions
        cursor.execute("""
            SELECT * FROM agent_executions
            WHERE session_id = ?
            ORDER BY start_time
        """, (session_id,))
        
        exec_cols = [desc[0] for desc in cursor.description]
        executions = []
        
        for row in cursor.fetchall():
            execution = dict(zip(exec_cols, row))
            execution['tools_called'] = json.loads(execution['tools_called'])
            executions.append(execution)
        
        conn.close()
        
        return {
            "session": session,
            "executions": executions
        }
    
    def clear_old_data(self, days: int = 30):
        """Clear data older than specified days."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute("DELETE FROM alerts WHERE alert_date < ?", (cutoff_date,))
        cursor.execute("DELETE FROM sessions WHERE start_time < ?", (cutoff_date,))
        
        deleted_alerts = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return {"alerts_deleted": deleted_alerts}


# Global instance
_memory_store = None


def get_memory_store() -> MemoryStore:
    """Get global memory store instance."""
    global _memory_store
    if _memory_store is None:
        _memory_store = MemoryStore()
    return _memory_store


if __name__ == "__main__":
    # Demo usage
    store = MemoryStore(Path("test_memory.db"))
    
    # Create session
    session_id = "test_session_001"
    store.create_session(session_id, ["RELIANCE.NS", "TCS.NS"])
    
    # Check for duplicate
    is_dup = store.check_duplicate_alert("RELIANCE.NS", "high_volatility", days_window=7)
    print(f"Is duplicate: {is_dup}")
    
    # Add alert
    alert_id = store.add_alert(
        ticker="RELIANCE.NS",
        cause="high_volatility",
        event_date=datetime.now(),
        z_score=2.5,
        return_value=0.05,
        news_title="Reliance announces major expansion"
    )
    print(f"Added alert ID: {alert_id}")
    
    # Check duplicate again
    is_dup_now = store.check_duplicate_alert("RELIANCE.NS", "high_volatility", days_window=7)
    print(f"Is duplicate now: {is_dup_now}")
    
    # Log agent execution
    store.log_agent_execution(
        session_id=session_id,
        agent_name="news_agent",
        tools_called=["search_news", "format_citation"],
        tokens_used=500,
        status="success"
    )
    
    # Get trace
    trace = store.get_session_trace(session_id)
    print(f"\nSession trace: {json.dumps(trace, indent=2)}")
    
    # Update session
    store.update_session(session_id, anomalies_detected=1, status="completed")
    
    print("\nMemory store demo complete!")
