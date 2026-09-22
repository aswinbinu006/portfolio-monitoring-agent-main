"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function FintechFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#FFFFFF] dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-14 border-b border-[#E2E8F0] dark:border-slate-800">
          {/* Column 1: Brand & Description (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-[#1E3A8A] dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <svg
                  className="w-3.5 h-3.5"
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
              <span className="text-base font-bold text-[#0F172A] dark:text-white tracking-tight">
                Portfolio Monitor
              </span>
            </Link>
            <p className="text-[14px] leading-relaxed text-[#64748B] dark:text-slate-400 max-w-sm">
              A high-precision portfolio monitoring platform built for modern investors. Monitor performance, understand risk, and make data-driven investment decisions.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (formerly Twitter)"
                className="w-8 h-8 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-[10px] border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Product (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[14px] font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <Link href="/#features" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#why-choose" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[14px] font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <Link href="/portfolio" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Market Data
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="mailto:support@portfoliomonitor.io" className="text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-[14px] font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-[14px] leading-relaxed text-[#64748B] dark:text-slate-400">
              Receive concise weekly market updates, portfolio intelligence, and feature releases.
            </p>
            {subscribed ? (
              <div className="p-3 rounded-[14px] bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-800 text-[13px] text-[#059669] dark:text-emerald-300 font-medium">
                ✓ Thank you for subscribing to market updates.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="flex-1 px-3.5 py-2.5 text-[14px] bg-[#FFFFFF] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-[14px] text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-[14px] font-medium text-white bg-[#1E3A8A] hover:bg-[#0F172A] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-[14px] shadow-xs transition-colors shrink-0"
                  >
                    Subscribe
                  </button>
                </div>
                <span className="block text-[12px] text-[#94A3B8]">
                  Zero spam. Unsubscribe at any time.
                </span>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-[#64748B] dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/#privacy" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/#terms" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-[#94A3B8] hidden sm:inline">•</span>
            <span className="text-[12px] text-[#94A3B8] max-w-md">
              Disclaimer: Market data and metrics are provided for informational and educational purposes only.
            </span>
          </div>
          <div className="font-mono text-[12px] text-[#94A3B8]">
            © {new Date().getFullYear()} Portfolio Monitor. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
