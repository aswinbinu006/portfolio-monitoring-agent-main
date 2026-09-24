import { NextRequest, NextResponse } from 'next/server';
import { marketDataProvider } from '@/lib/providers/market-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'overview';
    const symbol = searchParams.get('symbol');

    if (action === 'quote' && symbol) {
      const quote = await marketDataProvider.getQuote(symbol);
      return NextResponse.json(quote);
    }

    if (action === 'history' && symbol) {
      const days = parseInt(searchParams.get('days') || '90', 10);
      const history = await marketDataProvider.getHistoricalPrices(symbol, days);
      return NextResponse.json({ symbol, history });
    }

    if (action === 'profile' && symbol) {
      const profile = await marketDataProvider.getCompanyProfile(symbol);
      return NextResponse.json(profile);
    }

    if (action === 'indices') {
      const indices = await marketDataProvider.getMarketIndices();
      return NextResponse.json(indices);
    }

    const overview = await marketDataProvider.getMarketOverview();
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('Market API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
