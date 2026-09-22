"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMarketStatus, MarketStatus, getStoredUser, getToken, logout, User } from "@/lib/api";

const NAV_LINKS = [
  { href: "/portfolio", label: "1. Portfolio & Mandate" },
  { href: "/dashboard", label: "2. Monitoring & Report" },
  { href: "/history", label: "3. History & Memory" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Check user auth state
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
    } else {
      setUser(null);
    }

    // Check market status
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
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-3 text-slate-900 dark:text-slate-100 font-bold text-lg tracking-tight hover:opacity-95 transition-opacity group"
            >
              {/* Agent Graph Network Logo Badge */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Graph Directed Edges */}
                  <path d="M12 5v6M12 11l-5.5 5.5M12 11l5.5 5.5" strokeOpacity="0.75" />
                  {/* Outer Agent Nodes */}
                  <circle cx="12" cy="5" r="2.5" fill="currentColor" />
                  <circle cx="6.5" cy="16.5" r="2.5" fill="currentColor" />
                  <circle cx="17.5" cy="16.5" r="2.5" fill="currentColor" />
                  {/* Central Orchestrator Beacon */}
                  <circle cx="12" cy="11" r="1.5" fill="#34D399" className="animate-ping" />
                  <circle cx="12" cy="11" r="1.5" fill="#10B981" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="leading-tight text-sm font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase">
                  Portfolio Agent
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono tracking-normal">
                  LangGraph Multi-Agent System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — ONLY visible to authenticated users */}
            {user && (
              <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Section: Theme Toggle + Auth State Dependent Elements */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? (
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Authenticated State: Engine Badge, User Pill & Run Pipeline Button */}
            {user ? (
              <>
                {/* Orchestrator Badge */}
                <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Engine: <strong className="text-slate-800 dark:text-slate-100">LangGraph</strong></span>
                </div>

                {/* User Session Pill */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-1 pr-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                    {user.email.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-700 dark:text-slate-200 font-medium max-w-[120px] truncate hidden sm:inline">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline pl-1.5 border-l border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Run Pipeline CTA */}
                <Link
                  href="/portfolio"
                  className="group inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span>Run Pipeline</span>
                  <svg
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </>
            ) : (
              /* Logged-Out State: ONLY a single prominent Sign In / Get Started button */
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Sign In / Get Started</span>
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
