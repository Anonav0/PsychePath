const assessmentService = require("../services/assessmentService");
const { successResponse } = require("../utils/apiResponse");

class AssessmentController {
  async createAssessment(req, res, next) {
    try {
      const assessment = await assessmentService.createAssessment(
        req.body,
        req.user._id,
      );
      return successResponse(res, {
        statusCode: 201,
        message: "Assessment created successfully",
        data: assessment,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAssessments(req, res, next) {
    try {
      const isAdmin = req.user?.role === "ADMIN";
      const assessments = await assessmentService.getAssessments({ isAdmin });
      return successResponse(res, {
        statusCode: 200,
        message: "Assessments retrieved successfully",
        data: assessments,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAssessmentById(req, res, next) {
    try {
      const isAdmin = req.user?.role === "ADMIN";
      const assessment = await assessmentService.getAssessmentById(
        req.params.id,
        { isAdmin },
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Assessment details retrieved successfully",
        data: assessment,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAssessment(req, res, next) {
    try {
      const assessment = await assessmentService.updateAssessment(
        req.params.id,
        req.body,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Assessment updated successfully",
        data: assessment,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const assessment = await assessmentService.toggleStatus(
        req.params.id,
        isActive,
      );
      return successResponse(res, {
        statusCode: 200,
        message: `Assessment ${assessment.isActive ? "activated" : "deactivated"} successfully`,
        data: assessment,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAssessment(req, res, next) {
    try {
      const result = await assessmentService.deleteAssessment(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssessmentController();
