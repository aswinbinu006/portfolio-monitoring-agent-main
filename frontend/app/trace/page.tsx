"use client";

import { useState, useEffect } from "react";
import { getTrace } from "@/lib/api";

export default function TracePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getTrace();
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold mb-3">🔍 Agent Execution Trace</h1>
        <p className="text-orange-100 text-lg">
          Real-time log of multi-agent system with tool calls and reasoning
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {data && data.status === "success" && (
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Execution Log</h2>
          <pre className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-auto font-mono text-sm">
            {data.trace || "No trace data available"}
          </pre>
        </div>
      )}
    </div>
  );
}
