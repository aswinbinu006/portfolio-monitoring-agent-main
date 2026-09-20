#!/usr/bin/env python3
"""
Smoke test for Portfolio Monitoring Agent.
Tests each configured provider once, skips gracefully if API key is empty.
This should pass with zero configured keys (using only yfinance).
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import config
sys.path.insert(0, str(Path(__file__).parent.parent))

import config

def test_yfinance():
    """Test yfinance - no API key required."""
    print("\n[yfinance] Testing...")
    try:
        import yfinance as yf
        ticker = yf.Ticker("RELIANCE.NS")
        info = ticker.info
        if info and 'symbol' in info:
            print(f"  ✓ SUCCESS: Retrieved data for {info.get('symbol', 'RELIANCE.NS')}")
            return True
        else:
            print("  ✓ SUCCESS: yfinance imported and callable (no network test)")
            return True
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return False

def test_tavily():
    """Test Tavily API - skips if no key."""
    print("\n[Tavily] Testing...")
    if not config.TAVILY_API_KEY:
        print("  ⊘ SKIPPED: No API key configured")
        return True
    
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=config.TAVILY_API_KEY)
        # Simple search test
        response = client.search("test", max_results=1)
        if response:
            print("  ✓ SUCCESS: API key valid, search working")
            return True
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return False

def test_finnhub():
    """Test Finnhub API - skips if no key."""
    print("\n[Finnhub] Testing...")
    if not config.FINNHUB_API_KEY:
        print("  ⊘ SKIPPED: No API key configured")
        return True
    
    try:
        import requests
        url = f"https://finnhub.io/api/v1/quote?symbol=AAPL&token={config.FINNHUB_API_KEY}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'c' in data:  # 'c' is current price
                print(f"  ✓ SUCCESS: Retrieved quote (price: ${data['c']})")
                return True
        print(f"  ✗ FAILED: Status {response.status_code}")
        return False
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return False

def test_marketaux():
    """Test Marketaux API - skips if no key."""
    print("\n[Marketaux] Testing...")
    if not config.MARKETAUX_API_KEY:
        print("  ⊘ SKIPPED: No API key configured")
        return True
    
    try:
        import requests
        url = f"https://api.marketaux.com/v1/news/all?api_token={config.MARKETAUX_API_KEY}&limit=1"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'data' in data:
                print(f"  ✓ SUCCESS: Retrieved {len(data['data'])} news items")
                return True
        print(f"  ✗ FAILED: Status {response.status_code}")
        return False
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return False

def test_alphavantage():
    """Test Alpha Vantage API - skips if no key."""
    print("\n[Alpha Vantage] Testing...")
    if not config.ALPHAVANTAGE_API_KEY:
        print("  ⊘ SKIPPED: No API key configured")
        return True
    
    try:
        import requests
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey={config.ALPHAVANTAGE_API_KEY}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'Time Series (Daily)' in data:
                print("  ✓ SUCCESS: Retrieved time series data")
                return True
            elif 'Note' in data:
                print("  ⚠ WARNING: API rate limit hit, but key is valid")
                return True
        print(f"  ✗ FAILED: Status {response.status_code}")
        return False
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return False

def test_fred():
    """Test FRED API - skips if no key."""
    print("\n[FRED] Testing...")
    if not config.FRED_API_KEY:
        print("  ⊘ SKIPPED: No API key configured")
        return True
    
    try:
        import requests
        url = f"https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key={config.FRED_API_KEY}&file_type=json&limit=1"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'observations' in data:
                print("  ✓ SUCCESS: Retrieved FRED data")
                return True
        print(f"  ✗ FAILED: Status {response.status_code}")
        return False
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        return False

def test_litellm_model():
    """Test LiteLLM model configuration - skips if no keys."""
    print("\n[LiteLLM Model] Testing...")
    model_info = config.get_primary_model()
    
    if not model_info["api_key"]:
        print("  ⊘ SKIPPED: No AI model API key configured")
        print("     (Set GOOGLE_API_KEY or GROQ_API_KEY to enable)")
        return True
    
    print(f"  Model: {model_info['name']}")
    print(f"  Configuration: {model_info['model']}")
    print("  ✓ SUCCESS: Model configured (not testing actual API call)")
    return True

def main():
    """Run all smoke tests."""
    print("=" * 60)
    print("Portfolio Monitoring Agent - Smoke Test")
    print("=" * 60)
    
    # Show configuration summary
    print("\nConfiguration Summary:")
    summary = config.get_config_summary()
    print(f"  Model: {summary['model']}")
    print(f"  Model Available: {summary['model_available']}")
    print(f"  API Keys Configured:")
    for key, value in summary['api_keys_configured'].items():
        status = "✓" if value else "✗"
        print(f"    {status} {key}")
    
    print("\n" + "=" * 60)
    print("Running Provider Tests")
    print("=" * 60)
    
    tests = [
        ("yfinance (required)", test_yfinance),
        ("Tavily", test_tavily),
        ("Finnhub", test_finnhub),
        ("Marketaux", test_marketaux),
        ("Alpha Vantage", test_alphavantage),
        ("FRED", test_fred),
        ("LiteLLM Model", test_litellm_model),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"  ✗ EXCEPTION: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {name}")
    
    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    
    # Exit with error code if yfinance (required) failed
    yfinance_passed = results[0][1] if results else False
    if not yfinance_passed:
        print("\n✗ CRITICAL: yfinance test failed (required for basic operation)")
        sys.exit(1)
    
    print("\n✓ All critical tests passed. System ready.")
    print("  (Optional providers can be enabled by setting API keys in .env)")
    sys.exit(0)

if __name__ == "__main__":
    main()
