import api from "./api";

class AdminService {
  /**
   * Fetches high-level administrative platform metrics
   */
  async getStats() {
    return await api.get("/admin/stats");
  }

  /**
   * Retrieves paginated, searchable, and filterable list of learners
   * @param {Object} params - { search, status, page, limit }
   */
  async getLearners(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return await api.get(`/admin/learners${queryString}`);
  }

  /**
   * Retrieves detailed learner inspection data
   * @param {string} id - Learner user ID
   */
  async getLearnerDetails(id) {
    return await api.get(`/admin/learners/${id}`);
  }

  /**
   * Toggles learner account active status
   * @param {string} id - Learner user ID
   * @param {boolean} isActive
   */
  async toggleLearnerStatus(id, isActive) {
    return await api.patch(`/admin/learners/${id}/status`, { isActive });
  }
}

const adminService = new AdminService();
export default adminService;
