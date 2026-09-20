"use client";

import { useState, useEffect } from "react";
import { getForecast } from "@/lib/api";

export default function ForecastPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getForecast();
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
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold mb-3">🤖 ML Volatility Forecast</h1>
        <p className="text-cyan-100 text-lg">
          5-day forward volatility prediction using ensemble models
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto"></div>
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
          <h2 className="text-2xl font-semibold mb-6">Forecast Results</h2>
          <pre className="bg-gray-50 p-6 rounded-lg overflow-auto">
            {JSON.stringify(data.forecast, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
