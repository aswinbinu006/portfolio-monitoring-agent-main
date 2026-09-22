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
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
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
                <span className="leading-none text-sm font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase">
                  Portfolio Agent
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-normal mt-0.5">
                  LangGraph 7-Agent System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${
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
          </div>

          {/* Right Session / Theme / Engine Pill */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

            {/* Orchestrator Badge */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Engine: <strong className="text-slate-800 dark:text-slate-100">LangGraph</strong></span>
            </div>

            {/* User Session Pill */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-1 pr-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user.email.charAt(0)}
                </div>
                <span className="text-xs text-slate-700 dark:text-slate-200 font-medium max-w-[120px] truncate hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline pl-1 border-l border-slate-300 dark:border-slate-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Action Button */}
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
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
