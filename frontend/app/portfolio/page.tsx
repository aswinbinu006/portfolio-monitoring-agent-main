"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPortfolio, runMonitoring, HoldingItem, PortfolioUploadResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import PipelineStepperModal from "@/components/PipelineStepperModal";

export default function PortfolioUploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [uploadResult, setUploadResult] = useState<PortfolioUploadResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Configuration settings
  const [mandate, setMandate] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [days, setDays] = useState<number>(90);
  const [drawdown, setDrawdown] = useState<number>(-0.15);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setSuccessMsg("");
    }
  };

  const handleUploadFile = async (targetFile?: File) => {
    const fileToUpload = targetFile || file;
    if (!fileToUpload) {
      setError("Please select a portfolio CSV file first.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMsg("");

    try {
      const result = await uploadPortfolio(fileToUpload);
      setUploadResult(result);
      setSuccessMsg(result.message);
    } catch (err: any) {
      setError(err.message || "Failed to upload portfolio.");
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSamplePortfolio = async () => {
    const sampleCsv = `symbol,quantity,target_weight
RELIANCE.NS,100,0.25
TCS.NS,50,0.20
HDFCBANK.NS,75,0.20
INFY.NS,200,0.20
ITC.NS,150,0.15`;

    const sampleFile = new File([sampleCsv], "sample_portfolio.csv", { type: "text/csv" });
    setFile(sampleFile);
    await handleUploadFile(sampleFile);
  };

  const handleRunAnalysis = async () => {
    if (!uploadResult || uploadResult.holdings.length === 0) {
      setError("Please upload or import a portfolio before executing analysis.");
      return;
    }

    setAnalyzing(true);
    setIsStepperOpen(true);
    setIsStepComplete(false);
    setError("");

    try {
      await runMonitoring(mandate, days, drawdown);
      setIsStepComplete(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setIsStepperOpen(false);
      setError(err.message || "Analysis execution failed.");
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Portfolio Import & Configuration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Import your holdings CSV and set institutional risk tolerance thresholds.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="font-medium">✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upload Area */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Data Import</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSamplePortfolio}
                disabled={uploading || analyzing}
              >
                1-Click Sample Portfolio
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-colors rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  id="csv-upload-input"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="csv-upload-input"
                  className="cursor-pointer block space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {file ? file.name : "Click to browse or drop portfolio CSV"}
                  </div>
                  <p className="text-xs text-slate-400">
                    Max size: 5MB. Standard format: symbol, quantity, target_weight
                  </p>
                </label>
              </div>

              {/* Upload Trigger Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "No file selected"}
                </span>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleUploadFile()}
                  disabled={!file || uploading}
                  loading={uploading}
                >
                  Import Positions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Holdings Preview Table */}
          {uploadResult && uploadResult.holdings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Imported Holdings ({uploadResult.total_holdings})</CardTitle>
                <Badge variant="success">Parsed Successfully</Badge>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Asset Symbol</th>
                      <th className="px-5 py-3">Sector</th>
                      <th className="px-5 py-3 text-right">Quantity</th>
                      <th className="px-5 py-3 text-right">Target Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {uploadResult.holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                          {h.symbol}
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                          {h.sector || "Diversified"}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-800 dark:text-slate-200 tabular-nums font-mono">
                          {h.quantity.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400 tabular-nums font-mono">
                          {h.target_weight ? `${(h.target_weight * 100).toFixed(1)}%` : "Equal"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Mandate & Risk Parameters */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Mandate Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Investment Mandate */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Investment Mandate
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["conservative", "balanced", "aggressive"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMandate(m)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        mandate === m
                          ? "bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  {mandate === "conservative"
                    ? "Prioritizes capital preservation (Rf 6.5%, low vol ceiling)."
                    : mandate === "balanced"
                    ? "Equilibrium growth and downside containment (Rf 6.0%)."
                    : "Emphasizes alpha and high-volatility threshold (Rf 5.5%)."}
                </p>
              </div>

              {/* Historical Window */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Lookback Period
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{days} Days</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="15"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full accent-slate-900 dark:accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>30d</span>
                  <span>90d (Standard)</span>
                  <span>365d (1yr)</span>
                </div>
              </div>

              {/* Max Drawdown Tolerance */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Max Drawdown Tolerance
                  </span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {(drawdown * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.35"
                  max="-0.05"
                  step="0.01"
                  value={drawdown}
                  onChange={(e) => setDrawdown(Number(e.target.value))}
                  className="w-full accent-rose-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-5% (Strict)</span>
                  <span>-15% (Typical)</span>
                  <span>-35% (High)</span>
                </div>
              </div>

              {/* Run Analysis CTA */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleRunAnalysis}
                  disabled={!uploadResult || analyzing}
                  loading={analyzing}
                >
                  {analyzing ? "Running Multi-Agent Engine..." : "Execute Risk Analysis"}
                </Button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Fetches live prices, runs EWMA, and forecasts volatility.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live 7-Node Stepper Execution Modal */}
      <PipelineStepperModal
        isOpen={isStepperOpen}
        isComplete={isStepComplete}
      />
    </div>
  );
}
