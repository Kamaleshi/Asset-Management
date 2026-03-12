import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { AuthShell } from "../components/AuthShell";
import { SignupForm } from "../components/signup-form";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirmPassword) {
      setError("Username and password are required");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        username: trimmedUsername,
        password: trimmedPassword,
        confirmPassword: trimmedConfirmPassword,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
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
      console.error("Signup error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to register"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <SignupForm
        confirmPassword={confirmPassword}
        email={email}
        error={error}
        fullName={fullName}
        loading={loading}
        onConfirmPasswordChange={setConfirmPassword}
        onEmailChange={setEmail}
        onFullNameChange={setFullName}
        onNavigateLogin={() => navigate("/login")}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        onUsernameChange={setUsername}
        password={password}
        username={username}
      />
    </AuthShell>
  );
}
