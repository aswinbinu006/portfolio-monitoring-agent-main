"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard Component:
 * Synchronously verifies presence of JWT auth token before rendering protected content.
 * If unauthenticated, halts rendering immediately and redirects to /login with zero page flash.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // While checking auth state or if unauthorized, render clean neutral skeleton rather than flashing protected UI
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
          Verifying session credentials...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
