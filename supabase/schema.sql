-- ==============================================================================
-- AI INVESTMENT PORTFOLIO MONITORING AGENT
-- PostgreSQL / Supabase Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    benchmark VARCHAR(20) DEFAULT 'SPY' NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Holdings Table
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    company_name TEXT NOT NULL,
    asset_type VARCHAR(30) DEFAULT 'Stock' NOT NULL,
    sector VARCHAR(50) DEFAULT 'General' NOT NULL,
    quantity NUMERIC(18, 6) NOT NULL CHECK (quantity >= 0),
    buy_price NUMERIC(18, 4) NOT NULL CHECK (buy_price >= 0),
    current_price NUMERIC(18, 4) NOT NULL CHECK (current_price >= 0),
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    broker TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    holding_id UUID REFERENCES public.holdings(id) ON DELETE SET NULL,
    symbol VARCHAR(30) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL', 'DIVIDEND', 'SPLIT')),
    quantity NUMERIC(18, 6) NOT NULL,
    price NUMERIC(18, 4) NOT NULL,
    fees NUMERIC(18, 4) DEFAULT 0,
    executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT
);

-- 5. Watchlists Table
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    company_name TEXT NOT NULL,
    sector VARCHAR(50),
    target_price NUMERIC(18, 4),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, symbol)
);

-- 6. Price History (Aggregated / Cached)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    open_price NUMERIC(18, 4) NOT NULL,
    high_price NUMERIC(18, 4) NOT NULL,
    low_price NUMERIC(18, 4) NOT NULL,
    close_price NUMERIC(18, 4) NOT NULL,
    volume BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(symbol, date)
);

-- 7. Portfolio Snapshots (Performance tracking over time)
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value NUMERIC(18, 4) NOT NULL,
    total_invested NUMERIC(18, 4) NOT NULL,
    unrealized_pl NUMERIC(18, 4) NOT NULL,
    realized_pl NUMERIC(18, 4) DEFAULT 0,
    daily_change NUMERIC(18, 4) DEFAULT 0,
    cash_value NUMERIC(18, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(portfolio_id, snapshot_date)
);

-- 8. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WATCH', 'IMPORTANT', 'HIGH_PRIORITY')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('PRICE_MOVEMENT', 'CONCENTRATION', 'EARNINGS', 'SENTIMENT', 'VOLATILITY', 'DRAWDOWN', 'NEWS', 'GENERAL')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    data_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Agent Runs (Reasoning audit log)
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    tools_used TEXT[] DEFAULT '{}',
    findings TEXT,
    result TEXT,
    confidence VARCHAR(20) DEFAULT 'MODERATE',
    data_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Agent Insights
CREATE TABLE IF NOT EXISTS public.agent_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    insight_type VARCHAR(40) NOT NULL,
    summary TEXT NOT NULL,
    observations JSONB DEFAULT '[]'::jsonb,
    key_factors JSONB DEFAULT '[]'::jsonb,
    risks JSONB DEFAULT '[]'::jsonb,
    confidence VARCHAR(20) DEFAULT 'MODERATE',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. News Items
CREATE TABLE IF NOT EXISTS public.news_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL,
    url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    sentiment_score NUMERIC(5, 3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Sentiment Results
CREATE TABLE IF NOT EXISTS public.sentiment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('COMPANY', 'SECTOR', 'MARKET')),
    target_identifier VARCHAR(50) NOT NULL,
    score NUMERIC(5, 3) NOT NULL,
    label VARCHAR(20) NOT NULL CHECK (label IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
    article_count INT DEFAULT 0,
    themes TEXT[] DEFAULT '{}',
    confidence NUMERIC(5, 3) DEFAULT 0.5,
    analyzed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. Forecast Results
CREATE TABLE IF NOT EXISTS public.forecast_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(30) NOT NULL,
    horizon VARCHAR(10) NOT NULL CHECK (horizon IN ('1M', '3M', '6M', '1Y')),
    bull_case JSONB NOT NULL,
    base_case JSONB NOT NULL,
    bear_case JSONB NOT NULL,
    signals_used JSONB DEFAULT '{}'::jsonb,
    uncertainty_score NUMERIC(5, 3) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'USD',
    default_benchmark VARCHAR(20) DEFAULT 'SPY',
    risk_tolerance VARCHAR(20) DEFAULT 'MODERATE' CHECK (risk_tolerance IN ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE')),
    alert_thresholds JSONB DEFAULT '{"daily_loss_pct": 3.0, "concentration_pct": 20.0, "drawdown_pct": 10.0}'::jsonb,
    notification_preferences JSONB DEFAULT '{"email": false, "in_app": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON public.holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON public.transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date ON public.price_history(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON public.portfolio_snapshots(portfolio_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_symbol ON public.news_items(symbol, published_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read & update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Portfolios: Users can only manage their own portfolios
CREATE POLICY "Users can manage own portfolios" ON public.portfolios
    FOR ALL USING (auth.uid() = user_id);

-- Holdings: Users can manage holdings belonging to their portfolios
CREATE POLICY "Users can manage own holdings" ON public.holdings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE public.portfolios.id = public.holdings.portfolio_id 
            AND public.portfolios.user_id = auth.uid()
        )
    );

-- Transactions: Users can manage transactions in their portfolios
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE public.portfolios.id = public.transactions.portfolio_id 
            AND public.portfolios.user_id = auth.uid()
        )
    );

-- Watchlists: Users can manage their own watchlist
CREATE POLICY "Users can manage own watchlist" ON public.watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio Snapshots
CREATE POLICY "Users can view own snapshots" ON public.portfolio_snapshots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE public.portfolios.id = public.portfolio_snapshots.portfolio_id 
            AND public.portfolios.user_id = auth.uid()
        )
    );

-- Alerts
CREATE POLICY "Users can manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

-- Agent Runs
CREATE POLICY "Users can manage own agent runs" ON public.agent_runs
    FOR ALL USING (auth.uid() = user_id);

-- Agent Insights
CREATE POLICY "Users can view insights for own portfolios" ON public.agent_insights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE public.portfolios.id = public.agent_insights.portfolio_id 
            AND public.portfolios.user_id = auth.uid()
        )
    );

-- User Preferences
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);
