import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">
        Welcome, <span className="text-red-500 font-bold">{user?.username || "User"}</span>
      </h2>

      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-colors shadow-md hover:bg-red-600 hover:shadow-lg"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
