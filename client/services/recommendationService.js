import api from "./api";

class RecommendationService {
  /**
   * Retrieves deterministic recommendations for authenticated student
   * @param {Object} params - { limit, difficulty, category }
   */
  async getRecommendations(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return await api.get(`/recommendations${queryString}`);
  }
}

const recommendationService = new RecommendationService();
export default recommendationService;
