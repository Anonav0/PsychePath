const adminService = require("../services/adminService");
const { successResponse } = require("../utils/apiResponse");

class AdminController {
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getAdminStats();
      return successResponse(res, {
        statusCode: 200,
        message: "Admin overview statistics retrieved successfully",
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLearners(req, res, next) {
    try {
      const { search, status, page, limit } = req.query;
      const result = await adminService.getLearners({
        search,
        status,
        page,
        limit,
      });
      return successResponse(res, {
        statusCode: 200,
        message: "Learners retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLearnerDetails(req, res, next) {
    try {
      const details = await adminService.getLearnerDetails(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: "Learner details retrieved successfully",
        data: details,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleLearnerStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const user = await adminService.toggleLearnerStatus(
        req.params.id,
        isActive,
      );
      return successResponse(res, {
        statusCode: 200,
        message: `Learner account ${user.isActive ? "activated" : "deactivated"} successfully`,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
