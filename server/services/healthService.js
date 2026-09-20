const { getDBStatus } = require("../config/database");

/**
 * Service to retrieve current health and runtime status of the API
 */
const getHealthStatus = () => {
  const dbStatus = getDBStatus();
  return {
    message: "PsychePath API is running",
    timestamp: new Date().toISOString(),
    database: dbStatus.state,
    uptime: Math.floor(process.uptime()),
  };
};

module.exports = {
  getHealthStatus,
};
