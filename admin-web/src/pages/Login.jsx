import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import { login, verifyMFA } from "../services/auth.service.js";
import useAuthStore from "../store/authStore.js";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, setMFARequired, requiresMFA, mfaUserId } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.requiresMFA) {
        setMFARequired(result.userId);
      } else {
        setAuth(result.user, result.accessToken, result.refreshToken);
        navigate("/inventory");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verifyMFA(mfaUserId, formData.otp);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate("/inventory");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dukaan-green-600">
            DukaanSync
          </h1>
          <p className="mt-2 text-gray-600">Admin Dashboard</p>
        </div>

        <Card>
          {!requiresMFA ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Sign In
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
                  placeholder="owner@dukaansync.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>Demo credentials:</p>
                <p className="font-mono">owner@dukaansync.com / Password123!</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMFAVerify} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Verify OTP
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit code to your email. Please enter it below.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One-Time Password
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
