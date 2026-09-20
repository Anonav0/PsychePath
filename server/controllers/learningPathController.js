/**
 * PsychePath - Learning Path Controller
 *
 * Handles HTTP request dispatching for learning path generation,
 * regeneration, and retrieval with strict user ownership enforcement.
 */

const learningPathService = require("../services/learningPathService");
const { successResponse } = require("../utils/apiResponse");

class LearningPathController {
  /**
   * POST /api/learning-path/generate
   */
  async generateLearningPath(req, res, next) {
    try {
      const data = await learningPathService.generateLearningPath(
        req.user._id,
        req.body,
      );

      return successResponse(res, {
        statusCode: 201,
        message: "Learning path generated successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/learning-path/regenerate
   */
  async regenerateLearningPath(req, res, next) {
    try {
      const data = await learningPathService.regenerateLearningPath(
        req.user._id,
        req.body,
      );

      return successResponse(res, {
        statusCode: 200,
        message: "Learning path regenerated successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning-path/current (or GET /api/learning-path)
   */
  async getCurrentPath(req, res, next) {
    try {
      const data = await learningPathService.getCurrentPath(req.user._id);

      return successResponse(res, {
        statusCode: 200,
        message: data
          ? "Current learning path retrieved successfully"
          : "No active learning path found",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning-path/history
   */
  async getPathHistory(req, res, next) {
    try {
      const data = await learningPathService.getPathHistory(req.user._id);

      return successResponse(res, {
        statusCode: 200,
        message: "Learning path history retrieved successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/learning-path/:id
   */
  async getPathById(req, res, next) {
    try {
      const data = await learningPathService.getPathById(
        req.user._id,
        req.params.id,
        req.user.role,
      );

      return successResponse(res, {
        statusCode: 200,
        message: "Learning path retrieved successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LearningPathController();
