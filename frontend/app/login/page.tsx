"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/portfolio");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xs font-bold text-lg">
            AI
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {isSignUp ? "Create Agent Session Account" : "Sign In to Portfolio Agent"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {isSignUp
              ? "Register an account to persist portfolio states and LangGraph agent runs."
              : "Access your portfolio monitoring dashboard and historical agent briefings."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@university.edu"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 shadow-xs transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : isSignUp ? (
                "Create Account & Continue"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New session?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
