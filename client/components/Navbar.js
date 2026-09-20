"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import authService from "../services/authService";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getUser());
    };

    updateUser();
    window.addEventListener("auth_state_changed", updateUser);
    return () => window.removeEventListener("auth_state_changed", updateUser);
  }, []);

  const handleLogout = () => {
    authService.clearSession();
    window.location.href = "/login";
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <Link href="/" className="logo-text">
            PsychePath
          </Link>
          <span className="phase-tag">Phase 8: Gemini AI Integration</span>
        </div>

        <nav className="header-nav">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/assessments" className="nav-link">
            Assessments
          </Link>
          <Link href="/curriculum" className="nav-link">
            Curriculum
          </Link>
          <Link href="/recommendations" className="nav-link">
            Recommendations
          </Link>
          {user && (
            <Link href="/profile" className="nav-link">
              Profile
            </Link>
          )}

          {user ? (
            <div className="user-nav-container">
              <span className="user-name">
                {user.firstName} {user.lastName}
              </span>
              <span className={`role-badge role-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link href="/login" className="nav-link">
                Sign In
              </Link>
              <Link href="/register" className="register-nav-btn">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
