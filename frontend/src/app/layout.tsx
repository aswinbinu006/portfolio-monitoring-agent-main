import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Investment Portfolio Monitoring Agent | Institutional Capital Intelligence',
  description: 'Autonomous quantitative investment portfolio monitoring agent with real-time risk detection, scenario forecasting, market sentiment analysis, and tool-calling reasoning.',
  keywords: ['portfolio monitoring', 'AI agent', 'quantitative finance', 'investment risk', 'scenario forecasting', 'market intelligence'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
