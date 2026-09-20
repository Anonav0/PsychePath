"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authService from "../../services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await authService.login({ email, password });
      setSuccessMessage(
        `Welcome back, ${res.data.user.firstName}! Redirecting...`,
      );
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type) => {
    if (type === "admin") {
      setEmail("admin@psychepath.io");
      setPassword("AdminPassword2026!");
    } else if (type === "student") {
      setEmail("alex.chen@example.com");
      setPassword("StudentPassword2026!");
    }
    setErrorMessage("");
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Sign In to PsychePath</h2>
          <p className="auth-subtitle">
            Access your personalized learning journey
          </p>
        </div>

        {errorMessage && (
          <div className="auth-alert alert-error">
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert alert-success">
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="auth-dev-helpers">
          <p className="dev-helper-title">Quick Fill Demo Accounts:</p>
          <div className="dev-helper-buttons">
            <button
              type="button"
              className="quick-fill-btn btn-admin"
              onClick={() => fillCredentials("admin")}
            >
              Fill Admin (admin@psychepath.io)
            </button>
            <button
              type="button"
              className="quick-fill-btn btn-student"
              onClick={() => fillCredentials("student")}
            >
              Fill Student (alex.chen@example.com)
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-link">
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
