import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import Button from "../common/Button.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import Sidebar from "../dashboard/Sidebar.jsx";

/**
 * Layout - Common layout wrapper for all pages
 * Includes sidebar, header with theme toggle and logout
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} [props.subtitle] - Optional subtitle (defaults to welcome message)
 * @param {ReactNode} [props.actions] - Optional action buttons to display in header
 * @param {ReactNode} props.children - Page content
 */
export default function Layout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-secondary shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-dukaan-green-600 dark:text-dukaan-green-400">
                  {title}
                </h1>
                <p className="text-sm text-secondary mt-1">
                  {subtitle || `Welcome back, ${user?.firstName}!`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Custom action buttons for each page */}
                {actions}
                <ThemeToggle />
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
