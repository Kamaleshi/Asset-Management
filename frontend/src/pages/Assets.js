import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, UserCheck, UserX, X, Edit, History, Search } from "lucide-react";

export default function Assets({ noLayout = false }) {
  const { role } = useAuth();
  const [assets, setAssets] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [assetHistory, setAssetHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [fetchedUser, setFetchedUser] = useState(null);
  const [formData, setFormData] = useState({
    assetId: "",
    serialNumber: "",
    category: "Monitor",
    brand: "",
    model: "",
    seatNo: "",
    status: "Available",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAssets(appliedSearch);
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          const usersRes = await api.get("/users");
          setUsers(usersRes.data || []);
        }
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, appliedSearch]);

  const fetchAssets = async (search) => {
    try {
      const params = search ? { params: { search } } : {};
      const assetsRes = await api.get("/assets", params);
      setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : assetsRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      setAssets([]);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.assetId || !formData.serialNumber) {
      setFormError("Asset ID and Serial Number are required");
      return;
    }

    try {
      const payload = {
        assetId: formData.assetId,
        assetId_custom: formData.assetId,
        name: formData.assetId,
        serialNumber: formData.serialNumber,
        category: formData.category || "Monitor",
        brand: formData.brand || "",
        model: formData.model || "",
        seatNo: formData.seatNo || "",
        seat: formData.seatNo || "",
        status: formData.status === "Assigned" ? "ASSIGNED" : 
                formData.status === "Available" ? "IN_STOCK" :
                formData.status === "Repair" ? "REPAIR" :
                formData.status === "Misuse" ? "MISUSE" :
                formData.status === "Scrap" ? "SCRAP" : "IN_STOCK",
        assetStatus: formData.status,
      };
      
      await api.post("/assets", payload);
      await fetchAssets(appliedSearch);
      setFormData({
        assetId: "",
        serialNumber: "",
        category: "Monitor",
        brand: "",
        model: "",
        seatNo: "",
        status: "Available",
      });
      setShowAddModal(false);
      setFormError("");
    } catch (err) {
      console.error("Error creating asset:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to add asset. Please check all required fields.";
      setFormError(errorMessage);
    }
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      const payload = {
        assetId: formData.assetId,
        assetId_custom: formData.assetId,
        name: formData.assetId,
        serialNumber: formData.serialNumber,
        category: formData.category || "Monitor",
        brand: formData.brand || "",
        model: formData.model || "",
        seatNo: formData.seatNo || "",
        seat: formData.seatNo || "",
        status: formData.status === "Assigned" ? "ASSIGNED" : 
                formData.status === "Available" ? "IN_STOCK" :
                formData.status === "Repair" ? "REPAIR" :
                formData.status === "Misuse" ? "MISUSE" :
                formData.status === "Scrap" ? "SCRAP" : "IN_STOCK",
        assetStatus: formData.status,
      };
      
      await api.put(`/assets/${selectedAsset.id}`, payload);
      await fetchAssets(appliedSearch);
      setShowEditModal(false);
      setSelectedAsset(null);
      setFormData({
        assetId: "",
        serialNumber: "",
        category: "Monitor",
        brand: "",
        model: "",
        seatNo: "",
        status: "Available",
      });
      setFormError("");
    } catch (err) {
      console.error("Error updating asset:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to update asset. Please check all fields.";
      setFormError(errorMessage);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await api.delete(`/assets/${assetId}`);
      await fetchAssets(appliedSearch);
    } catch (err) {
      alert("Failed to delete asset");
    }
  };

  const handleFetchUserByEmployeeId = async () => {
    if (!selectedEmployeeId.trim()) {
      setFormError("Please enter Employee ID");
      return;
    }
    try {
      const usersRes = await api.get("/users");
      const user = usersRes.data.find(u => u.employeeId === selectedEmployeeId.trim());
      if (user) {
        setFetchedUser(user);
        setFormError("");
      } else {
        setFormError("User not found with this Employee ID");
        setFetchedUser(null);
      }
    } catch (err) {
      setFormError("Failed to fetch user details");
      console.error(err);
    }
  };

  const handleAssign = async (assetId) => {
    if (!fetchedUser) return;
    try {
      await api.put(`/assets/${assetId}`, {
        status: "Assigned",
        assignedTo: fetchedUser.id,
      });
      await Promise.all([
        fetchAssets(appliedSearch),
        (role === "ADMIN" || role === "SUPER_ADMIN") ? api.get("/users").then(r => setUsers(r.data || [])) : Promise.resolve(),
      ]);
      setShowAssignModal(false);
      setSelectedAsset(null);
      setSelectedEmployeeId("");
      setFetchedUser(null);
    } catch (err) {
      alert("Failed to assign asset");
    }
  };

  const handleUnassign = async (assetId) => {
    try {
      await api.put(`/assets/${assetId}`, {
        status: "Available",
        assignedTo: null,
      });
      await fetchAssets(appliedSearch);
    } catch (err) {
      alert("Failed to unassign asset");
    }
  };

  const handleStartEdit = (asset) => {
    setSelectedAsset(asset);
    
    // Map database status to form status
    const mapStatusForForm = (status) => {
      if (!status) return "Available";
      const statusUpper = status.toUpperCase();
      if (statusUpper === "ASSIGNED") return "Assigned";
      if (statusUpper === "IN_STOCK" || statusUpper === "AVAILABLE") return "Available";
      if (statusUpper === "REPAIR") return "Repair";
      if (statusUpper === "MISUSE") return "Misuse";
      if (statusUpper === "SCRAP") return "Scrap";
      return status; // Return as-is if not recognized
    };
    
    setFormData({
      assetId: asset.assetId || asset.name || "",
      serialNumber: asset.serialNumber || "",
      category: asset.category || "Monitor",
      brand: asset.brand || "",
      model: asset.model || "",
      seatNo: asset.seatNo || asset.seat || asset.seatAsset || "",
      status: mapStatusForForm(asset.assetStatus || asset.status),
    });
    setShowEditModal(true);
  };

  const handleViewDetails = async (asset) => {
    try {
      const response = await api.get(`/assets/${asset.id}`);
      const assetDetails = response.data || asset;
      setSelectedAsset({
        ...assetDetails,
        createdOn: assetDetails.createdOn || assetDetails.created_at || "",
        updatedOn: assetDetails.updatedOn || assetDetails.updated_at || "",
      });
    } catch (err) {
      console.error("Error fetching asset details:", err);
      setSelectedAsset({
        ...asset,
        createdOn: asset.createdOn || asset.created_at || "",
        updatedOn: asset.updatedOn || asset.updated_at || "",
      });
    }
    setShowDetailModal(true);
  };

  const getAssetDetailEntries = (asset) => {
    if (!asset) return [];

    const excludedKeys = new Set([
      "id",
      "asset_id",
      "asset_tag",
      "asset_id_custom",
      "asset_name",
      "name",
      "status",
      "category_id",
      "category_name",
      "assigned_to",
      "assignedTo",
      "assigned_to_name",
      "assigned_to_username",
      "assigned_to_employee_id",
      "assigned_to_department",
      "created_by",
      "created_by_username",
      "createdByUsername",
      "vendor_id",
      "vendor_name",
      "vendorName",
      "seat",
      "created_at",
      "updated_at",
      "assignedUserDepartment",
    ]);

    return Object.entries(asset).filter(([key, value]) => {
      if (excludedKeys.has(key)) return false;
      if (value === null || value === "") return false;
      return true;
    });
  };

  const getAssetDetailLabel = (key) => {
    const labelMap = {
      assetId: "Asset ID",
      assetStatus: "Asset Status",
      serialNumber: "Serial Number",
      seatNo: "Seat No",
      createdOn: "Asset Created Date",
      updatedOn: "Last Modified Date",
    };

    if (labelMap[key]) {
      return labelMap[key];
    }

    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatAssetDateTime = (dateString) => {
    if (!dateString) return "";

    try {
      let date;

      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === "string" && dateString.includes("T")) {
        date = new Date(dateString);
      } else if (typeof dateString === "string" && dateString.includes(" ")) {
        date = new Date(`${dateString} UTC`);
      } else {
        date = new Date(dateString);
      }

      if (Number.isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const handleViewHistory = async (asset) => {
    setSelectedAsset(asset);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      // Ensure users are loaded for displaying employee info
      if (users.length === 0 && (role === "ADMIN" || role === "SUPER_ADMIN")) {
        const usersRes = await api.get("/users");
        setUsers(usersRes.data || []);
      }
      
      const response = await api.get(`/assets/${asset.id}/history`);
      setAssetHistory(response.data || []);
    } catch (err) {
      console.error("Error fetching asset history:", err);
      setAssetHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    if (noLayout) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      );
    }
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  // create reusable content block for assets page (avoids duplication)
  const content = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={noLayout ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex min-h-0 flex-1 flex-col overflow-hidden p-4"}>
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">assets</h1>
              <p className="text-slate-600">Manage your assets</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
                <input
                  type="text"
                  placeholder="Search by Asset ID, Serial, Brand, Model"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setAppliedSearch(searchInput); } }}
                  className="outline-none w-64 text-sm"
                />
                {appliedSearch ? (
                  <button aria-label="Clear search" onClick={() => { setAppliedSearch(""); setSearchInput(""); }} className="ml-2">
                    <X size={16} className="text-slate-500" />
                  </button>
                ) : (
                  <button aria-label="Search" onClick={() => { setAppliedSearch(searchInput); }} className="ml-2">
                    <Search size={16} className="text-slate-500" />
                  </button>
                )}
              </div>
              {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-white transition-all shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg"
                >
                  <Plus size={20} />
                  Add Asset
                </button>
              )}
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Seat Number</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Asset ID</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Category</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-800">
                          {asset.seatNo || asset.seat || asset.seatAsset || "-"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(asset)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {asset.assetId || asset.name || "N/A"}
                          </button>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                          {asset.category || "General"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              asset.assetStatus === "Assigned" || asset.status === "Assigned" || asset.status === "ASSIGNED"
                                ? "bg-green-100 text-green-800"
                                : asset.status === "REPAIR" || asset.assetStatus === "Repair"
                                ? "bg-yellow-100 text-yellow-800"
                                : asset.status === "MISUSE" || asset.assetStatus === "Misuse"
                                ? "bg-red-100 text-red-800"
                                : asset.status === "SCRAP" || asset.assetStatus === "Scrap"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {asset.assetStatus || 
                              (asset.status === "ASSIGNED" ? "Assigned" : 
                               asset.status === "IN_STOCK" ? "Available" :
                               asset.status === "REPAIR" ? "Repair" :
                               asset.status === "MISUSE" ? "Misuse" :
                               asset.status === "SCRAP" ? "Scrap" : asset.status)}
                          </span>
                        </td>
                        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                          <td className="px-5 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEdit(asset)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Asset"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleViewHistory(asset)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="View History"
                              >
                                <History size={18} />
                              </button>
                              {asset.assetStatus === "Available" || asset.status === "Available" || asset.status === "IN_STOCK" ? (
                                <button
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setShowAssignModal(true);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Assign Asset"
                                >
                                  <UserCheck size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnassign(asset.id)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Unassign Asset"
                                >
                                  <UserX size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Asset"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {!noLayout && <Footer />}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Add New Asset</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    assetId: "",
                    serialNumber: "",
                    category: "Monitor",
                    brand: "",
                    model: "",
                    seatNo: "",
                    status: "Available",
                  });
                  setFormError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="flex flex-col max-h-[80vh]">
              {formError && (
                <div className="mx-6 mt-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              <div className="px-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Asset ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Monitor">Monitor</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Laptop">Laptop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Seat Number
                  </label>
                  <input
                    type="text"
                    value={formData.seatNo}
                    onChange={(e) => setFormData({ ...formData, seatNo: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Available">Available (In Stock)</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Repair">Repair</option>
                    <option value="Misuse">Misuse</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 p-6 border-t border-slate-200 bg-white sticky bottom-0">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  Add Asset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      assetId: "",
                      serialNumber: "",
                      category: "Monitor",
                      brand: "",
                      model: "",
                      seatNo: "",
                      status: "Available",
                    });
                    setFormError("");
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Edit Asset</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAsset(null);
                  setFormData({
                    assetId: "",
                    serialNumber: "",
                    category: "Monitor",
                    brand: "",
                    model: "",
                    seatNo: "",
                    status: "Available",
                  });
                  setFormError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="flex flex-col max-h-[80vh]">
              {formError && (
                <div className="mx-6 mt-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              <div className="px-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Asset ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Monitor">Monitor</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Laptop">Laptop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Seat Number
                  </label>
                  <input
                    type="text"
                    value={formData.seatNo}
                    onChange={(e) => setFormData({ ...formData, seatNo: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Available">Available (In Stock)</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Repair">Repair</option>
                    <option value="Misuse">Misuse</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 p-6 border-t border-slate-200 bg-white sticky bottom-0">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAsset(null);
                    setFormData({
                      assetId: "",
                      serialNumber: "",
                      category: "Monitor",
                      brand: "",
                      model: "",
                      seatNo: "",
                      status: "Available",
                    });
                    setFormError("");
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Assign Asset: {selectedAsset.assetId || selectedAsset.name}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAsset(null);
                  setSelectedEmployeeId("");
                  setFetchedUser(null);
                  setFormError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      setSelectedEmployeeId(e.target.value);
                      setFetchedUser(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchUserByEmployeeId();
                      }
                    }}
                    placeholder="Enter Employee ID"
                    className="flex-1 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleFetchUserByEmployeeId}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    Search
                  </button>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              {fetchedUser && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-slate-800 mb-2">User Details:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {fetchedUser.empName || fetchedUser.username}</div>
                    <div><span className="font-medium">Employee ID:</span> {fetchedUser.employeeId}</div>
                    <div><span className="font-medium">Department:</span> {fetchedUser.department || "-"}</div>
                    <div><span className="font-medium">Business Unit:</span> {fetchedUser.businessUnit || "-"}</div>
                    <div><span className="font-medium">Business Head:</span> {fetchedUser.businessHead || "-"}</div>
                    <div><span className="font-medium">Category:</span> {fetchedUser.category || "-"}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleAssign(selectedAsset.id)}
                  disabled={!fetchedUser}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Assign Asset
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAsset(null);
                    setSelectedEmployeeId("");
                    setFetchedUser(null);
                    setFormError("");
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Asset Details: {selectedAsset.assetId || selectedAsset.name}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAsset(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {getAssetDetailEntries(selectedAsset)
                  .map(([key, value]) => {
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {getAssetDetailLabel(key)}
                        </label>
                        <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded-lg">
                          {key === "createdOn" || key === "updatedOn"
                            ? formatAssetDateTime(value)
                            : String(value)}
                        </p>
                      </div>
                    );
                  })}
                
                {/* Show assigned user info only when the asset is assigned */}
                {(selectedAsset.assetStatus === "Assigned" || selectedAsset.status === "ASSIGNED") && selectedAsset.assignedTo && (() => {
                  const assignedUser = users.find(u => u.id === selectedAsset.assignedTo);
                  if (assignedUser) {
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Assigned To
                          </label>
                          <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded-lg">
                            {assignedUser.empName || assignedUser.username || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Assigned User Department
                          </label>
                          <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded-lg">
                            {assignedUser.department || "-"}
                          </p>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset History Modal */}
      {showHistoryModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Asset History: {selectedAsset.assetId || selectedAsset.name || selectedAsset.assetName}
              </h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedAsset(null);
                  setAssetHistory([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
              ) : assetHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History size={48} className="mx-auto mb-4 text-slate-300" />
                  <p>No history available for this asset</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assetHistory.map((record, index) => {
                    const actionColors = {
                      CREATED: "bg-green-100 text-green-800",
                      UPDATED: "bg-blue-100 text-blue-800",
                      ASSIGNED: "bg-purple-100 text-purple-800",
                      UNASSIGNED: "bg-orange-100 text-orange-800",
                      STATUS_CHANGE: "bg-yellow-100 text-yellow-800",
                      DELETED: "bg-red-100 text-red-800",
                    };

                    const formatDate = (dateString) => {
                      if (!dateString) return "N/A";
                      try {
                        // Parse the date string - SQLite returns dates as strings
                        let date;
                        
                        // If dateString is already a Date object
                        if (dateString instanceof Date) {
                          date = dateString;
                        } else {
                          // SQLite DATETIME format: "YYYY-MM-DD HH:MM:SS"
                          // If it doesn't have timezone info, treat as local time
                          if (typeof dateString === 'string' && dateString.includes('T')) {
                            // ISO format with timezone
                            date = new Date(dateString);
                          } else if (typeof dateString === 'string' && dateString.includes(' ')) {
                            // SQLite format: "YYYY-MM-DD HH:MM:SS" - treat as UTC and convert to local
                            date = new Date(dateString + ' UTC');
                          } else {
                            date = new Date(dateString);
                          }
                        }
                        
                        // Check if date is valid
                        if (isNaN(date.getTime())) {
                          console.warn("Invalid date:", dateString);
                          return dateString; // Return original if can't parse
                        }
                        
                        // Format date in local timezone with 12-hour format
                        return date.toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        });
                      } catch (error) {
                        console.error("Error formatting date:", error, dateString);
                        return dateString || "Invalid Date";
                      }
                    };

                    // Format change details based on action type
                    const getChangeDetails = () => {
                      if (record.action === "ASSIGNED" || record.action === "UNASSIGNED") {
                        const assignedToId = record.action === "ASSIGNED" 
                          ? (record.new_value?.assigned_to)
                          : (record.old_value?.assigned_to);
                        
                        if (assignedToId) {
                          const assignedUser = users.find(u => u.id === assignedToId);
                          if (assignedUser) {
                            return (
                              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <p className="text-sm font-semibold text-slate-700 mb-2">
                                  {record.action === "ASSIGNED" ? "Assigned To:" : "Unassigned From:"}
                                </p>
                                <div className="space-y-1 text-sm">
                                  <p className="text-slate-800">
                                    <span className="font-medium">Name:</span> {assignedUser.empName || assignedUser.full_name || assignedUser.username || "Unknown"}
                                  </p>
                                  {assignedUser.employeeId && (
                                    <p className="text-slate-800">
                                      <span className="font-medium">Employee Code:</span> {assignedUser.employeeId}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        }
                        return null;
                      } else if (record.action === "STATUS_CHANGE") {
                        const oldStatus = record.old_value?.status || "N/A";
                        const newStatus = record.new_value?.status || "N/A";
                        
                        // Map status codes to user-friendly names
                        const statusMap = {
                          "ASSIGNED": "Assigned",
                          "IN_STOCK": "Available (In Stock)",
                          "REPAIR": "Repair",
                          "MISUSE": "Misuse",
                          "SCRAP": "Scrap",
                          "MAINTENANCE": "Maintenance",
                          "LOST": "Lost",
                          "RETIRED": "Retired",
                          "DISPOSED": "Disposed",
                        };
                        
                        return (
                          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-slate-700 mb-2">Status Change:</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                {statusMap[oldStatus] || oldStatus}
                              </span>
                              <span className="text-slate-500">→</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                {statusMap[newStatus] || newStatus}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    };

                    return (
                      <div
                        key={record.history_id || index}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                actionColors[record.action] || "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {record.action}
                            </span>
                            <span className="text-sm text-slate-600">
                              {formatDate(record.performed_at)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            by {record.full_name || record.username || "Unknown User"}
                          </div>
                        </div>

                        {record.notes && (
                          <p className="text-sm text-slate-700 mb-2">{record.notes}</p>
                        )}

                        {getChangeDetails()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedAsset(null);
                  setAssetHistory([]);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (noLayout) {
    return content;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      {content}
    </div>
  );
}
