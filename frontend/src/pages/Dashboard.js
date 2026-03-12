import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { api } from "../api/api";

const CARD_CONFIG = {
  total: {
    title: "Total Assets",
    accent: "from-red-500 to-red-600",
    glow: "bg-red-500/10",
  },
  assigned: {
    title: "Assigned",
    accent: "from-green-500 to-green-600",
    glow: "bg-green-500/10",
  },
  available: {
    title: "Available",
    accent: "from-blue-500 to-blue-600",
    glow: "bg-blue-500/10",
  },
  users: {
    title: "Total Users",
    accent: "from-purple-500 to-purple-600",
    glow: "bg-purple-500/10",
  },
};

function DashboardCard({ cardKey, config, value, breakdown, activeCard, onToggle, clickable = true }) {
  const isActive = activeCard === cardKey;

  return (
    <div
      className={`relative self-start overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${
        clickable ? "cursor-pointer" : ""
      } ${
        isActive
          ? "border-slate-300 bg-white shadow-xl ring-2 ring-slate-200"
          : "border-slate-200 bg-white shadow-md hover:shadow-lg"
      }`}
      onClick={clickable ? () => onToggle(cardKey) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle(cardKey);
              }
            }
          : undefined
      }
    >
      <div className={`absolute top-0 right-0 h-32 w-32 rounded-full -mr-16 -mt-16 ${config.glow}`}></div>
      <p className="mb-2 text-sm font-semibold text-slate-600">{config.title}</p>
      <h2 className="mb-2 text-5xl font-bold tracking-tight text-slate-800">{value}</h2>

      {isActive && breakdown?.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm text-slate-700">
                <span>{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`mt-5 h-1.5 rounded-full bg-gradient-to-r ${config.accent}`}></div>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalAssets: 0,
    assigned: 0,
    available: 0,
    totalUsers: 0,
    categories: {
      Desktop: 0,
      Laptop: 0,
      Monitor: 0,
    },
    availableCategories: {
      Desktop: 0,
      Laptop: 0,
      Monitor: 0,
    },
    assignedCategories: {
      Desktop: 0,
      Laptop: 0,
      Monitor: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [assetsRes, usersRes] = await Promise.all([
          api.get("/assets"),
          role === "ADMIN" || role === "SUPER_ADMIN" ? api.get("/users") : Promise.resolve({ data: [] }),
        ]);

        const assets = Array.isArray(assetsRes.data) ? assetsRes.data : assetsRes.data?.data || [];
        const users = usersRes.data || [];

        const categoryCounts = { Desktop: 0, Laptop: 0, Monitor: 0 };
        const availableCategoryCounts = { Desktop: 0, Laptop: 0, Monitor: 0 };
        const assignedCategoryCounts = { Desktop: 0, Laptop: 0, Monitor: 0 };

        assets.forEach((asset) => {
          const category = (asset.category || "").toLowerCase();
          const isAvailable = asset.status === "Available" || asset.status === "IN_STOCK" || asset.assetStatus === "Available";
          const isAssigned = asset.status === "Assigned" || asset.status === "ASSIGNED" || asset.assetStatus === "Assigned";

          if (category === "desktop") {
            categoryCounts.Desktop++;
            if (isAvailable) availableCategoryCounts.Desktop++;
            if (isAssigned) assignedCategoryCounts.Desktop++;
          } else if (category === "laptop") {
            categoryCounts.Laptop++;
            if (isAvailable) availableCategoryCounts.Laptop++;
            if (isAssigned) assignedCategoryCounts.Laptop++;
          } else if (category === "monitor") {
            categoryCounts.Monitor++;
            if (isAvailable) availableCategoryCounts.Monitor++;
            if (isAssigned) assignedCategoryCounts.Monitor++;
          }
        });

        setStats({
          totalAssets: assets.length,
          assigned: assets.filter(
            (asset) => asset.status === "Assigned" || asset.status === "ASSIGNED" || asset.assetStatus === "Assigned"
          ).length,
          available: assets.filter(
            (asset) => asset.status === "Available" || asset.status === "IN_STOCK" || asset.assetStatus === "Available"
          ).length,
          totalUsers: users.length,
          categories: categoryCounts,
          availableCategories: availableCategoryCounts,
          assignedCategories: assignedCategoryCounts,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  const handleToggleCard = (cardKey) => {
    setActiveCard((current) => (current === cardKey ? null : cardKey));
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="flex-1 bg-slate-50 p-6">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-slate-800">
              {role === "ADMIN" || role === "SUPER_ADMIN" ? "Admin Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-slate-600">
              {role === "ADMIN" || role === "SUPER_ADMIN"
                ? "Overview of your asset management system"
                : "View your assigned assets and statistics"}
            </p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-4">
              <DashboardCard
                cardKey="total"
                config={CARD_CONFIG.total}
                value={stats.totalAssets}
                activeCard={activeCard}
                onToggle={handleToggleCard}
                breakdown={[
                  { label: "Desktop", value: stats.categories.Desktop },
                  { label: "Laptop", value: stats.categories.Laptop },
                  { label: "Monitor", value: stats.categories.Monitor },
                ]}
              />

              <DashboardCard
                cardKey="assigned"
                config={CARD_CONFIG.assigned}
                value={stats.assigned}
                activeCard={activeCard}
                onToggle={handleToggleCard}
                breakdown={[
                  { label: "Desktop", value: stats.assignedCategories.Desktop },
                  { label: "Laptop", value: stats.assignedCategories.Laptop },
                  { label: "Monitor", value: stats.assignedCategories.Monitor },
                ]}
              />

              <DashboardCard
                cardKey="available"
                config={CARD_CONFIG.available}
                value={stats.available}
                activeCard={activeCard}
                onToggle={handleToggleCard}
                breakdown={[
                  { label: "Desktop", value: stats.availableCategories.Desktop },
                  { label: "Laptop", value: stats.availableCategories.Laptop },
                  { label: "Monitor", value: stats.availableCategories.Monitor },
                ]}
              />

              {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                <DashboardCard
                  cardKey="users"
                  config={CARD_CONFIG.users}
                  value={stats.totalUsers}
                  activeCard={activeCard}
                  onToggle={handleToggleCard}
                  breakdown={[]}
                  clickable={false}
                />
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
