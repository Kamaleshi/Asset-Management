import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import IllumineiLogo from "../components/IllumineiLogo";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupUsername, setSetupUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Username and password are required");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/login", { 
        username: trimmedUsername, 
        password: trimmedPassword 
      });
      
      login({
        token: response.data.token,
        user: {
          id: response.data.id,
          username: response.data.username,
          role: response.data.role,
        },
      });
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      const errorData = err.response?.data;
      
      // Check if user needs to set password
      if (errorData?.requiresPasswordSetup) {
        setShowPasswordSetup(true);
        setSetupUsername(errorData.username || trimmedUsername);
        setError("");
        setLoading(false);
        return;
      }
      
      const errorMessage = errorData?.message || err.message || "Invalid username or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e) => {
    e.preventDefault();
    setSetupError("");

    if (!newPassword || !confirmPassword) {
      setSetupError("Password and confirm password are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSetupError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setSetupError("Password must be at least 6 characters long");
      return;
    }

    setSetupLoading(true);

    try {
      const response = await api.post("/auth/set-password", {
        username: setupUsername,
        password: newPassword,
        confirmPassword: confirmPassword,
      });

      login({
        token: response.data.token,
        user: {
          id: response.data.id,
          username: response.data.username,
          role: response.data.role,
        },
      });
      navigate("/");
    } catch (err) {
      console.error("Password setup error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to set password";
      setSetupError(errorMessage);
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-fadeIn"
      >
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <IllumineiLogo size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Asset Management
          </h2>
          <p className="text-slate-600">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all p-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setForgotUsername(username.trim());
                setError("");
              }}
              className="text-sm text-red-500 hover:text-red-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-sm text-blue-500 hover:underline"
            >
              Don't have an account? Create one
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Copyright © 2026 IT Team - Illumine Industries Pvt Ltd. All rights reserved
          </p>
        </div>
      </form>

      {/* Password Setup Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center">
                <IllumineiLogo size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Set Your Password
              </h2>
              <p className="text-slate-600">Welcome, {setupUsername}! Please set your password to continue.</p>
            </div>

            {setupError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{setupError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={setupLoading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all p-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {setupLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Setting password...
                  </span>
                ) : (
                  "Set Password & Sign In"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordSetup(false);
                  setSetupUsername("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setSetupError("");
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 p-3 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center">
                <IllumineiLogo size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Reset Password
              </h2>
              <p className="text-slate-600">Enter your username and set a new password</p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{forgotError}</p>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm text-center">{forgotSuccess}</p>
              </div>
            )}

            {!forgotSuccess ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotError("");
                  setForgotSuccess("");

                  if (!forgotUsername.trim() || !resetPassword.trim() || !resetConfirmPassword.trim()) {
                    setForgotError("All fields are required");
                    return;
                  }

                  if (resetPassword !== resetConfirmPassword) {
                    setForgotError("Passwords do not match");
                    return;
                  }

                  if (resetPassword.length < 6) {
                    setForgotError("Password must be at least 6 characters long");
                    return;
                  }

                  setForgotLoading(true);

                  try {
                    await api.post("/auth/reset-password", {
                      username: forgotUsername.trim(),
                      newPassword: resetPassword,
                      confirmPassword: resetConfirmPassword,
                    });
                    setForgotSuccess("Password reset successfully! You can now login with your new password.");
                    setForgotError("");
                    // Clear form after 3 seconds and close modal
                    setTimeout(() => {
                      setShowForgotPassword(false);
                      setForgotUsername("");
                      setResetPassword("");
                      setResetConfirmPassword("");
                      setForgotSuccess("");
                      setForgotError("");
                    }, 3000);
                  } catch (err) {
                    console.error("Reset password error:", err);
                    const errorMessage = err.response?.data?.message || err.message || "Failed to reset password";
                    setForgotError(errorMessage);
                  } finally {
                    setForgotLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all p-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {forgotLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Resetting password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotUsername("");
                    setResetPassword("");
                    setResetConfirmPassword("");
                    setForgotError("");
                    setForgotSuccess("");
                  }}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 p-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotUsername("");
                  setResetPassword("");
                  setResetConfirmPassword("");
                  setForgotError("");
                  setForgotSuccess("");
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
