import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Reports() {
  const [summary, setSummary] = useState({ byStatus: [], byCategory: [], expiringWarrantyCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await api.get("/assets/summary");
        setSummary(response.data || { byStatus: [], byCategory: [], expiringWarrantyCount: 0 });
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const handleExport = async () => {
    const response = await api.get("/assets/export", { responseType: "blob" });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "asset-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalAssets = summary.byStatus.reduce((acc, item) => acc + item.count, 0);
  const mostCommonStatus = summary.byStatus[0]?.status || "-";
  const topCategory = summary.byCategory[0]?.category || "-";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0">
        <h1 className="mb-1 text-3xl font-bold text-slate-800">Reports</h1>
        <p>Operational reporting and export for enterprise asset oversight</p>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {loading && <p className="text-slate-500">Loading reports.....</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid gap-3 pb-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tracked Assets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{totalAssets}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Top Status</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{mostCommonStatus}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Top Category</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{topCategory}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Warranty Expiring</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{summary.expiringWarrantyCount}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-800">Available Reports</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {[
              { name: "Asset Inventory", description: "Current inventory segmented by status and category." },
              { name: "Warranty Risk", description: "Assets with warranty expiry inside the next 90 days." },
            ].map((report) => (
              <div key={report.name} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-800">{report.name}</p>
                  <p className="text-sm text-slate-500">{report.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
