import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">
        Welcome, <span className="text-red-500 font-bold">{user?.username || "User"}</span>
      </h2>

      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
