# AI Investment Portfolio Monitoring Agent

An institutional-grade, real-time autonomous investment portfolio monitoring agent architected natively for **Vercel Serverless** and **Next.js App Router**. The platform provides multi-asset portfolio monitoring, deterministic quantitative risk analytics, multi-horizon scenario forecasting, financial press sentiment evaluation, brokerage CSV ingestion, and tool-calling AI agent synthesis powered by Google Gemini 2.5 Flash.

---

## 1. Project Overview

The **AI Investment Portfolio Monitoring Agent** acts as an autonomous digital portfolio analyst. It continuously observes portfolio health, detects unusual price deviations, audits concentration risks against risk management limits, monitors news headlines for sentiment shifts, and formulates Bull, Base, and Bear forward scenarios with quantified uncertainty.

### Core Distinctions
- **Real Agent Architecture**: Implements an autonomous loop (`Observe → Understand → Select Tools → Execute → Analyze → Assess Risk → Generate Alerts & Insights → Audit Log`).
- **Deterministic Quantitative Math**: Financial metrics (Sharpe ratio, Beta, Max Drawdown, Annualized Volatility, Herfindahl Concentration Index) are computed via strict deterministic TypeScript algorithms rather than approximate LLM hallucinations.
- **Financial Safety By Design**: Never executes automated buy/sell orders. Does not make speculative guarantees or predictions. All forward projections are explicitly framed as model-generated scenarios with confidence bounds and methodology notes.
- **Zero-Friction Evaluation**: Runs out of the box with built-in resilient market data feeds, real security profiles (AAPL, NVDA, MSFT, AMZN, TSLA, JPM, LLY, SPY, RELIANCE, TCS), and pre-populated institutional demo portfolios.

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router, Serverless Functions, Route Handlers, Turbopack)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS (Restrained financial terminal aesthetic: `#F7F8FA` neutral canvas, slate contrast, muted green/red status indicators)
- **AI & Reasoning**: Google Gen AI SDK (`@google/genai`) with Gemini 2.5 Flash / Gemini 1.5 Pro
- **Database & Auth**: Supabase PostgreSQL + Row Level Security (RLS) + JWT authentication SSR
- **Data Validation**: Zod schema validation across all tool inputs, outputs, CSV rows, and API routes
- **Charting**: Recharts (Interactive Valuation Curves, Benchmark Overlays, Sector Donut Charts, and Scenario Projections)
- **File Parsing**: PapaParse with header normalization and validation preview

---

## 3. Agent Tool Layer (30+ Zod-Validated Tools)

The agent operates over a modular tool layer located in `src/lib/agent/tools.ts`:

### Portfolio Tools
- `getPortfolio()`: Retrieves portfolio metadata, currency, and benchmark.
- `getHoldings()`: Fetches active holdings, quantities, cost basis, and current prices.
- `calculatePortfolioValue()`: Computes total portfolio market value and invested capital.
- `calculatePortfolioReturn()`: Computes unrealized P/L ($ and %).
- `calculateDailyChange()`: Calculates today's estimated session dollar and percentage move.
- `calculateAllocation()`: Calculates individual security percentage weights.
- `calculateSectorExposure()`: Evaluates exposure distribution across GICS economic sectors.
- `calculateConcentrationRisk()`: Computes Herfindahl-Hirschman Index (HHI) and top-holding weights.
- `calculatePortfolioVolatility()`: Computes annualized standard deviation of returns.
- `calculateDrawdown()`: Evaluates peak-to-trough historical drawdown.
- `calculateHoldingContribution()`: Breaks down top gainers and losers and return attribution.

### Market Tools
- `getCurrentQuote()`: Fetches latest real-time or delayed quote for any ticker.
- `getHistoricalPrices()`: Fetches historical OHLCV bars for technical indicators.
- `getMarketIndexData()`: Fetches status for S&P 500, Nasdaq, Dow Jones, NIFTY 50, and CBOE VIX.
- `getMarketOverview()`: Assesses macro regime (Risk-On, Risk-Off, High Volatility, etc.) and breadth.

### Company & Fundamentals Tools
- `getCompanyProfile()`: Retrieves sector, industry, market cap, and business description.
- `getCompanyFinancialData()`: Retrieves P/E ratio, Beta, Dividend Yield, and 52-week ranges.
- `getCompanyNews()`: Fetches recent verified headlines and summaries.
- `getEarningsInformation()`: Retrieves quarterly earnings dates and status.
- `getCorporateEvents()`: Fetches dividend dates and major investor conferences.

### Sentiment Tools
- `searchRelevantNews()`: Ingests financial press releases.
- `analyzeNewsSentiment()`: Computes numerical sentiment scores (-1.0 to +1.0).
- `analyzeCompanySentiment()`: Evaluates company-specific news narrative and themes.
- `analyzeMarketSentiment()`: Evaluates macroeconomic news sentiment.

### Risk Tools
- `calculateRiskMetrics()`: Comprehensive Sharpe, Beta, Volatility, and Drawdown audit.
- `detectConcentration()`: Flags single-stock (>25%) or single-sector (>40%) concentration.
- `detectUnusualMovement()`: Identifies intraday price swings exceeding 2.5%.
- `detectPortfolioRisk()`: Combines systemic factors into a consolidated risk tier (LOW, MODERATE, HIGH, CRITICAL).

### Forecast Tools
- `generatePriceForecast()`: Runs multi-horizon Bull/Base/Bear projections.
- `generatePortfolioScenario()`: Simulates portfolio value under stress conditions.
- `calculateTrendIndicators()`: Computes 20/50/200 SMA, 12/26 EMA, 14-day RSI, and MACD.
- `generateBullBaseBearScenario()`: Detailed scenario cards with assumptions and catalysts.

### Alert Tools
- `createAlert()`: Dispatches prioritized notification to the alerts center.
- `getAlerts()`: Fetches active alerts sorted by priority matrix.
- `markAlertRead()`: Acknowledges and archives alerts.

---

## 4. Quantitative Financial & Forecasting Methodology

### Risk Metrics
1. **Annualized Volatility**:
   $$\sigma_{\text{annual}} = \sigma_{\text{daily}} \times \sqrt{252}$$
2. **Sharpe Ratio**:
   $$\text{Sharpe} = \frac{R_{\text{portfolio}} - R_{\text{risk-free}}}{\sigma_{\text{annual}}}$$
   *(Uses a standard 4.5% risk-free rate assumption)*
3. **Portfolio Beta**:
   $$\beta = \frac{\text{Cov}(R_{\text{portfolio}}, R_{\text{benchmark}})}{\text{Var}(R_{\text{benchmark}})}$$
4. **Concentration Index (Herfindahl-Hirschman Index - HHI)**:
   $$\text{HHI} = \sum_{i=1}^{n} w_i^2$$
   - $\text{HHI} < 1,500$: Well-Diversified
   - $1,500 \le \text{HHI} \le 2,500$: Moderately Concentrated
   - $\text{HHI} > 2,500$: Highly Concentrated

### Multi-Horizon Scenario Engine
The forecasting engine does **not** prompt an LLM to guess a price. Instead, it computes:
1. **Ordinary Least Squares (OLS) Linear Trend Regression** over trailing 60-day closes.
2. **Realized Volatility Diffusion Bounds** ($\sigma \sqrt{t}$).
3. **Technical Momentum Offsets**: Adjusts expected drift based on 14-day RSI oversold/overbought states and 50-day moving average positioning.
4. **Ensemble Scenario Bounds**:
   - **Bull Case**: Baseline expected drift $+ 1.1 \times \sigma_{\text{horizon}}$
   - **Base Case**: Expected drift with standard diffusion band
   - **Bear Case**: Baseline expected drift $- 1.1 \times \sigma_{\text{horizon}}$

---

## 5. Database Schema & Supabase Setup

The complete PostgreSQL migration script is provided in `supabase/schema.sql`.

### Tables
- `profiles`: User accounts linked with `auth.users`
- `portfolios`: Isolated portfolio accounts with benchmark & currency
- `holdings`: Individual asset positions, cost basis, quantities, and sectors
- `transactions`: Buy, sell, dividend audit ledger
- `watchlists`: Unowned securities tracked by user
- `price_history`: Cached daily OHLCV bars
- `portfolio_snapshots`: Daily equity snapshots for chart history
- `alerts`: Prioritized alerts (HIGH_PRIORITY, IMPORTANT, WATCH, INFO)
- `agent_runs`: Audit trail of all AI reasoning queries, tools used, and results
- `agent_insights`: High-level portfolio insights
- `news_items`: Financial news feed items
- `sentiment_results`: Sentiment scores and themes
- `forecast_results`: Multi-scenario forecast records
- `user_preferences`: Risk tolerance and alert thresholds

### Setting Up Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the entire content of `supabase/schema.sql`.
4. Copy your project URL, anon publishable key, and service role key into `.env.local`.

---

## 6. Environment Variables Configuration

The system is architected into separated **Frontend (Vercel)** and **Backend (Render)** services.

### Frontend Environment (`frontend/.env.local` / Vercel Settings)
The frontend communicates strictly through the backend API. It does **not** directly hold or expose third-party API keys.

| Variable | Description | Production / Default Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Fast API backend endpoint | `https://portfolio-monitoring-agent-main.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | Frontend public domain | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (Optional) | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Anon Key (Optional) | Client-side anon key |

### Backend Environment (`backend/.env` / Render Settings)
All secure AI, news, and market provider API keys are stored exclusively in the backend.

| Variable | Description | Required? |
|---|---|---|
| `GOOGLE_API_KEY` | Google Gemini API Key for agent synthesis | Recommended |
| `GROQ_API_KEY` | Groq API Key (Fallback Llama model) | Optional |
| `JWT_SECRET` | Secret key for signing JWT tokens | Recommended (has secure local fallback) |
| `PORT` | Listening port for FastAPI server | `7860` (Render sets automatically) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `https://portfolio-monitoring-agent-six.vercel.app,http://localhost:3000` |
| `TAVILY_API_KEY` | Real-time financial search & news provider | Optional (Graceful fallback) |
| `MARKETAUX_API_KEY` | Financial press sentiment API | Optional (Graceful fallback) |
| `Z_THRESHOLD` | Statistical anomaly detection threshold ($Z$-score) | `2.0` |
| `DRIFT_TOLERANCE` | Portfolio rebalance weight drift threshold | `0.05` |
| `EWMA_LAMBDA` | Volatility decay factor (RiskMetrics) | `0.94` |
| `CACHE_TTL_SECONDS` | In-memory cache TTL | `900` |

---

## 7. Local Installation & Development

### Backend (FastAPI & LangGraph)
```bash
# 1. Navigate to backend
cd backend

# 2. Configure environment
cp .env.example .env

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start backend server
uvicorn api.main:app --host 0.0.0.0 --port 7860 --reload
```

### Frontend (Next.js)
```bash
# 1. Navigate to frontend
cd frontend

# 2. Configure environment
cp .env.example .env.local

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Cloud Deployments

- **Frontend (Vercel)**:
  - Root Directory: `frontend`
  - Set `NEXT_PUBLIC_API_URL` to your Render backend URL.
  - Vercel automatically detects Next.js and builds using Turbopack.

- **Backend (Render)**:
  - Root Directory: `backend` (or repo root pointing to `requirements.txt`)
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT` (or `uvicorn api.main:app --host 0.0.0.0 --port $PORT`)
  - Set backend environment variables (`GOOGLE_API_KEY`, `JWT_SECRET`, `CORS_ORIGINS`, etc.).

---

## 9. Regulatory & Financial Safety Disclaimer

> [!IMPORTANT]
> **Financial Safety Notice**:
> This software is an informational portfolio monitoring and quantitative research tool. It does **not** provide personalized financial advice, broker-dealer execution, or trading routing. Model-generated forecasts and scenarios are mathematical projections based on historical statistical signals and do **not** represent guarantees of future performance. Users remain solely responsible for all investment decisions.
