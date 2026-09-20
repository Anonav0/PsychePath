const { LearnerProfile, User } = require("../models");
const profileGenerationService = require("./profileGenerationService");

class LearnerProfileService {
  /**
   * Retrieves learner profile for a specific student, including calculated completeness
   */
  async getProfileByUserId(userId) {
    const profile = await LearnerProfile.findOne({ user: userId })
      .populate(
        "lastAssessmentAttempt",
        "status submittedAt scores resultSummary",
      )
      .lean();

    if (!profile) {
      const error = new Error("Learner profile not found for this user");
      error.statusCode = 404;
      error.errorCode = "PROFILE_NOT_FOUND";
      throw error;
    }

    const completeness =
      profileGenerationService.calculateCompleteness(profile);

    return {
      ...profile,
      profileCompleteness: completeness,
    };
  }

  /**
   * Updates or initializes user-managed profile attributes
   */
  async updateProfile(userId, updateData) {
    // Whitelist only user-managed fields
    const safeUpdates = {};
    const allowedFields = [
      "educationLevel",
      "experienceLevel",
      "currentSkills",
      "learningGoals",
      "interests",
      "learningPreferences",
      "preferredDifficulty",
      "weeklyLearningHours",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        safeUpdates[field] = updateData[field];
      }
    });

    const profile = await LearnerProfile.findOneAndUpdate(
      { user: userId },
      { $set: safeUpdates },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    const completeness =
      profileGenerationService.calculateCompleteness(profile);

    return {
      ...profile,
      profileCompleteness: completeness,
    };
  }

  /**
   * Transforms completed assessment attempt into profile psychometrics and increments version
   */
  async generateFromAssessment(userId, attemptId) {
    // 1. Generate assessment-derived attributes (enforces ownership & COMPLETED status)
    const derivedData =
      await profileGenerationService.generateProfileFromAttempt(
        userId,
        attemptId,
      );

    // 2. Retrieve existing profile or initialize a new one
    let profile = await LearnerProfile.findOne({ user: userId });

    if (!profile) {
      profile = new LearnerProfile({
        user: userId,
        profileVersion: 1,
      });
    } else {
      // Increment profile version on update
      profile.profileVersion = (profile.profileVersion || 1) + 1;
    }

    // 3. Update assessment-derived fields (preserving user-managed data)
    profile.assessmentDimensions = derivedData.assessmentDimensions;
    profile.strengths = derivedData.strengths;
    profile.improvementAreas = derivedData.improvementAreas;
    profile.lastAssessmentAttempt = derivedData.lastAssessmentAttempt;

    await profile.save();

    // 4. Return populated profile with completeness
    const populated = await LearnerProfile.findById(profile._id)
      .populate(
        "lastAssessmentAttempt",
        "status submittedAt scores resultSummary",
      )
      .lean();

    const completeness =
      profileGenerationService.calculateCompleteness(populated);

    return {
      ...populated,
      profileCompleteness: completeness,
    };
  }

  /**
   * Administrative profile access
   */
  async getProfileForAdmin(targetUserId) {
    const user = await User.findById(targetUserId).select(
      "firstName lastName email role isActive",
    );
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      error.errorCode = "USER_NOT_FOUND";
      throw error;
    }

    const profile = await LearnerProfile.findOne({ user: targetUserId })
      .populate("lastAssessmentAttempt", "status submittedAt scores")
      .lean();

    if (!profile) {
      return {
        user,
        profile: null,
        message: "No learner profile has been created for this user yet",
      };
    }

    const completeness =
      profileGenerationService.calculateCompleteness(profile);

    return {
      user,
      profile: {
        ...profile,
        profileCompleteness: completeness,
      },
    };
  }
}

module.exports = new LearnerProfileService();
