# 📊 Investment Portfolio Monitoring Agent - PROJECT SUMMARY

## 🎯 Project Overview

**A multi-agent Python system that monitors equity/ETF portfolios, detects statistically material risk events, retrieves and cites causes, and generates mandate-conditioned briefings.**

**Critical Constraint**: This is a **monitoring and explanation system, NOT a trading system** - it never places orders and never issues buy/sell directives.

---

## ✅ COMPLETION STATUS: 19/19 Tasks (100%)

### Phase 0: Foundation ✅
- ✅ Complete directory structure
- ✅ requirements.txt with all dependencies
- ✅ config.py with environment loading
- ✅ .env.example with 11 environment variables
- ✅ .gitignore excluding secrets
- ✅ Smoke test script

### Phase 1: Core Computation ✅
- ✅ portfolio.py (Portfolio/Holding dataclasses, CSV I/O)
- ✅ metrics.py (Exact formulas: volatility, Sharpe, Sortino, drawdown, beta, VaR, CVaR, HHI)
- ✅ anomaly.py (EWMA volatility, z-scores, Stage 1 detection)
- ✅ test_metrics.py (Hand-verified fixture: 29.99% vol, 1.901 Sharpe, -2.50% MDD)

### Phase 2: Data Layer ✅
- ✅ providers.py (yfinance primary, Finnhub fallback, NSE/BSE support)
- ✅ cache.py (File-based with TTL: 15min prices, 1hr news, 24hr fundamentals)
- ✅ news.py (Tavily + Marketaux with deduplication)

### Phase 3: Agent Foundation ✅
- ✅ news_agent.py (OpenAI Agents SDK + LiteLLM, Gemini/Groq)
- ✅ memory/store.py (SQLite with 7-day deduplication)
- ✅ tools/ (news_tools, market_tools wrapped as function_tools)

### Phase 4: Multi-Agent Orchestration ✅
- ✅ orchestrator.py (7-agent workflow coordinator)
- ✅ Specialist agents: market, risk, anomaly, news, rebalance, ml, writer
- ✅ guardrails/rails.py (Input/output validation, blocks buy/sell advice)
- ✅ test_guardrails.py (20+ adversarial test cases)

### Phase 5: ML Forecasting ✅
- ✅ features.py (Comprehensive volatility features, 30+ features)
- ✅ models.py (LR, RF, XGBoost with TimeSeriesSplit - NEVER shuffle)
- ✅ ml_crew.py (CrewAI pipeline: FeatureEngineer → ModelTrainer → ResultsAnalyst)
- ✅ Predicts 5-day forward realized volatility

### Phase 6: Advanced Integration ✅
- ✅ langgraph_flow.py (State graph with conditional edges)
- ✅ render_graph.py (Mermaid diagram export)
- ✅ mcp/server.py (Gradio MCP server with 3 tools)

### Phase 7: User Interface ✅
- ✅ app.py (7-tab Gradio interface)
- ✅ --offline flag (Parquet snapshots)
- ✅ n8n/workflow.json (Automated alerting)

---

## 🏗️ Architecture

```
portfolio_agent/
├── core/          # Pure computation (zero network, zero LLM)
│   ├── portfolio.py      # Data structures
│   ├── metrics.py        # Risk formulas (hand-verified)
│   ├── anomaly.py        # EWMA & z-scores
│   ├── features.py       # ML feature engineering
│   └── models.py         # Volatility forecasting
│
├── data/          # External data access
│   ├── providers.py      # yfinance + Finnhub
│   ├── cache.py          # TTL-based caching
│   └── news.py           # Tavily + Marketaux
│
├── agents/        # Specialist agents
│   ├── orchestrator.py   # Main coordinator
│   ├── market_agent.py   # Data fetching
│   ├── risk_agent.py     # Metrics interpretation
│   ├── anomaly_agent.py  # Stage 1 detection
│   ├── news_agent.py     # Stage 2 explanation
│   ├── rebalance_agent.py # Drift detection
│   ├── ml_agent.py       # ML forecasting
│   └── writer_agent.py   # Briefing (ZERO TOOLS)
│
├── tools/         # Function tool wrappers
├── guardrails/    # Input/output validation
├── memory/        # SQLite session storage
├── crew/          # CrewAI ML pipeline
├── graph/         # LangGraph state machine
├── mcp/           # Model Context Protocol server
├── n8n/           # Automation workflow
└── app.py         # Main Gradio UI
```

---

## 🔬 Key Technical Achievements

### 1. Two-Stage Detection Model
- **Stage 1** (Deterministic): Z-score, contribution, drift detection - no LLM
- **Stage 2** (LLM): Only processes Stage 1 flagged events - efficient

### 2. Exact Formula Implementation
All metrics verified against hand-calculated fixture:
- Annualized volatility: `std(r) × √252`
- Sharpe: `(mean(r) - rf) / std(r) × √252`
- Max drawdown: `min((V - Vmax) / Vmax)`
- EWMA: `σ²_t = 0.94σ²_{t-1} + 0.06r²_{t-1}`

### 3. Proper ML Validation
- `TimeSeriesSplit(n_splits=5, gap=5)`
- **NEVER** uses `shuffle=True`
- Reports mean ± std across all folds
- Naive persistence baseline for comparison

### 4. Comprehensive Guardrails
- **Input Rails**: Block buy/sell requests, off-topic, manipulation
- **Output Rails**: Block directives, check citations, validate numbers
- Tested with 20+ adversarial prompts

### 5. Multi-Framework Integration
- **OpenAI Agents SDK** with LiteLLM (Gemini 2.0 Flash / Groq Llama 3.1)
- **CrewAI** for ML pipeline
- **LangGraph** for state machine workflow
- **Gradio** for UI and MCP server
- **n8n** for automation

---

## 📊 Data Sources

### Market Data
- **Primary**: yfinance (NO API KEY)
  - NSE stocks: `.NS` suffix
  - BSE stocks: `.BO` suffix
  - US stocks: plain ticker
- **Fallback**: Finnhub (optional)

### News Sources
- **Tavily**: AI-optimized search
- **Marketaux**: Financial news API
- Deduplication by URL
- Date proximity scoring

### AI Models
- **Primary**: Google Gemini 2.0 Flash
- **Fallback**: Groq Llama 3.1 8B
- Auto-fallback if primary unavailable

---

## 🎯 Core Capabilities

### Risk Analysis
- Volatility (realized & EWMA)
- Sharpe & Sortino ratios
- Max drawdown with date
- VaR & CVaR (95%, 99%)
- Beta vs benchmark
- HHI concentration

### Anomaly Detection
- Z-score threshold breaches
- Large portfolio contributions
- Weight drift from targets
- Drawdown tolerance breaches

### News Attribution
- Event cause finding
- Citation with URLs
- Explicit "unexplained" when no cause found
- **Never fabricates**

### ML Forecasting
- 5-day forward realized volatility
- 3 models + naive baseline
- Cross-validation with gap
- Feature importance analysis

### Briefing Generation
- Mandate-conditioned
- All claims cited or computed
- Explicit disclaimers
- **Zero tools** - cannot fabricate

---

## 🔒 Safety & Compliance

### Never Does
- ❌ Place orders
- ❌ Issue buy/sell directives
- ❌ Provide investment advice
- ❌ Fabricate news or data
- ❌ Shuffle time-series data

### Always Does
- ✅ Cite sources with URLs
- ✅ State "unexplained" when uncertain
- ✅ Cross-check numbers vs computed
- ✅ Block directive language
- ✅ Include disclaimers

### Deduplication
- 7-day window for same ticker+cause
- Prevents alert fatigue
- SQLite session tracking

---

## 📈 Performance Metrics

### Test Coverage
- ✅ Hand-verified fixture (10-day sample)
- ✅ All metrics functions tested
- ✅ Anomaly detection validated
- ✅ 20+ guardrail adversarial cases

### Caching Efficiency
- 15min: Price data
- 1hr: News
- 24hr: Fundamentals
- Zero redundant calls within TTL

### ML Model Comparison
- Linear Regression (baseline)
- Random Forest (ensemble)
- XGBoost (gradient boosting)
- Naive persistence (benchmark)

---

## 🚀 Deployment Options

### 1. Local Gradio UI
```bash
python app.py
# Opens on http://localhost:7860
```

### 2. Offline Mode
```bash
python app.py --offline
# Uses frozen Parquet snapshot
```

### 3. MCP Server
```bash
python mcp/server.py
# Exposes metrics as MCP tools
```

### 4. n8n Automation
- Import workflow.json
- Configure OAuth in n8n UI
- Daily email/calendar/sheets updates

### 5. LangGraph API
```python
from graph.langgraph_flow import run_portfolio_monitoring_workflow
results = run_portfolio_monitoring_workflow(portfolio)
```

---

## 📋 API Keys Summary

### Required (at least ONE)
- `GOOGLE_API_KEY` or `GROQ_API_KEY`

### Optional (full features)
- `TAVILY_API_KEY` (news search)
- `MARKETAUX_API_KEY` (financial news)

### Not Required
- `FINNHUB_API_KEY` (fallback, yfinance primary)
- `ALPHAVANTAGE_API_KEY` (covered by yfinance)
- `FRED_API_KEY` (US economic data only)
- `HF_TOKEN` (ML models optional)

---

## 🧪 Testing Strategy

### Unit Tests
- `test_metrics.py`: Core computations
- `test_guardrails.py`: Safety validation

### Integration Tests
- Orchestrator workflow
- Agent coordination
- Tool execution

### Adversarial Tests
- Buy/sell requests
- Directive language
- Uncited claims
- Prompt injection

---

## 📚 Key Files

### Configuration
- `.env` - API keys (user creates from .env.example)
- `config.py` - Settings with defaults
- `requirements.txt` - All dependencies

### Core Logic
- `core/metrics.py` - Risk formulas (191 lines)
- `core/anomaly.py` - Detection (245 lines)
- `agents/orchestrator.py` - Workflow (213 lines)

### User Interfaces
- `app.py` - Gradio UI (347 lines)
- `mcp/server.py` - MCP tools (253 lines)

### Documentation
- `README.md` - Full documentation
- `QUICKSTART.md` - 5-minute setup
- `PROJECT_SUMMARY.md` - This file

---

## 🎓 Learning Resources

### Understand the Formulas
- `core/metrics.py` - All formulas with docstrings
- `eval/tests/test_metrics.py` - Verified examples

### Understand the Agents
- `agents/orchestrator.py` - Full workflow
- `agents/writer_agent.py` - Zero-tools example
- `agents/news_agent.py` - LLM with tools

### Understand ML Pipeline
- `core/features.py` - Feature engineering
- `core/models.py` - TimeSeriesSplit validation
- `crew/ml_crew.py` - CrewAI orchestration

---

## 🏆 Project Highlights

1. **Complete Implementation**: 19/19 tasks, all phases done
2. **Production Ready**: Error handling, logging, caching
3. **Well Tested**: Unit tests, integration tests, adversarial tests
4. **Properly Validated**: Hand-verified fixtures, no shuffle on time-series
5. **Safety First**: Comprehensive guardrails, no trading capability
6. **Multi-Framework**: OpenAI Agents, CrewAI, LangGraph, Gradio
7. **Indian Market Support**: NSE/BSE tickers, INR, Indian indices
8. **Flexible Deployment**: CLI, UI, MCP, n8n automation
9. **Extensive Documentation**: README, QUICKSTART, inline docs
10. **API Key Flexibility**: Works with zero optional keys

---

## 🎯 Success Criteria Met

✅ All numeric computation in core/ (zero network, zero LLM)  
✅ All API keys from environment variables  
✅ OpenAI Agents SDK with LiteLLM (Gemini primary, Groq fallback)  
✅ TimeSeriesSplit with gap=5, NEVER shuffle  
✅ Every claim cited or marked unexplained  
✅ Cache all API responses with TTL  
✅ Exact formulas match hand-verified fixture  
✅ Two-stage detection (deterministic → LLM)  
✅ Writer agent has ZERO TOOLS  
✅ Guardrails tested with adversarial prompts  

---

## 🚀 Quick Start

```bash
# 1. Install
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Add GOOGLE_API_KEY or GROQ_API_KEY

# 3. Test
python scripts/smoke_test.py

# 4. Run
python app.py

# 5. Open
# http://localhost:7860
```

---

## 📞 Support

- **Documentation**: See README.md
- **Quick Setup**: See QUICKSTART.md
- **Tests**: Run `pytest` for validation
- **Issues**: Check smoke test output

---

**Built with precision. Monitored with intelligence. Explained with citations.** 🎯
