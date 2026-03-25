import { useNavigate } from "react-router-dom";
import useAuthStore from "../../../shared/stores/authStore.js";
import Button from "../components/common/Button.jsx";
import OverviewMetrics from "../components/dashboard/OverviewMetrics.jsx";
import Sidebar from "../components/dashboard/Sidebar.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-dukaan-green-600">
                  Manage Your Two Shops
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {user?.firstName}!
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OverviewMetrics />
        </main>
      </div>
    </div>
  );
}
