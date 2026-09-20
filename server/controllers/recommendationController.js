const recommendationService = require("../services/recommendationService");
const { successResponse } = require("../utils/apiResponse");

class RecommendationController {
  async getRecommendations(req, res, next) {
    try {
      const data = await recommendationService.getRecommendations(
        req.user._id,
        req.query,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Recommendations generated successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecommendationController();
