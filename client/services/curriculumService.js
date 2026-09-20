import api from "./api";

class CurriculumService {
  /**
   * Retrieves curriculum modules with filtering, pagination, and sorting
   * @param {Object} params - Query params (category, difficulty, skill, search, page, limit, sortBy, sortOrder)
   */
  async getModules(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return await api.get(`/curriculum/modules${queryString}`);
  }

  /**
   * Retrieves a single curriculum module by ID with populated prerequisites
   * @param {string} id
   */
  async getModuleById(id) {
    return await api.get(`/curriculum/modules/${id}`);
  }

  /**
   * Admin: Creates a new curriculum module
   * @param {Object} moduleData
   */
  async createModule(moduleData) {
    return await api.post("/curriculum/modules", moduleData);
  }

  /**
   * Admin: Updates an existing curriculum module
   * @param {string} id
   * @param {Object} updateData
   */
  async updateModule(id, updateData) {
    return await api.patch(`/curriculum/modules/${id}`, updateData);
  }

  /**
   * Admin: Toggles module active status
   * @param {string} id
   * @param {boolean} isActive
   */
  async toggleStatus(id, isActive) {
    return await api.patch(`/curriculum/modules/${id}/status`, { isActive });
  }

  /**
   * Admin: Deletes or deactivates curriculum module
   * @param {string} id
   */
  async deleteModule(id) {
    return await api.delete(`/curriculum/modules/${id}`);
  }
}

const curriculumService = new CurriculumService();
export default curriculumService;
