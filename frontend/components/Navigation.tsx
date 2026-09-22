"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMarketStatus, MarketStatus } from "@/lib/api";

const NAV_LINKS = [
  { href: "/portfolio", label: "1. Portfolio & Mandate" },
  { href: "/dashboard", label: "2. Multi-Agent Monitoring & AI Report" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const data = await getMarketStatus();
        if (mounted) setMarketStatus(data);
      } catch (err) {
        // Fallback silently
      }
    };
    fetchStatus();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="leading-none text-sm font-black text-slate-900 tracking-wider uppercase">
                  Portfolio Agent
                </span>
                <span className="text-[10px] text-blue-600 font-semibold tracking-normal mt-0.5">
                  LangGraph 7-Agent System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href === "/portfolio" && pathname === "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                      isActive
                        ? "bg-slate-100 text-blue-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Session / Engine Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Orchestrator: <strong>LangGraph</strong></span>
            </div>

            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <span>Run Pipeline</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
