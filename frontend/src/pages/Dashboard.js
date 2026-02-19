import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { api } from "../api/api";

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
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [showAvailableBreakdown, setShowAvailableBreakdown] = useState(false);
  const [showAssignedBreakdown, setShowAssignedBreakdown] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [assetsRes, usersRes] = await Promise.all([
          api.get("/assets"),
          (role === "ADMIN" || role === "SUPER_ADMIN") ? api.get("/users") : Promise.resolve({ data: [] }),
        ]);

        const assets = assetsRes.data || [];
        const users = usersRes.data || [];

        // Calculate category counts for total assets
        const categoryCounts = {
          Desktop: 0,
          Laptop: 0,
          Monitor: 0,
        };

        // Calculate category counts for available assets
        const availableCategoryCounts = {
          Desktop: 0,
          Laptop: 0,
          Monitor: 0,
        };

        // Calculate category counts for assigned assets
        const assignedCategoryCounts = {
          Desktop: 0,
          Laptop: 0,
          Monitor: 0,
        };

        assets.forEach((asset) => {
          const category = asset.category || "";
          const isAvailable = asset.status === "Available" || asset.status === "IN_STOCK" || asset.assetStatus === "Available";
          const isAssigned = asset.status === "Assigned" || asset.status === "ASSIGNED" || asset.assetStatus === "Assigned";
          
          if (category.toLowerCase() === "desktop") {
            categoryCounts.Desktop++;
            if (isAvailable) availableCategoryCounts.Desktop++;
            if (isAssigned) assignedCategoryCounts.Desktop++;
          } else if (category.toLowerCase() === "laptop") {
            categoryCounts.Laptop++;
            if (isAvailable) availableCategoryCounts.Laptop++;
            if (isAssigned) assignedCategoryCounts.Laptop++;
          } else if (category.toLowerCase() === "monitor") {
            categoryCounts.Monitor++;
            if (isAvailable) availableCategoryCounts.Monitor++;
            if (isAssigned) assignedCategoryCounts.Monitor++;
          }
        });

        setStats({
          totalAssets: assets.length,
          assigned: assets.filter((a) => 
            a.status === "Assigned" || a.status === "ASSIGNED" || a.assetStatus === "Assigned"
          ).length,
          available: assets.filter((a) => 
            a.status === "Available" || a.status === "IN_STOCK" || a.assetStatus === "Available"
          ).length,
          totalUsers: users.length,
          categories: categoryCounts,
          availableCategories: availableCategoryCounts,
          assignedCategories: assignedCategoryCounts,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="flex-1 p-6 bg-slate-50">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {(role === "ADMIN" || role === "SUPER_ADMIN") ? "Admin Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-slate-600">
              {(role === "ADMIN" || role === "SUPER_ADMIN")
                ? "Overview of your asset management system" 
                : "View your assigned assets and statistics"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div 
                  className="relative overflow-hidden bg-white rounded-xl shadow-md border border-slate-200 p-6 transform hover:scale-105 transition-all duration-300 animate-fadeIn hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    setShowCategoryBreakdown(!showCategoryBreakdown);
                    setShowAssignedBreakdown(false);
                    setShowAvailableBreakdown(false);
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
                  <p className="text-slate-600 mb-2 text-sm font-medium">
                    Total Assets
                  </p>
                  <h2 className="text-4xl font-bold text-slate-800 mb-1">
                    {stats.totalAssets}
                  </h2>
                  {showCategoryBreakdown && (
                    <div className="mt-3 mb-1 space-y-1 animate-fadeIn">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Desktop:</span>
                        <span className="font-semibold">{stats.categories.Desktop}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Laptop:</span>
                        <span className="font-semibold">{stats.categories.Laptop}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Monitor:</span>
                        <span className="font-semibold">{stats.categories.Monitor}</span>
                      </div>
                    </div>
                  )}
                  <div className="h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-4"></div>
                </div>

                <div 
                  className="relative overflow-hidden bg-white rounded-xl shadow-md border border-slate-200 p-6 transform hover:scale-105 transition-all duration-300 animate-fadeIn hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    setShowAssignedBreakdown(!showAssignedBreakdown);
                    setShowCategoryBreakdown(false);
                    setShowAvailableBreakdown(false);
                  }}
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16"></div>
                  <p className="text-slate-600 mb-2 text-sm font-medium">
                    Assigned
                  </p>
                  <h2 className="text-4xl font-bold text-slate-800 mb-1">
                    {stats.assigned}
                  </h2>
                  {showAssignedBreakdown && (
                    <div className="mt-3 mb-1 space-y-1 animate-fadeIn">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Desktop:</span>
                        <span className="font-semibold">{stats.assignedCategories?.Desktop || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Laptop:</span>
                        <span className="font-semibold">{stats.assignedCategories?.Laptop || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Monitor:</span>
                        <span className="font-semibold">{stats.assignedCategories?.Monitor || 0}</span>
                      </div>
                    </div>
                  )}
                  <div className="h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-4"></div>
                </div>

                <div 
                  className="relative overflow-hidden bg-white rounded-xl shadow-md border border-slate-200 p-6 transform hover:scale-105 transition-all duration-300 animate-fadeIn hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    setShowAvailableBreakdown(!showAvailableBreakdown);
                    setShowCategoryBreakdown(false);
                    setShowAssignedBreakdown(false);
                  }}
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
                  <p className="text-slate-600 mb-2 text-sm font-medium">
                    Available
                  </p>
                  <h2 className="text-4xl font-bold text-slate-800 mb-1">
                    {stats.available}
                  </h2>
                  {showAvailableBreakdown && (
                    <div className="mt-3 mb-1 space-y-1 animate-fadeIn">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Desktop:</span>
                        <span className="font-semibold">{stats.availableCategories?.Desktop || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Laptop:</span>
                        <span className="font-semibold">{stats.availableCategories?.Laptop || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Monitor:</span>
                        <span className="font-semibold">{stats.availableCategories?.Monitor || 0}</span>
                      </div>
                    </div>
                  )}
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-4"></div>
                </div>

                {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                  <div className="relative overflow-hidden bg-white rounded-xl shadow-md border border-slate-200 p-6 transform hover:scale-105 transition-all duration-300 animate-fadeIn hover:shadow-lg" style={{ animationDelay: "0.3s" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16"></div>
                    <p className="text-slate-600 mb-2 text-sm font-medium">
                      Total Users
                    </p>
                    <h2 className="text-4xl font-bold text-slate-800 mb-1">
                      {stats.totalUsers}
                    </h2>
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mt-4"></div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
