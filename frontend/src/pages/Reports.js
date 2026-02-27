export default function Reports() {
  const reportItems = [
    { name: "Asset Inventory", description: "Current asset counts by type and status." },
    { name: "Maintenance Log", description: "Completed and pending maintenance activities." },
    { name: "Assignment History", description: "Asset assignment and return history." },
    { name: "Warranty Expiry", description: "Assets with expiring warranties in the next 90 days." },
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Reports</h1>
      <p>View and export various reports.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Reports</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{reportItems.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Most Used</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">Asset Inventory</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Exports Today</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">0</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Last Export</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">-</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">Available Reports</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {reportItems.map((report) => (
            <div key={report.name} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-800">{report.name}</p>
                <p className="text-sm text-slate-500">{report.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Preview
                </button>
                <button
                  type="button"
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
  );
}
