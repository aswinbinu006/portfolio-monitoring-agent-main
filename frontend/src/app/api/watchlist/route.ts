import { NextRequest, NextResponse } from 'next/server';
import { getUserWatchlist, addToWatchlist, removeFromWatchlist, getActiveUserId } from '@/lib/supabase/database';
import { marketDataProvider } from '@/lib/providers/market-data';

export async function GET(req: NextRequest) {
  try {
    const userId = await getActiveUserId();
    const watchlist = await getUserWatchlist(userId);

    // Enrich with quotes
    const symbols = watchlist.map(w => w.symbol);
    const quotes = await marketDataProvider.getQuotes(symbols);

    const enriched = watchlist.map(w => ({
      ...w,
      quote: quotes[w.symbol] || null,
    }));

    return NextResponse.json({ watchlist: enriched });
  } catch (error: any) {
    console.error('Watchlist GET Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, targetPrice, notes } = body;
    if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

    const userId = await getActiveUserId();
    const profile = await marketDataProvider.getCompanyProfile(symbol);

    const item = await addToWatchlist({
      user_id: userId,
      symbol: symbol.toUpperCase().trim(),
      company_name: profile.companyName,
      sector: profile.sector,
      target_price: targetPrice ? Number(targetPrice) : undefined,
      notes,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Watchlist POST Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add to watchlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

    const ok = await removeFromWatchlist(symbol);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    console.error('Watchlist DELETE Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to remove from watchlist' }, { status: 500 });
  }
}
