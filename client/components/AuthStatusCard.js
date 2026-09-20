"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import authService from "../services/authService";

export default function AuthStatusCard() {
  const [user, setUser] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const syncUser = () => {
    setUser(authService.getUser());
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("auth_state_changed", syncUser);
    return () => window.removeEventListener("auth_state_changed", syncUser);
  }, []);

  const handleTestStudent = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await authService.testStudentAccess();
      setTestResult({
        status: "success",
        code: 200,
        message: res.message || "Access granted to STUDENT endpoint",
      });
    } catch (err) {
      setTestResult({
        status: "error",
        code: err.status || 401,
        message: err.message || "Access denied",
      });
    } finally {
      setLoadingTest(false);
    }
  };

  const handleTestAdmin = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await authService.testAdminAccess();
      setTestResult({
        status: "success",
        code: 200,
        message: res.message || "Access granted to ADMIN endpoint",
      });
    } catch (err) {
      setTestResult({
        status: "error",
        code: err.status || 403,
        message: err.message || "Access denied to ADMIN endpoint",
      });
    } finally {
      setLoadingTest(false);
    }
  };

  const handleRefreshMe = async () => {
    setLoadingTest(true);
    try {
      const res = await authService.getMe();
      setTestResult({
        status: "success",
        code: 200,
        message: `Profile verified for: ${res.data.email} (${res.data.role})`,
      });
    } catch (err) {
      setTestResult({
        status: "error",
        code: err.status || 401,
        message: err.message,
      });
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="status-card auth-status-card">
      <div className="status-header">
        <h3 className="status-title">Authentication & RBAC Status</h3>
        {user && (
          <button
            onClick={handleRefreshMe}
            className="refresh-btn"
            disabled={loadingTest}
          >
            Verify /me
          </button>
        )}
      </div>

      <div className="status-indicator-container">
        <div className="indicator-row">
          <span className="indicator-label">Session:</span>
          {user ? (
            <span className="badge badge-success">
              <span className="dot dot-success"></span> Authenticated (
              {user.role})
            </span>
          ) : (
            <span className="badge badge-error">
              <span className="dot dot-error"></span> Unauthenticated
            </span>
          )}
        </div>
      </div>

      <div className="status-details">
        {user ? (
          <>
            <div className="detail-item">
              <span className="detail-key">Logged in as:</span>
              <span className="detail-val">
                {user.firstName} {user.lastName} ({user.email})
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-key">Assigned Role:</span>
              <span className={`detail-val role-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            </div>

            <div className="rbac-test-section">
              <p className="rbac-test-title">
                Test Role-Based Access Control (RBAC):
              </p>
              <div className="rbac-button-group">
                <button
                  onClick={handleTestStudent}
                  disabled={loadingTest}
                  className="test-route-btn"
                >
                  Test Student Route
                </button>
                <button
                  onClick={handleTestAdmin}
                  disabled={loadingTest}
                  className="test-route-btn btn-admin-test"
                >
                  Test Admin Route
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`test-result-box ${testResult.status === "success" ? "result-success" : "result-forbidden"}`}
              >
                <strong>HTTP {testResult.code}:</strong> {testResult.message}
              </div>
            )}
          </>
        ) : (
          <div className="unauth-prompt">
            <p>
              Sign in with a demo account to test JWT authentication,{" "}
              <code>/api/auth/me</code>, and Student vs. Admin RBAC
              authorization guards.
            </p>
            <div className="unauth-actions">
              <Link href="/login" className="btn-primary-small">
                Sign In
              </Link>
              <Link href="/register" className="btn-secondary-small">
                Register Student
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
