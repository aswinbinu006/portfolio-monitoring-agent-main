'use client';

import React, { use } from 'react';
import DashboardPage from '@/app/dashboard/page';

interface PortfolioDynamicPageProps {
  params: Promise<{ id: string }>;
}

export default function PortfolioDynamicPage({ params }: PortfolioDynamicPageProps) {
  const { id } = use(params);
  return <DashboardPage />;
}
