"use client";

import { useState, useEffect } from "react";
import { getStatus } from "@/lib/api";

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await getStatus();
        setStatus(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold mb-3">🚨 Alerts & Material Events</h1>
        <p className="text-pink-100 text-lg">
          Two-stage anomaly detection with AI-powered news attribution
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto"></div>
        </div>
      ) : status && status.analysis_complete ? (
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Analysis Results</h2>
          <p className="text-gray-600">
            Alerts, news analyses, and briefing available here after full analysis.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-800">No analysis data available.</p>
          <p className="mt-2 text-yellow-700">Please run analysis from the Portfolio page first.</p>
        </div>
      )}
    </div>
  );
}
