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
  title: "Investment Portfolio Monitoring Agent | Institutional Risk & Analytics",
  description:
    "Production-grade investment portfolio monitoring system with two-stage anomaly detection, multi-model volatility forecasting, and institutional risk metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-slate-900 selection:text-white">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-800">
                Investment Portfolio Monitoring Agent
              </span>{" "}
              — Institutional Risk & Multi-Agent Analytics
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>RiskMetrics™ EWMA λ=0.94</span>
              <span>Cornish-Fisher VaR</span>
              <span>Isolation Forest ML</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
