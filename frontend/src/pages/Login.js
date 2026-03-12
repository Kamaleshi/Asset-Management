import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { AuthModalCard, AuthShell } from "../components/AuthShell";
import { LoginForm } from "../components/login-form";
import { Button } from "../components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../components/ui/field";
import { Input } from "../components/ui/input";

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

  const resetPasswordSetupState = () => {
    setShowPasswordSetup(false);
    setSetupUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setSetupError("");
  };

  const resetForgotState = () => {
    setShowForgotPassword(false);
    setForgotUsername("");
    setResetPassword("");
    setResetConfirmPassword("");
    setForgotError("");
    setForgotSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        password: trimmedPassword,
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

      if (errorData?.requiresPasswordSetup) {
        setShowPasswordSetup(true);
        setSetupUsername(errorData.username || trimmedUsername);
        setError("");
        setLoading(false);
        return;
      }

      setError(
        errorData?.message || err.message || "Invalid username or password"
      );
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
        confirmPassword,
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
      setSetupError(
        err.response?.data?.message || err.message || "Failed to set password"
      );
    } finally {
      setSetupLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (
      !forgotUsername.trim() ||
      !resetPassword.trim() ||
      !resetConfirmPassword.trim()
    ) {
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

      setForgotSuccess(
        "Password reset successfully. You can now sign in with the new password."
      );

      setTimeout(() => {
        resetForgotState();
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setForgotError(
        err.response?.data?.message || err.message || "Failed to reset password"
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <AuthShell>
      <LoginForm
        error={error}
        forgotLoading={forgotLoading}
        loading={loading}
        onForgotPassword={() => {
          setShowForgotPassword(true);
          setForgotUsername(username.trim());
          setError("");
        }}
        onNavigateSignup={() => navigate("/signup")}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        onUsernameChange={setUsername}
        password={password}
        username={username}
      />

      {showPasswordSetup ? (
        <AuthModalCard
          title="Set your password"
          description={`Welcome, ${setupUsername}. Create a password to continue.`}
          error={setupError}
        >
          <form onSubmit={handlePasswordSetup} className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="bg-background"
                  required
                  minLength={6}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password-setup">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirm-password-setup"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="bg-background"
                  required
                  minLength={6}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={setupLoading}
                  className="text-white hover:text-white"
                >
                  {setupLoading ? "Saving..." : "Set Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetPasswordSetupState}
                >
                  Cancel
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </AuthModalCard>
      ) : null}

      {showForgotPassword ? (
        <AuthModalCard
          title="Reset password"
          description="Enter your username and choose a new password."
          error=""
        >
          {forgotSuccess ? (
            <div className="space-y-4">
              <FieldDescription className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-emerald-700">
                {forgotSuccess}
              </FieldDescription>
              <Button
                type="button"
                onClick={resetForgotState}
                className="text-white hover:text-white"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="forgot-username">Username</FieldLabel>
                  <Input
                    id="forgot-username"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-background"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="forgot-password">New Password</FieldLabel>
                  <Input
                    id="forgot-password"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="bg-background"
                    required
                    minLength={6}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="forgot-confirm-password">
                    Confirm New Password
                  </FieldLabel>
                  <Input
                    id="forgot-confirm-password"
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="bg-background"
                    required
                    minLength={6}
                  />
                  {forgotError ? <FieldError>{forgotError}</FieldError> : null}
                </Field>

                <Field>
                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="text-white hover:text-white"
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForgotState}>
                    Cancel
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </AuthModalCard>
      ) : null}
    </AuthShell>
  );
}
