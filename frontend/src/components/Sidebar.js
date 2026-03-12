import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Box, Users, Settings, ChevronDown, Tags, FileText, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import IllumineiLogo from "./IllumineiLogo";

export default function Sidebar() {
  const { role } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  let activeSection = params.get("section") || null;
  const validSections = ["users", "assets", "asset-types", "categories", "reports"];
  if (!validSections.includes(activeSection)) activeSection = null;

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

        {/* Assets moved under Settings submenu */}

        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <>
            <button
              onClick={() => {
                setSettingsOpen(prev => !prev);
                // navigate to settings with current or default section
                let section = activeSection || "users";
                navigate(`/settings?section=${section}`);
              }}
              className="flex items-center justify-between gap-3 p-3 w-full text-left rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            >
              <span className="flex items-center gap-3">
                <Settings size={20} /> Settings
              </span>
              <ChevronDown size={18} className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
            </button>

            {settingsOpen && (
              <div className="ml-4 space-y-1">
                <Link
                  to={`/settings?section=users`}
                  className={
                    activeSection === "users"
                      ? "flex items-center gap-3 p-2 rounded-md bg-slate-900 text-white shadow-md"
                      : "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }
                >
                  <Users size={16} /> Users
                </Link>

                <Link
                  to={`/settings?section=assets`}
                  className={
                    activeSection === "assets"
                      ? "flex items-center gap-3 p-2 rounded-md bg-slate-900 text-white shadow-md"
                      : "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }
                >
                  <Box size={16} /> Assets
                </Link>

                <Link
                  to={`/settings?section=asset-types`}
                  className={
                    activeSection === "asset-types"
                      ? "flex items-center gap-3 p-2 rounded-md bg-slate-900 text-white shadow-md"
                      : "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }
                >
                  <Layers size={16} /> Assets Type
                </Link>

                <Link
                  to={`/settings?section=categories`}
                  className={
                    activeSection === "categories"
                      ? "flex items-center gap-3 p-2 rounded-md bg-slate-900 text-white shadow-md"
                      : "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }
                >
                  <Tags size={16} /> Categories
                </Link>


                <Link
                  to={`/settings?section=reports`}
                  className={
                    activeSection === "reports"
                      ? "flex items-center gap-3 p-2 rounded-md bg-slate-900 text-white shadow-md"
                      : "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }
                >
                  <FileText size={16} /> Reports
                </Link>
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
