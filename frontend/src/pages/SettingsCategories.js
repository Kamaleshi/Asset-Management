import { useMemo, useState } from "react";
import { Plus, Trash2, X, Search } from "lucide-react";

const STORAGE_KEY = "asset_categories_v1";
const DEFAULT_TYPES = ["Consumable", "Fixed", "Rental", "Lease"];
const CREATE_NEW_TYPE_VALUE = "__create_new_type__";

const defaultCategories = DEFAULT_TYPES.map((type, index) => ({
  id: `default-${index + 1}`,
  type,
  createdAt: new Date().toISOString(),
}));

export default function SettingsCategories() {
  const [categories, setCategories] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
        return defaultCategories;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
        return defaultCategories;
      }

      return parsed;
    } catch (error) {
      console.error("Failed to load categories:", error);
      return defaultCategories;
    }
  });
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState("Consumable");
  const [newTypeInput, setNewTypeInput] = useState("");

  const typeOptions = useMemo(() => {
    const seen = new Set();
    DEFAULT_TYPES.forEach((type) => seen.add(type));
    categories.forEach((category) => {
      if (category?.type) seen.add(category.type);
    });
    return Array.from(seen);
  }, [categories]);

  const persistCategories = (next) => {
    setCategories(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filteredCategories = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((category) => {
      const type = (category.type || "").toLowerCase();
      return type.includes(term);
    });
  }, [categories, appliedSearch]);

  const handleAddCategory = (e) => {
    e.preventDefault();
    const chosenType =
      selectedType === CREATE_NEW_TYPE_VALUE ? newTypeInput.trim() : selectedType;

    if (!chosenType) return;

    const exists = categories.some(
      (category) =>
        (category.type || "").trim().toLowerCase() === chosenType.toLowerCase()
    );

    if (exists) {
      window.alert("This category type already exists.");
      return;
    }

    const next = [
      ...categories,
      {
        id: `cat-${Date.now()}`,
        type: chosenType,
        createdAt: new Date().toISOString(),
      },
    ];

    persistCategories(next);
    closeAddModal();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this category?")) return;
    const next = categories.filter((category) => category.id !== id);
    persistCategories(next);
  };

  const handleDeleteByType = (type) => {
    if (!type || type === CREATE_NEW_TYPE_VALUE) return;
    const existing = categories.find(
      (category) => (category.type || "").toLowerCase() === type.toLowerCase()
    );
    if (!existing) return;

    if (!window.confirm(`Delete category "${existing.type}"?`)) return;
    const next = categories.filter((category) => category.id !== existing.id);
    persistCategories(next);
    closeAddModal();
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedType("Consumable");
    setNewTypeInput("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Categories</h2>
          <p className="text-slate-600">Manage asset categories</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
            <input
              type="text"
              placeholder="Search by type"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedSearch(searchInput);
              }}
              className="w-64 text-sm outline-none"
            />
            {appliedSearch ? (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setAppliedSearch("");
                  setSearchInput("");
                }}
                className="ml-2"
              >
                <X size={16} className="text-slate-500" />
              </button>
            ) : (
              <button
                aria-label="Search"
                onClick={() => setAppliedSearch(searchInput)}
                className="ml-2"
              >
                <Search size={16} className="text-slate-500" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-white shadow-md transition-all hover:from-red-600 hover:to-red-700 hover:shadow-lg"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Created On</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-slate-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                      {category.type}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Add Category</h3>
              <button
                onClick={closeAddModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value={CREATE_NEW_TYPE_VALUE}>+ Create New Type</option>
                  </select>
                </div>

                {selectedType === CREATE_NEW_TYPE_VALUE && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Type Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTypeInput}
                      onChange={(e) => setNewTypeInput(e.target.value)}
                      placeholder="Enter new category type"
                      className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                )}

                {selectedType !== CREATE_NEW_TYPE_VALUE &&
                  categories.some(
                    (category) =>
                      (category.type || "").toLowerCase() === selectedType.toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteByType(selectedType)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-lg transition-colors font-medium border border-red-200"
                    >
                      Delete Existing Category
                    </button>
                  )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  {selectedType === CREATE_NEW_TYPE_VALUE
                    ? "Create & Add Category"
                    : "Add Category"}
                </button>
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
