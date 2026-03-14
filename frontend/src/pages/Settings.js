import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import SettingsCategories from "./SettingsCategories";
import SettingsAssetTypes from "./SettingsAssetTypes";
import Reports from "./Reports";
import Users from "./Users";
import Assets from "./Assets";

export default function Settings() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  let section = params.get("section") || "users";
  const validSections = ["users", "assets", "asset-types", "categories", "reports"];
  if (!validSections.includes(section)) section = "users";

  let Content = null;
  if (section === "users") Content = <Users hideLayout />;
  else if (section === "assets") Content = <Assets noLayout />;
  else if (section === "asset-types") Content = <SettingsAssetTypes />;
  else if (section === "categories") Content = <SettingsCategories />;
  else if (section === "reports") Content = <Reports />;
  else Content = <Users hideLayout />; // default

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex min-h-0 flex-col">
        <Topbar />

        <div className="flex-1 min-h-0 overflow-hidden bg-slate-50 p-4">
          <div className="mb-4 shrink-0">
            <h1 className="text-[2rem] font-bold text-slate-800">Settings</h1>
          </div>

          <div className="flex h-[calc(100%-3.5rem)] min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
            {Content}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
