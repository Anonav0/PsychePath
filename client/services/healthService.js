import api from "./api";

/**
 * Checks backend health endpoint: GET /api/health
 * @returns {Promise<Object>} Backend health response
 */
export const checkBackendHealth = async () => {
  return await api.get("/health");
};
