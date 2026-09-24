import { NextRequest, NextResponse } from 'next/server';
import { newsProvider } from '@/lib/providers/news-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'market';
    const symbol = searchParams.get('symbol') || 'AAPL';
    const sector = searchParams.get('sector') || 'Technology';

    if (action === 'company') {
      const news = await newsProvider.getCompanyNews(symbol);
      const sentiment = await newsProvider.analyzeCompanySentiment(symbol);
      return NextResponse.json({ news, sentiment });
    }

    if (action === 'sector') {
      const sentiment = await newsProvider.analyzeSectorSentiment(sector);
      return NextResponse.json(sentiment);
    }

    const news = await newsProvider.getMarketNews();
    const sentiment = await newsProvider.analyzeMarketSentiment();
    return NextResponse.json({ news, sentiment });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch news and sentiment' },
      { status: 500 }
    );
  }
}
