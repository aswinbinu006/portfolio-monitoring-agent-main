# 🚀 QUICKSTART GUIDE

Get the Portfolio Monitoring Agent running in 5 minutes!

## ✅ Prerequisites

- Python 3.8+
- At least ONE AI model API key (Google Gemini OR Groq)

## 📋 Step 1: Install Dependencies

```powershell
cd portfolio_agent
pip install -r requirements.txt
```

## 🔑 Step 2: Configure API Keys

```powershell
# Copy the example
Copy-Item .env.example .env

# Edit .env and add AT LEAST ONE of these:
# - GOOGLE_API_KEY (get from https://ai.google.dev/)
# - GROQ_API_KEY (get from https://console.groq.com/)

# Optional but recommended for full features:
# - TAVILY_API_KEY (news search)
# - MARKETAUX_API_KEY (financial news)
```

## 🧪 Step 3: Run Smoke Test

```powershell
python scripts/smoke_test.py
```

Expected output:
```
✓ PASS: yfinance (required)
✓ PASS: Tavily
✓ PASS: Marketaux
...
Results: 6/7 tests passed
✓ All critical tests passed. System ready.
```

## 📊 Step 4: Create Sample Portfolio

Create `sample_portfolio.csv`:
```csv
ticker,quantity,target_weight
RELIANCE.NS,100,0.30
TCS.NS,50,0.25
INFY.NS,75,0.25
HDFCBANK.NS,40,0.20
```

## 🎯 Step 5: Run the App

```powershell
python app.py
```

Then open: http://localhost:7860

## 📱 Using the App

### Portfolio Tab
1. Upload your `sample_portfolio.csv`
2. Select mandate (conservative/balanced/aggressive)
3. Set days of history (default 90)
4. Click "Run Analysis"

### Other Tabs
- **Dashboard**: Value charts, allocation, drift
- **Risk**: Volatility, Sharpe, drawdown, VaR, CVaR
- **Alerts**: Anomalies with news citations
- **Agent Trace**: Execution log with tool calls
- **ML Forecast**: Model comparison (LR, RF, XGBoost)
- **Briefing**: Final report with copy button

## 🔧 Alternative: Command Line

```python
from core.portfolio import Portfolio
from agents.orchestrator import Orchestrator

# Load portfolio
portfolio = Portfolio.from_csv("sample_portfolio.csv")

# Run analysis
orchestrator = Orchestrator()
results = orchestrator.run_full_analysis(
    portfolio=portfolio,
    days=90,
    mandate="balanced",
    drawdown_tolerance=-0.15
)

# View briefing
print(results["briefing"])
```

## 🚫 Offline Mode (Demo without API calls)

```powershell
python app.py --offline
```

Uses frozen data snapshot - perfect for demos or testing without live market data.

## 🧪 Run Tests

```powershell
# All tests
pytest

# Specific test suite
pytest eval/tests/test_metrics.py
pytest eval/tests/test_guardrails.py

# With coverage
pytest --cov=portfolio_agent --cov-report=html
```

## 🔍 What Works Without Optional Keys

### ✅ With ZERO optional keys:
- ✅ Market data (yfinance)
- ✅ Risk metrics calculation
- ✅ Anomaly detection (Stage 1)
- ✅ ML forecasting
- ✅ Portfolio monitoring

### ❌ Without optional keys:
- ❌ News explanations (Stage 2)
- ❌ Event cause attribution

### 💡 Recommendation:
Get at least Tavily API key for full experience (news explanations).

## 📊 Indian Stock Format

Use NSE or BSE suffixes:
- NSE: `RELIANCE.NS`, `TCS.NS`, `INFY.NS`
- BSE: `RELIANCE.BO`, `TCS.BO`, `INFY.BO`

## 🎛️ Advanced: MCP Server

Expose metrics as MCP tools:

```powershell
python mcp/server.py
```

Opens on http://localhost:7861 with OpenAPI spec.

## 🔗 Advanced: n8n Automation

1. Import `n8n/workflow.json` into n8n
2. Configure OAuth credentials in n8n UI (Gmail, Sheets, Calendar)
3. Set portfolio path and email
4. Activate workflow

Daily automated monitoring with email alerts!

## ❓ Troubleshooting

### "yfinance test failed"
```powershell
pip install --upgrade yfinance
```

### "No module named 'openai-agents'"
```powershell
pip install "openai-agents[litellm]"
```

### "No model configured"
Add at least one AI API key to `.env`:
- GOOGLE_API_KEY or GROQ_API_KEY

### "Failed to fetch price data"
Check ticker format:
- Indian stocks: Add `.NS` or `.BO` suffix
- US stocks: Use plain ticker (AAPL, MSFT)

## 📚 Learn More

- [README.md](README.md) - Full documentation
- [config.py](config.py) - Configuration options
- [eval/tests/](eval/tests/) - Test suites
- [agents/](agents/) - Agent implementations

## 🎯 Next Steps

1. ✅ Run smoke test
2. ✅ Create your portfolio CSV
3. ✅ Launch the app
4. ✅ Explore different tabs
5. ✅ Try offline mode
6. ✅ Run tests
7. ✅ Read full documentation

## 🆘 Need Help?

Check the main [README.md](README.md) for:
- Detailed installation instructions
- API key setup guides
- Architecture overview
- Formula documentation
- Testing guidelines
- Troubleshooting tips

---

**Ready to monitor your portfolio? Run `python app.py` and visit http://localhost:7860** 🚀
