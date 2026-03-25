import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import useAuthStore from "./store/authStore.js";

// Lazy load page components for code splitting and better initial load performance
const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Inventory = lazy(() => import("./pages/Inventory.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const Alerts = lazy(() => import("./pages/Alerts.jsx"));
const Suppliers = lazy(() => import("./pages/Suppliers.jsx"));

// Loading fallback component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-dukaan-green-50 to-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dukaan-green-200 border-t-dukaan-green-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dukaan-green-700 font-medium text-lg">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
