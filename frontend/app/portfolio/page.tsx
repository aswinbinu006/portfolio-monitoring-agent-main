"use client";

import { useState } from "react";
import { uploadPortfolio, runMonitoring } from "@/lib/api";
import type { PortfolioUploadResponse, MonitorResponse } from "@/lib/api";

export default function PortfolioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState<PortfolioUploadResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MonitorResponse | null>(null);
  const [error, setError] = useState<string>("");
  
  const [mandate, setMandate] = useState<string>("balanced");
  const [days, setDays] = useState<number>(90);
  const [drawdown, setDrawdown] = useState<number>(-0.15);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setUploading(true);
    setError("");
    
    try {
      const result = await uploadPortfolio(file);
      setUploadResult(result);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!uploadResult) {
      setError("Please upload a portfolio first");
      return;
    }

    setAnalyzing(true);
    setError("");
    
    try {
      const result = await runMonitoring(mandate, days, drawdown);
      setAnalysisResult(result);
      
      if (result.status === "success") {
        // Auto-redirect to results after 2 seconds
        setTimeout(() => {
          window.location.href = "/alerts";
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold mb-3">📁 Portfolio Upload</h1>
        <p className="text-blue-100 text-lg">
          Upload your portfolio CSV to begin comprehensive risk analysis
        </p>
      </div>

      {/* Instructions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            📋 CSV Format
          </h3>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`symbol,quantity,target_weight
RELIANCE.NS,100,0.30
TCS.NS,50,0.25
INFY.NS,75,0.25
HDFCBANK.NS,40,0.20`}
          </pre>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Pro Tip:</strong> Use .NS for NSE stocks, .BO for BSE, or no suffix for US stocks
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            ⚙️ Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Mandate
              </label>
              <select
                value={mandate}
                onChange={(e) => setMandate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Historical Days: {days}
              </label>
              <input
                type="range"
                min="30"
                max="365"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Drawdown: {(drawdown * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="-50"
                max="-5"
                value={drawdown * 100}
                onChange={(e) => setDrawdown(Number(e.target.value) / 100)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
          Upload Portfolio
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            📁 Choose CSV File
          </label>
          {file && (
            <p className="mt-4 text-gray-600">
              Selected: <strong>{file.name}</strong>
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          {uploading ? "⏳ Uploading..." : "🚀 Upload Portfolio"}
        </button>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-green-900 mb-4">
            ✅ Portfolio Loaded Successfully
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-700">
                <strong>Holdings:</strong> {uploadResult.holdings?.length || 0}
              </p>
              <p className="text-gray-700">
                <strong>Portfolio Value:</strong> $
                {uploadResult.portfolio_value?.toLocaleString() || "N/A"}
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalysis}
            disabled={analyzing}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50 hover:shadow-lg transition-shadow"
          >
            {analyzing ? "⏳ Analyzing... (30-90 seconds)" : "🔍 Run Full Analysis"}
          </button>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && analysisResult.status === "success" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-3">
            ✅ Analysis Complete!
          </h3>
          <p className="text-blue-800 mb-4">
            Redirecting to results in 2 seconds...
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            ❌ Error
          </h3>
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
