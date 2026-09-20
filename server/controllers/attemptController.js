const assessmentAttemptService = require("../services/assessmentAttemptService");
const { successResponse } = require("../utils/apiResponse");

class AttemptController {
  async startAttempt(req, res, next) {
    try {
      const result = await assessmentAttemptService.startAttempt(
        req.params.assessmentId,
        req.user._id,
      );
      return successResponse(res, {
        statusCode: result.isExisting ? 200 : 201,
        message: result.message,
        data: result.attempt,
      });
    } catch (err) {
      next(err);
    }
  }

  async getActiveAttempt(req, res, next) {
    try {
      const attempt = await assessmentAttemptService.getActiveAttempt(
        req.params.assessmentId,
        req.user._id,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Active attempt retrieved successfully",
        data: attempt,
      });
    } catch (err) {
      next(err);
    }
  }

  async saveAnswers(req, res, next) {
    try {
      const answers = req.sanitizedAnswers || req.body.answers;
      const result = await assessmentAttemptService.saveAnswers(
        req.params.attemptId,
        req.user._id,
        answers,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Answers saved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitAttempt(req, res, next) {
    try {
      const result = await assessmentAttemptService.submitAttempt(
        req.params.attemptId,
        req.user._id,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Assessment submitted and scored successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAttemptResult(req, res, next) {
    try {
      const result = await assessmentAttemptService.getAttemptResult(
        req.params.attemptId,
        req.user,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Assessment result retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyAttempts(req, res, next) {
    try {
      const attempts = await assessmentAttemptService.getUserAttempts(
        req.user._id,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Assessment attempts retrieved successfully",
        data: attempts,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllAttempts(req, res, next) {
    try {
      const filter = {};
      if (req.query.assessment) filter.assessment = req.query.assessment;
      if (req.query.user) filter.user = req.query.user;
      if (req.query.status) filter.status = req.query.status;

      const attempts = await assessmentAttemptService.getAllAttempts(filter);
      return successResponse(res, {
        statusCode: 200,
        message: "All assessment attempts retrieved successfully",
        data: attempts,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttemptController();
