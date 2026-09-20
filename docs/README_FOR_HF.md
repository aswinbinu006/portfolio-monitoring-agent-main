---
title: Portfolio Monitoring Agent
emoji: 📊
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 📊 Investment Portfolio Monitoring Agent

A multi-agent AI system that monitors equity/ETF portfolios, detects material risk events, and produces mandate-conditioned investment briefings.

## 🎯 What This Does

This is a **monitoring and explanation system** that:
- ✅ Analyzes portfolio risk metrics (volatility, Sharpe ratio, drawdown)
- ✅ Detects anomalies using two-stage statistical detection
- ✅ Attributes material events to news with citations
- ✅ Forecasts volatility using ML models (GARCH, XGBoost)
- ✅ Generates mandate-specific briefings for investors

**⚠️ This system NEVER places orders or issues buy/sell directives** - it only monitors and explains.

## 🚀 How to Use

### 1. Prepare Your Portfolio CSV

Create a CSV file with your holdings:

```csv
symbol,quantity
RELIANCE.NS,100
TCS.NS,50
HDFCBANK.NS,75
INFY.NS,200
```

**Supported Markets:**
- India: Add `.NS` (NSE) or `.BO` (BSE) suffix
- US: No suffix needed (e.g., `AAPL`, `GOOGL`)

### 2. Upload and Configure

1. Go to the **"📁 Portfolio"** tab
2. Upload your CSV file
3. Select investment mandate:
   - **Conservative**: Lower risk tolerance
   - **Balanced**: Moderate risk tolerance
   - **Aggressive**: Higher risk tolerance
4. Set analysis parameters:
   - Historical data period (30-365 days)
   - Maximum acceptable drawdown
5. Click **"Run Analysis"**

### 3. Review Results

Navigate through the tabs:

- **📈 Dashboard**: Portfolio value, allocation, drift charts
- **⚠️ Risk**: Volatility, Sharpe ratio, correlation heatmap, drawdown curve
- **🚨 Alerts**: Detected anomalies with news attribution and citations
- **🔍 Agent Trace**: Detailed execution log of multi-agent system
- **🤖 ML Forecast**: 5-day volatility forecasts with model comparison
- **📄 Briefing**: Mandate-conditioned investment report (copy-ready)

## 🏗️ Architecture

### Core Components

**1. Deterministic Core** (`core/`)
- All numeric computation (zero network, zero LLM)
- Portfolio metrics, risk calculations, anomaly detection Stage 1
- ML models with TimeSeriesSplit (never shuffled)

**2. Multi-Agent System** (`agents/`)
- **Orchestrator**: Coordinates workflow
- **Market Agent**: Fetches price data (yfinance primary)
- **Risk Agent**: Computes risk metrics
- **Anomaly Agent**: Two-stage detection (deterministic + LLM)
- **News Agent**: Retrieves and cites news for material events
- **ML Agent**: Volatility forecasting with crew coordination
- **Rebalance Agent**: Suggests weight adjustments (no orders)
- **Writer Agent**: Generates mandate-conditioned briefing (zero tools)

**3. Data Layer** (`data/`)
- File-based cache with TTL (15min prices, 1hr news)
- yfinance (no API key needed), Finnhub fallback
- News: Tavily + Marketaux with deduplication

**4. Memory & Safety** (`memory/`, `guardrails/`)
- SQLite session store (7-day deduplication)
- Input validation, output sanitization
- Mandate compliance checks
- Prevents buy/sell directives

## 🧠 ML Models

Volatility forecasting uses:
- **Linear Regression** (baseline)
- **Random Forest**
- **XGBoost**
- **GARCH** (Exponentially Weighted Moving Average)

All models validated with `TimeSeriesSplit(n_splits=5, gap=5)` - never shuffle=True for proper time-series validation.

## 🔐 Safety Features

- ✅ All news claims cited with URLs
- ✅ Writer agent has ZERO tools (cannot fabricate data)
- ✅ Guardrails prevent trading directives
- ✅ Adversarial testing (20+ test cases)
- ✅ Session memory prevents alert fatigue

## 📊 Example Use Cases

1. **Daily Portfolio Check**: Upload holdings → see risk metrics
2. **Event Attribution**: Detect what caused recent volatility
3. **Risk Reporting**: Generate mandate-compliant briefings
4. **Volatility Forecast**: Plan for next week's expected risk
5. **Rebalancing Guidance**: See drift from target allocations

## 🛠️ Technical Stack

- **UI**: Gradio 6.28
- **LLM**: Gemini 2.0 Flash (primary), Groq Llama 3.1 (fallback)
- **Data**: yfinance (free), Tavily, Marketaux
- **ML**: scikit-learn, XGBoost, pandas, numpy
- **Memory**: SQLite with 7-day TTL

## 📝 API Keys Required

This system uses:
- **Google Gemini API** (for LLM reasoning)
- **Groq API** (fallback LLM)
- **Tavily API** (news search)
- **Marketaux API** (financial news)

All keys are configured as Hugging Face Secrets (not visible in logs).

## ⚖️ License & Attribution

MIT License - Free to use, modify, and distribute.

**Credits:**
- yfinance for market data
- Tavily & Marketaux for news
- Gradio for UI framework
- Hugging Face for hosting

## 🐛 Known Limitations

- Analysis may take 30-120 seconds for large portfolios
- Free tier hardware may be slower
- Historical data limited by yfinance availability
- Non-US markets may have delayed data

## 💬 Feedback & Issues

Found a bug or have a suggestion? Open a discussion in this Space!

---

**Disclaimer**: This is a monitoring tool, not financial advice. All investment decisions should be made with professional guidance.
