import authService from "./authService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class LearningPathServiceClient {
  async getAuthHeaders() {
    const token = authService.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Generates a new personalized learning path from profile & recommendations
   */
  async generatePath(options = {}) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/learning-path/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to generate learning path",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Explicitly regenerates the learning path, incrementing version and archiving prior
   */
  async regeneratePath(options = {}) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/learning-path/regenerate`, {
      method: "POST",
      headers,
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to regenerate learning path",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves the current active learning path
   */
  async getCurrentPath() {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/learning-path/current`, {
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve current learning path",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves learning path version history
   */
  async getPathHistory() {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/learning-path/history`, {
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve learning path history",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }

  /**
   * Retrieves a specific learning path by ID
   */
  async getPathById(pathId) {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/learning-path/${pathId}`, {
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(
        data.message || "Failed to retrieve learning path",
      );
      error.data = data;
      error.statusCode = res.status;
      throw error;
    }
    return data;
  }
}

const learningPathService = new LearningPathServiceClient();
export default learningPathService;
