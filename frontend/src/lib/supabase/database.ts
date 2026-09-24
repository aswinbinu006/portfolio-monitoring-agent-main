import { createServerSupabaseClient } from './server';
import { memoryStore, Portfolio, Holding, Alert, WatchlistItem, AgentRun, PortfolioSnapshot } from './mock-store';

export async function getActiveUserId(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;
  }
  return 'usr-demo-default';
}

export async function getUserPortfolios(userId?: string): Promise<Portfolio[]> {
  const uid = userId || await getActiveUserId();
  const supabase = await createServerSupabaseClient();
  if (supabase && uid !== 'usr-demo-default') {
    const { data } = await supabase.from('portfolios').select('*').eq('user_id', uid);
    if (data && data.length > 0) return data as Portfolio[];
  }
  return memoryStore.getPortfolios(uid);
}

export async function getPortfolioHoldings(portfolioId: string): Promise<Holding[]> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data } = await supabase.from('holdings').select('*').eq('portfolio_id', portfolioId);
    if (data && data.length > 0) return data as Holding[];
  }
  return memoryStore.getHoldings(portfolioId);
}

export async function addPortfolioHolding(holding: Omit<Holding, 'id' | 'created_at' | 'updated_at'>): Promise<Holding> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('holdings').insert([holding]).select().single();
    if (!error && data) return data as Holding;
  }
  return memoryStore.addHolding(holding);
}

export async function updatePortfolioHolding(id: string, updates: Partial<Holding>): Promise<Holding | null> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('holdings').update(updates).eq('id', id).select().single();
    if (!error && data) return data as Holding;
  }
  return memoryStore.updateHolding(id, updates);
}

export async function deletePortfolioHolding(id: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('holdings').delete().eq('id', id);
    if (!error) return true;
  }
  return memoryStore.deleteHolding(id);
}

export async function getUserAlerts(userId?: string): Promise<Alert[]> {
  const uid = userId || await getActiveUserId();
  const supabase = await createServerSupabaseClient();
  if (supabase && uid !== 'usr-demo-default') {
    const { data } = await supabase.from('alerts').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (data && data.length > 0) return data as Alert[];
  }
  return memoryStore.getAlerts(uid);
}

export async function createNewAlert(alert: Omit<Alert, 'id' | 'created_at' | 'is_read'>): Promise<Alert> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('alerts').insert([alert]).select().single();
    if (!error && data) return data as Alert;
  }
  return memoryStore.createAlert(alert);
}

export async function markAlertAsRead(id: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    if (!error) return true;
  }
  return memoryStore.markAlertRead(id);
}

export async function getUserWatchlist(userId?: string): Promise<WatchlistItem[]> {
  const uid = userId || await getActiveUserId();
  const supabase = await createServerSupabaseClient();
  if (supabase && uid !== 'usr-demo-default') {
    const { data } = await supabase.from('watchlists').select('*').eq('user_id', uid);
    if (data && data.length > 0) return data as WatchlistItem[];
  }
  return memoryStore.getWatchlist(uid);
}

export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'created_at'>): Promise<WatchlistItem> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('watchlists').insert([item]).select().single();
    if (!error && data) return data as WatchlistItem;
  }
  return memoryStore.addToWatchlist(item);
}

export async function removeFromWatchlist(symbol: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('watchlists').delete().eq('symbol', symbol);
    if (!error) return true;
  }
  return memoryStore.removeFromWatchlist(symbol);
}

export async function getPortfolioSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
  return memoryStore.getSnapshots(portfolioId);
}

export async function logAgentRun(run: Omit<AgentRun, 'id' | 'created_at'>): Promise<AgentRun> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('agent_runs').insert([run]).select().single();
    if (!error && data) return data as AgentRun;
  }
  return memoryStore.logAgentRun(run);
}

export async function getAgentRuns(userId?: string): Promise<AgentRun[]> {
  const uid = userId || await getActiveUserId();
  const supabase = await createServerSupabaseClient();
  if (supabase && uid !== 'usr-demo-default') {
    const { data } = await supabase.from('agent_runs').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (data && data.length > 0) return data as AgentRun[];
  }
  return memoryStore.getAgentRuns(uid);
}
