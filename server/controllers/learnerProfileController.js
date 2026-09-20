const learnerProfileService = require("../services/learnerProfileService");
const { successResponse } = require("../utils/apiResponse");

class LearnerProfileController {
  async getMyProfile(req, res, next) {
    try {
      const profile = await learnerProfileService.getProfileByUserId(
        req.user._id,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Learner profile retrieved successfully",
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const profile = await learnerProfileService.updateProfile(
        req.user._id,
        req.body,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Learner profile updated successfully",
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateFromAssessment(req, res, next) {
    try {
      const profile = await learnerProfileService.generateFromAssessment(
        req.user._id,
        req.params.attemptId,
      );
      return successResponse(res, {
        statusCode: 200,
        message:
          "Learner profile successfully generated from assessment attempt",
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfileByUserId(req, res, next) {
    try {
      const result = await learnerProfileService.getProfileForAdmin(
        req.params.userId,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Admin learner profile retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LearnerProfileController();
