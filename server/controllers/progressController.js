const progressService = require("../services/progressService");
const progressHistoryService = require("../services/progressHistoryService");
const { successResponse, errorResponse } = require("../utils/apiResponse");

/**
 * Controller delegating progress actions to service layer
 */

const startModule = async (req, res, next) => {
  try {
    const { learningPathId, moduleId } = req.body;
    const result = await progressService.startModule(
      req.user._id,
      learningPathId,
      moduleId,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Module started successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const { learningPathId, moduleId, percentage } = req.body;
    const result = await progressService.updateProgress(
      req.user._id,
      learningPathId,
      moduleId,
      percentage,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Progress updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const completeModule = async (req, res, next) => {
  try {
    const { learningPathId, moduleId } = req.body;
    const result = await progressService.completeModule(
      req.user._id,
      learningPathId,
      moduleId,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Module completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const skipModule = async (req, res, next) => {
  try {
    const { learningPathId, moduleId } = req.body;
    const result = await progressService.skipModule(
      req.user._id,
      learningPathId,
      moduleId,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Module skipped successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentPathProgress = async (req, res, next) => {
  try {
    const result = await progressService.getCurrentPathProgress(req.user._id);

    if (!result) {
      return errorResponse(res, {
        statusCode: 404,
        message: "No active learning path found for this user",
        errorCode: "LEARNING_PATH_NOT_FOUND",
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Current learning path progress retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPathProgress = async (req, res, next) => {
  try {
    const { learningPathId } = req.params;
    const result = await progressService.getPathProgress(
      req.user._id,
      learningPathId,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Learning path progress retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPathSummary = async (req, res, next) => {
  try {
    const { learningPathId } = req.params;
    const result = await progressService.getPathSummary(
      req.user._id,
      learningPathId,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Learning path summary retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPathHistory = async (req, res, next) => {
  try {
    const { learningPathId } = req.params;
    const result = await progressHistoryService.getHistory(
      req.user._id,
      learningPathId,
      req.query,
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Progress history retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startModule,
  updateProgress,
  completeModule,
  skipModule,
  getCurrentPathProgress,
  getPathProgress,
  getPathSummary,
  getPathHistory,
};
