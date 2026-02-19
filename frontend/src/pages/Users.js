import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, X, Edit, Package, Info, Search } from "lucide-react";

export default function Users() {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  // `userSearchInput` is the input box state; `userSearch` is the applied filter
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [selectedUserAssets, setSelectedUserAssets] = useState([]);
  const [selectedUserForAssets, setSelectedUserForAssets] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    role: "EMPLOYEE",
    category: "",
    empName: "",
    employeeId: "",
    department: "",
    businessUnit: "",
    businessHead: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, assetsRes] = await Promise.all([
          api.get("/users"),
          api.get("/assets"),
        ]);
        setUsers(usersRes.data || []);
        setAssets(assetsRes.data || []);
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  const filteredUsers = users.filter(u => {
    if (!userSearch || !userSearch.trim()) return true;
    const term = userSearch.trim().toLowerCase();
    const empCode = (u.employeeId || "").toString().toLowerCase();
    const empName = (u.empName || u.username || "").toLowerCase();
    return empCode.includes(term) || empName.includes(term);
  });

  const getAssetCount = (userId) => {
    return assets.filter((asset) => asset.assignedTo === userId).length;
  };

  const getUserAssets = (userId) => {
    return assets.filter((asset) => asset.assignedTo === userId);
  };

  const getAssetBreakdown = (userId) => {
    const userAssets = getUserAssets(userId);
    const breakdown = {};
    userAssets.forEach((asset) => {
      const category = asset.category || "Other";
      breakdown[category] = (breakdown[category] || 0) + 1;
    });
    return breakdown;
  };

  const handleViewAssets = (user) => {
    const userAssets = getUserAssets(user.id);
    setSelectedUserAssets(userAssets);
    setSelectedUserForAssets(user);
    setShowAssetsModal(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.username.trim() || !formData.employeeId.trim()) {
      setFormError("Username and Employee ID are required");
      return;
    }

    try {
      await api.post("/users", formData);
      const response = await api.get("/users");
      setUsers(response.data || []);
      setFormData({
        username: "",
        role: "EMPLOYEE",
        category: "",
        empName: "",
        employeeId: "",
        department: "",
        businessUnit: "",
        businessHead: "",
      });
      setShowAddModal(false);
      setFormError("");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to add user");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.username.trim() || !formData.employeeId.trim()) {
      setFormError("Username and Employee ID are required");
      return;
    }

    try {
      await api.put(`/users/${editingUser.id}`, formData);
      const response = await api.get("/users");
      setUsers(response.data || []);
      setFormData({
        username: "",
        role: "EMPLOYEE",
        category: "",
        empName: "",
        employeeId: "",
        department: "",
        businessUnit: "",
        businessHead: "",
      });
      setShowEditModal(false);
      setEditingUser(null);
      setFormError("");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    // Prevent deletion of SUPER_ADMIN users
    if (userToDelete && userToDelete.role === "SUPER_ADMIN") {
      alert("Cannot delete System Administrator. Super admin users are protected and cannot be deleted.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to delete user";
      alert(errorMessage);
    }
  };

  const handleAssignAsset = async () => {
    if (!selectedAssetId) return;
    try {
      await api.put(`/assets/${selectedAssetId}`, {
        status: "Assigned",
        assignedTo: selectedUser.id,
      });
      const [usersRes, assetsRes] = await Promise.all([
        api.get("/users"),
        api.get("/assets"),
      ]);
      setUsers(usersRes.data || []);
      setAssets(assetsRes.data || []);
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedAssetId("");
    } catch (err) {
      alert("Failed to assign asset");
    }
  };

  const handleStartEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || "",
      role: user.role || "EMPLOYEE",
      category: user.category || "",
      empName: user.empName || "",
      employeeId: user.employeeId || "",
      department: user.department || "",
      businessUnit: user.businessUnit || "",
      businessHead: user.businessHead || "",
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Users</h1>
              <p className="text-slate-600">Manage system users</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
                <input
                  type="text"
                  placeholder="Search by Employee ID or Name"
                  value={userSearchInput}
                  onChange={(e) => setUserSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setUserSearch(userSearchInput); }}
                  className="outline-none w-56 text-sm"
                />
                {userSearch ? (
                  <button aria-label="Clear user search" onClick={() => { setUserSearch(""); setUserSearchInput(""); }} className="ml-2">
                    <X size={16} className="text-slate-500" />
                  </button>
                ) : (
                  <button aria-label="Search users" onClick={() => setUserSearch(userSearchInput)} className="ml-2">
                    <Search size={16} className="text-slate-500" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Add User
              </button>
            </div>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">
                        <div className="flex items-center gap-1">
                          Employee Category
                          <span className="text-slate-400" title="Employee category/type (e.g., Full-time, Contract, Intern)">
                            <Info size={12} />
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Employee Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Employee ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Business Unit</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Business Head</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Assets</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.category || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                          {user.empName || user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                          {user.employeeId || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.department || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.businessUnit || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.businessHead || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewAssets(user)}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full font-semibold transition-colors cursor-pointer"
                            title="Click to view assigned assets"
                          >
                            {getAssetCount(user.id)}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowAssignModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Assign Asset"
                            >
                              <Package size={18} />
                            </button>
                            {user.role !== "SUPER_ADMIN" && (
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Add New User</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    username: "",
                    role: "EMPLOYEE",
                    category: "",
                    empName: "",
                    employeeId: "",
                    department: "",
                    businessUnit: "",
                    businessHead: "",
                  });
                  setFormError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={formData.empName}
                    onChange={(e) => setFormData({ ...formData, empName: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Unit
                  </label>
                  <input
                    type="text"
                    value={formData.businessUnit}
                    onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Head
                  </label>
                  <input
                    type="text"
                    value={formData.businessHead}
                    onChange={(e) => setFormData({ ...formData, businessHead: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      username: "",
                      role: "EMPLOYEE",
                      category: "",
                      empName: "",
                      employeeId: "",
                      department: "",
                      businessUnit: "",
                      businessHead: "",
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setFormData({
                    username: "",
                    role: "EMPLOYEE",
                    category: "",
                    empName: "",
                    employeeId: "",
                    department: "",
                    businessUnit: "",
                    businessHead: "",
                  });
                  setFormError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={formData.empName}
                    onChange={(e) => setFormData({ ...formData, empName: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Unit
                  </label>
                  <input
                    type="text"
                    value={formData.businessUnit}
                    onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Head
                  </label>
                  <input
                    type="text"
                    value={formData.businessHead}
                    onChange={(e) => setFormData({ ...formData, businessHead: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role
                    {editingUser?.role === "SUPER_ADMIN" && (
                      <span className="ml-2 text-xs text-slate-500">(Protected - Cannot be changed)</span>
                    )}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editingUser?.role === "SUPER_ADMIN"}
                    className={`w-full p-3 rounded-lg border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500 ${
                      editingUser?.role === "SUPER_ADMIN" 
                        ? "bg-slate-100 cursor-not-allowed opacity-60" 
                        : "bg-slate-50"
                    }`}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                  {editingUser?.role === "SUPER_ADMIN" && (
                    <p className="mt-1 text-xs text-slate-500">
                      System Administrator role is protected and cannot be modified.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({
                      username: "",
                      role: "EMPLOYEE",
                      category: "",
                      empName: "",
                      employeeId: "",
                      department: "",
                      businessUnit: "",
                      businessHead: "",
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
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Assign Asset to: {selectedUser.empName || selectedUser.username}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser(null);
                  setSelectedAssetId("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Available Asset
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Choose an asset...</option>
                  {assets
                    .filter((asset) => asset.status === "Available" || asset.status === "IN_STOCK" || asset.assetStatus === "Available")
                    .map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.assetId || asset.name} - {asset.category || "General"}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAssignAsset}
                  disabled={!selectedAssetId}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Assign Asset
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedAssetId("");
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

      {/* User Assets Breakdown Modal */}
      {showAssetsModal && selectedUserForAssets && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Assigned Assets: {selectedUserForAssets.empName || selectedUserForAssets.username}
              </h3>
              <button
                onClick={() => {
                  setShowAssetsModal(false);
                  setSelectedUserForAssets(null);
                  setSelectedUserAssets([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              {selectedUserAssets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package size={48} className="mx-auto mb-4 text-slate-300" />
                  <p>No assets assigned to this user</p>
                </div>
              ) : (
                <>
                  {/* Asset Breakdown by Category */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Asset Summary</h4>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(getAssetBreakdown(selectedUserForAssets.id)).map(([category, count]) => (
                        <div
                          key={category}
                          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold"
                        >
                          {count} {category}{count > 1 ? "s" : ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Asset List */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Asset Details</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedUserAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {asset.assetId || asset.name}
                              </p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
                                <div>
                                  <span className="font-medium">Category:</span> {asset.category || "-"}
                                </div>
                                <div>
                                  <span className="font-medium">Brand:</span> {asset.brand || "-"}
                                </div>
                                <div>
                                  <span className="font-medium">Model:</span> {asset.model || "-"}
                                </div>
                                <div>
                                  <span className="font-medium">Serial:</span> {asset.serialNumber || "-"}
                                </div>
                                {asset.seatNo && (
                                  <div>
                                    <span className="font-medium">Seat:</span> {asset.seatNo}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              asset.status === "ASSIGNED" || asset.assetStatus === "Assigned"
                                ? "bg-green-100 text-green-800"
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              {asset.assetStatus || asset.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
