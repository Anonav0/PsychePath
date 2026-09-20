import api from "./api";

const TOKEN_KEY = "psychepath_token";
const USER_KEY = "psychepath_user";

export const authService = {
  /**
   * Register a new student account
   */
  async register({ firstName, lastName, email, password }) {
    const res = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
    });
    if (res.success && res.data?.token) {
      this.saveSession(res.data.token, res.data.user);
    }
    return res;
  },

  /**
   * Log in user with credentials
   */
  async login({ email, password }) {
    const res = await api.post("/auth/login", { email, password });
    if (res.success && res.data?.token) {
      this.saveSession(res.data.token, res.data.user);
    }
    return res;
  },

  /**
   * Retrieve current authenticated user from backend
   */
  async getMe() {
    const res = await api.get("/auth/me");
    if (res.success && res.data) {
      this.setUser(res.data);
    }
    return res;
  },

  /**
   * Test student access
   */
  async testStudentAccess() {
    return await api.get("/auth/student-test");
  },

  /**
   * Test admin access
   */
  async testAdminAccess() {
    return await api.get("/auth/admin-test");
  },

  saveSession(token, user) {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      window.dispatchEvent(new Event("auth_state_changed"));
    }
  },

  setUser(user) {
    if (typeof window !== "undefined" && user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event("auth_state_changed"));
    }
  },

  clearSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("auth_state_changed"));
    }
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;
