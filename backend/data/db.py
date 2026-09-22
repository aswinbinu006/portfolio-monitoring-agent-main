"""
Persistent Agent Memory & Storage Subsystem (SQLite).

WHY PERSISTENT MEMORY MATTERS FOR AGENTIC AI:
In classical LLM applications, execution is stateless: each invocation runs in isolation,
forgets prior outputs, and cannot track how real-world environments evolve across sessions.
In an Agentic AI system, true autonomy requires persistent episodic memory:
1. Longitudinal Tracking: Downside risk and asset drift develop over days/weeks; agents must
   compare current metrics against prior runs to detect progressive deterioration.
2. Contextual Continuity: The Writer Agent and Risk Agent can ground their reasoning in historical
   recommendations rather than starting from zero each session.
3. Auditability & Ground Truth: Multi-agent execution traces, retrieved news citations, and
   intermediate node outputs are stored as an immutable audit log of agent decision-making.
"""
import sqlite3
import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

# Database file location
DB_PATH = Path(__file__).resolve().parent / "app.db"


def get_connection() -> sqlite3.Connection:
    """Provides a SQLite connection with dict-like row access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes tables for user identity, active portfolio state, and agent runs."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. User Portfolios Table (Replaces in-memory current_portfolio)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolios (
        user_id INTEGER PRIMARY KEY,
        holdings_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 3. Agent Runs Memory Table (Replaces in-memory latest_results)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        mandate TEXT NOT NULL,
        days INTEGER NOT NULL,
        drawdown_tolerance REAL NOT NULL,
        portfolio_snapshot TEXT NOT NULL,
        risk_metrics TEXT NOT NULL,
        alerts TEXT NOT NULL,
        news_analyses TEXT NOT NULL,
        drift_analysis TEXT NOT NULL,
        forecast TEXT NOT NULL,
        briefing TEXT NOT NULL,
        trace TEXT NOT NULL,
        orchestrator_engine TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()


# Ensure DB schema is initialized on module load
init_db()


# --- User Management Operations ---

def create_user(email: str, hashed_password: str) -> Dict[str, Any]:
    """Creates a new user record."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (email.strip().lower(), hashed_password),
        )
        user_id = cursor.lastrowid
        conn.commit()
        return {"id": user_id, "email": email.strip().lower()}
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by email, including password hash."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves user public profile by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, email, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


# --- Portfolio State Operations (Single Source of Truth) ---

def save_user_portfolio(user_id: int, holdings: List[Dict[str, Any]]):
    """Saves or updates user's active holdings in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    holdings_json = json.dumps(holdings)
    try:
        cursor.execute("""
        INSERT INTO portfolios (user_id, holdings_json, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            holdings_json = excluded.holdings_json,
            updated_at = CURRENT_TIMESTAMP
        """, (user_id, holdings_json))
        conn.commit()
    finally:
        conn.close()


def get_user_portfolio(user_id: int) -> Optional[List[Dict[str, Any]]]:
    """Retrieves user's active holdings from SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT holdings_json FROM portfolios WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return json.loads(row["holdings_json"])
    finally:
        conn.close()


# --- Agent Run Persistent Memory Operations ---

def save_agent_run(user_id: int, run_data: Dict[str, Any]) -> int:
    """
    Persists a completed 7-agent pipeline run for longitudinal tracking and auditability.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO agent_runs (
            user_id, session_id, mandate, days, drawdown_tolerance,
            portfolio_snapshot, risk_metrics, alerts, news_analyses,
            drift_analysis, forecast, briefing, trace, orchestrator_engine
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            run_data.get("session_id", "default"),
            run_data.get("mandate", "balanced"),
            int(run_data.get("days", 90)),
            float(run_data.get("drawdown_tolerance", -0.15)),
            json.dumps(run_data.get("portfolio_snapshot", [])),
            json.dumps(run_data.get("risk_metrics", {})),
            json.dumps(run_data.get("alerts", [])),
            json.dumps(run_data.get("news_analyses", [])),
            json.dumps(run_data.get("drift_analysis", {})),
            json.dumps(run_data.get("forecast", {})),
            str(run_data.get("briefing", "")),
            str(run_data.get("trace", "")),
            str(run_data.get("orchestrator_engine", "LangGraph StateGraph"))
        ))
        run_id = cursor.lastrowid
        conn.commit()
        return run_id
    finally:
        conn.close()


def get_user_agent_runs(user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves list of past runs for a user (summaries for history list)."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, session_id, mandate, days, orchestrator_engine, created_at,
               briefing, risk_metrics, alerts
        FROM agent_runs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        results = []
        for r in rows:
            metrics = json.loads(r["risk_metrics"]) if r["risk_metrics"] else {}
            alerts = json.loads(r["alerts"]) if r["alerts"] else []
            # Summary snippet of briefing
            briefing_text = r["briefing"] or ""
            snippet = briefing_text[:180] + ("..." if len(briefing_text) > 180 else "")

            results.append({
                "id": r["id"],
                "session_id": r["session_id"],
                "mandate": r["mandate"],
                "days": r["days"],
                "orchestrator_engine": r["orchestrator_engine"],
                "created_at": r["created_at"],
                "briefing_snippet": snippet,
                "volatility": metrics.get("annualized_volatility"),
                "max_drawdown": metrics.get("max_drawdown"),
                "total_return": metrics.get("total_return"),
                "alerts_count": len(alerts),
            })
        return results
    finally:
        conn.close()


def get_agent_run_by_id(user_id: int, run_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves full details of a specific agent run."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT * FROM agent_runs WHERE id = ? AND user_id = ?",
            (run_id, user_id)
        )
        row = cursor.fetchone()
        if not row:
            return None

        record = dict(row)
        record["portfolio_snapshot"] = json.loads(record["portfolio_snapshot"])
        record["risk_metrics"] = json.loads(record["risk_metrics"])
        record["alerts"] = json.loads(record["alerts"])
        record["news_analyses"] = json.loads(record["news_analyses"])
        record["drift_analysis"] = json.loads(record["drift_analysis"])
        record["forecast"] = json.loads(record["forecast"])
        return record
    finally:
        conn.close()


def get_latest_agent_run(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves the most recent agent run for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT * FROM agent_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None

        record = dict(row)
        record["portfolio_snapshot"] = json.loads(record["portfolio_snapshot"])
        record["risk_metrics"] = json.loads(record["risk_metrics"])
        record["alerts"] = json.loads(record["alerts"])
        record["news_analyses"] = json.loads(record["news_analyses"])
        record["drift_analysis"] = json.loads(record["drift_analysis"])
        record["forecast"] = json.loads(record["forecast"])
        return record
    finally:
        conn.close()
