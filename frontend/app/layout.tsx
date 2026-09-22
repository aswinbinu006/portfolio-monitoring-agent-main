import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Investment Portfolio Monitoring Agent | LangGraph 7-Agent System",
  description:
    "Autonomous multi-agent system powered by LangGraph. Seven specialized agents collaborate across market data ingestion, risk quantification, statistical anomaly screening, live news retrieval, mandate drift detection, volatility projection, and LLM executive synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-slate-900 selection:text-white transition-colors">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Investment Portfolio Monitoring Agent
              </span>{" "}
              — LangGraph 7-Agent Orchestration &amp; Persistent Memory
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-400 dark:text-slate-500 text-[11px] font-mono">
              <span>LangGraph StateGraph</span>
              <span>•</span>
              <span>7-Agent Pipeline</span>
              <span>•</span>
              <span>SQLite Memory</span>
              <span>•</span>
              <span>LLM Synthesis</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
