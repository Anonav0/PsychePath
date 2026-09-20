import authService from "./authService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ProgressServiceClient {
  async getAuthHeaders() {
    const token = authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Starts a module in the learner's active path
   */
  async startModule(learningPathId, moduleId) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/progress/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({ learningPathId, moduleId }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Failed to start module");
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Updates progress percentage for a module
   */
  async updateProgress(learningPathId, moduleId, percentage) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/progress`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ learningPathId, moduleId, percentage }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Failed to update progress");
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Marks a module as completed (sets percentage to 100%)
   */
  async completeModule(learningPathId, moduleId) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/progress/complete`, {
      method: "POST",
      headers,
      body: JSON.stringify({ learningPathId, moduleId }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Failed to complete module");
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Skips a module in the learning path
   */
  async skipModule(learningPathId, moduleId) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/progress/skip`, {
      method: "POST",
      headers,
      body: JSON.stringify({ learningPathId, moduleId }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Failed to skip module");
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves full progress for the active learning path
   */
  async getCurrentPathProgress() {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/progress/current`, {
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve current path progress",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves progress for a specific learning path
   */
  async getPathProgress(learningPathId) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/progress/${learningPathId}`, {
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve path progress",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves calculated summary metrics for a learning path
   */
  async getPathSummary(learningPathId) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/progress/summary/${learningPathId}`,
      {
        headers,
      },
    );

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve path summary",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves immutable progress history with optional filters
   */
  async getPathHistory(learningPathId, params = {}) {
    const headers = await this.getAuthHeaders();
    const query = new URLSearchParams();
    if (params.moduleId) query.append("moduleId", params.moduleId);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(
      `${API_BASE_URL}/progress/${learningPathId}/history${qs}`,
      {
        headers,
      },
    );

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve progress history",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }
}

const progressService = new ProgressServiceClient();
export default progressService;
