import { NavLink } from "react-router-dom";
import { LayoutGrid, Box, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import IllumineiLogo from "./IllumineiLogo";

export default function Sidebar() {
  const { role } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shadow-sm p-5">
      <div className="mb-8">
        <IllumineiLogo size={32} />
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-red-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            }`
          }
        >
          <LayoutGrid size={20} /> Dashboard
        </NavLink>

        <NavLink
          to="/assets"
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-red-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            }`
          }
        >
          <Box size={20} /> Assets
        </NavLink>

        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-red-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`
            }
          >
            <Users size={20} /> Users
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
