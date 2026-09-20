const questionService = require("../services/questionService");
const { successResponse } = require("../utils/apiResponse");

class QuestionController {
  async addQuestion(req, res, next) {
    try {
      const question = await questionService.addQuestion(
        req.params.assessmentId,
        req.body,
      );
      return successResponse(res, {
        statusCode: 201,
        message: "Question added successfully",
        data: question,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQuestions(req, res, next) {
    try {
      const isAdmin = req.user?.role === "ADMIN";
      const questions = await questionService.getQuestionsByAssessment(
        req.params.assessmentId,
        {
          isAdmin,
        },
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Questions retrieved successfully",
        data: questions,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQuestionById(req, res, next) {
    try {
      const question = await questionService.getQuestionById(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: "Question retrieved successfully",
        data: question,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateQuestion(req, res, next) {
    try {
      const question = await questionService.updateQuestion(
        req.params.id,
        req.body,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Question updated successfully",
        data: question,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteQuestion(req, res, next) {
    try {
      const result = await questionService.deleteQuestion(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async reorderQuestion(req, res, next) {
    try {
      const question = await questionService.reorderQuestion(
        req.params.id,
        req.body.order,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Question reordered successfully",
        data: question,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new QuestionController();
