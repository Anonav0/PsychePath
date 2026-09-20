const healthService = require("../services/healthService");

/**
 * Controller to handle GET /api/health
 */
const getHealth = (req, res) => {
  const healthData = healthService.getHealthStatus();

  return res.status(200).json({
    success: true,
    message: healthData.message,
    timestamp: healthData.timestamp,
    database: healthData.database,
    uptime: healthData.uptime,
  });
};

module.exports = {
  getHealth,
};
