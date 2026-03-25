import { useLocation, useNavigate } from "react-router-dom";
import AlertBadge from "../alerts/AlertBadge.jsx";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/inventory", label: "Inventory", icon: "📦" },
    { path: "/orders", label: "Orders", icon: "🛒" },
    { path: "/alerts", label: "Alerts", icon: "⚠️", badge: true },
    { path: "/suppliers", label: "Suppliers", icon: "🚛" },
  ];

  return (
    <aside className="bg-white shadow-md w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-dukaan-green-600">DukaanSync</h2>
        <p className="text-sm text-gray-600 mt-1">Admin Portal</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-colors ${
                isActive
                  ? "bg-dukaan-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <div className="scale-75">
                  <AlertBadge />
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
