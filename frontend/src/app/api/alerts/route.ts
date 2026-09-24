import { NextRequest, NextResponse } from 'next/server';
import { getUserAlerts, markAlertAsRead, getActiveUserId } from '@/lib/supabase/database';

export async function GET(req: NextRequest) {
  try {
    const userId = await getActiveUserId();
    const alerts = await getUserAlerts(userId);
    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error: any) {
    console.error('Alerts GET Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId } = body;
    if (!alertId) return NextResponse.json({ error: 'alertId is required' }, { status: 400 });

    const ok = await markAlertAsRead(alertId);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    console.error('Alerts PATCH Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update alert' }, { status: 500 });
  }
}
