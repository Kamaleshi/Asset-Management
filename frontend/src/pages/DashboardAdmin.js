import Layout from "../components/Layout";

export default function DashboardAdmin() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">Total Assets: 120</div>
        <div className="card">Assigned: 85</div>
        <div className="card">Available: 35</div>
        <div className="card">Users: 42</div>
      </div>
    </Layout>
  );
}
