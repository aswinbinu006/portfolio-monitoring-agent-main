"use client";

import { useState, useEffect } from "react";
import { getRiskMetrics } from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getRiskMetrics();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold mb-3">📈 Portfolio Dashboard</h1>
        <p className="text-purple-100 text-lg">
          Visual analytics and performance metrics
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-800">{error}</p>
          <p className="mt-2 text-yellow-700">Run analysis from Portfolio page first.</p>
        </div>
      )}

      {data && data.status === "success" && (
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Portfolio Metrics</h2>
          <pre className="bg-gray-50 p-6 rounded-lg overflow-auto">
            {JSON.stringify(data.metrics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
