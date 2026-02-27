import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import SettingsCategories from "./SettingsCategories";
import SettingsAssetTypes from "./SettingsAssetTypes";
import Reports from "./Reports";
import Users from "./Users";
import Assets from "./Assets";

// placeholder no longer used; Users component will display content

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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="flex-1 p-6 bg-slate-50">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            {Content}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
