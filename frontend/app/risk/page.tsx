"use client";

import { useState, useEffect } from "react";
import { getRiskMetrics } from "@/lib/api";

export default function RiskPage() {
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
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold mb-3">⚠️ Risk Analysis</h1>
        <p className="text-red-100 text-lg">
          Comprehensive risk metrics and downside analysis
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-danger mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading risk metrics...</p>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-800">{error}</p>
          <p className="mt-2 text-yellow-700">Run analysis from Portfolio page first.</p>
        </div>
      )}

      {data && data.status === "success" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Key Metrics
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data.metrics, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
