import { NextRequest, NextResponse } from 'next/server';
import { runPortfolioAgent } from '@/lib/agent/core';
import { getActiveUserId, getUserPortfolios } from '@/lib/supabase/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, portfolioId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const userId = await getActiveUserId();
    const portfolios = await getUserPortfolios(userId);
    const activePortfolioId = portfolioId || portfolios[0]?.id || 'port-demo-001';

    const trace = await runPortfolioAgent(query, {
      userId,
      portfolioId: activePortfolioId,
    });

    return NextResponse.json(trace);
  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute agent reasoning' },
      { status: 500 }
    );
  }
}
