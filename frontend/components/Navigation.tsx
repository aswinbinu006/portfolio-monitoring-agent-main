"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, getToken, logout, User } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 transition-colors">
      <div className="max-w-[1280px] h-full mx-auto px-5 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo + Portfolio Monitor */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg"
          >
            {/* Minimalist Fintech Geometric Emblem */}
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] dark:bg-blue-600 text-white flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
              </svg>
            </div>
            <span className="text-[17px] font-bold text-[#0F172A] dark:text-white tracking-tight">
              Portfolio Monitor
            </span>
          </Link>
        </div>

        {/* Center: Home, Features, Dashboard, Pricing, About */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative py-1 text-[15px] font-medium transition-colors group ${
                  isActive
                    ? "text-[#0F172A] dark:text-white font-semibold"
                    : "text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {/* Subtle underline hover effect with smooth transition */}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#1E3A8A] dark:bg-blue-400 transform origin-left transition-transform duration-200 ease-out ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Subtle Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="p-2 rounded-[14px] text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-[14px] font-semibold text-[#0F172A] dark:text-white hover:text-[#1E3A8A] transition-colors"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 bg-[#F1F5F9] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] px-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-[#1E3A8A] dark:bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user.email.charAt(0)}
                </div>
                <span className="text-xs text-[#0F172A] dark:text-slate-200 font-medium max-w-[110px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-semibold text-[#DC2626] hover:underline pl-2 border-l border-[#CBD5E1] dark:border-slate-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Login (ghost button) */}
              <Link
                href="/login"
                className="text-[14px] font-medium text-[#0F172A] dark:text-slate-200 hover:text-[#1E3A8A] dark:hover:text-white px-3.5 py-2 rounded-[14px] transition-colors"
              >
                Login
              </Link>

              {/* Get Started (solid navy button) */}
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-[14px] font-medium text-white bg-[#1E3A8A] hover:bg-[#0F172A] dark:bg-blue-600 dark:hover:bg-blue-500 px-5 py-2.5 rounded-[14px] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-[14px] text-[#64748B] hover:bg-[#F1F5F9]"
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="p-2.5 rounded-[14px] border border-[#E2E8F0] dark:border-slate-800 text-[#0F172A] dark:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-[14px] text-[15px] font-medium text-[#64748B] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <div className="text-xs text-[#64748B] dark:text-slate-400 px-2">
                  Signed in as <strong className="text-[#0F172A] dark:text-white">{user.email}</strong>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-[14px] bg-[#1E3A8A] text-white text-sm font-medium"
                >
                  Open Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2 rounded-[14px] text-xs font-semibold text-[#DC2626] hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-[14px] border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-[14px] bg-[#1E3A8A] dark:bg-blue-600 text-white text-sm font-medium shadow-xs"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
