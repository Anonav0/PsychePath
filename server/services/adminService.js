const mongoose = require("mongoose");
const {
  User,
  Assessment,
  CurriculumModule,
  AssessmentAttempt,
  LearnerProfile,
  LearningPath,
  Progress,
} = require("../models");
const progressCalculationService = require("./progressCalculationService");

class AdminService {
  /**
   * Aggregate high-level platform statistics
   */
  async getAdminStats() {
    const [
      totalLearners,
      activeLearners,
      totalAssessments,
      totalCurriculumModules,
      recentAttempts,
      recentLearners,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "STUDENT", isActive: true }),
      Assessment.countDocuments(),
      CurriculumModule.countDocuments(),
      AssessmentAttempt.find()
        .populate("user", "firstName lastName email")
        .populate("assessment", "title type")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      User.find({ role: "STUDENT" })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("-password")
        .lean(),
    ]);

    return {
      totalLearners,
      activeLearners,
      totalAssessments,
      totalCurriculumModules,
      recentAttempts,
      recentLearners,
    };
  }

  /**
   * Search, filter, and paginate learners
   */
  async getLearners({
    search = "",
    status = "ALL",
    page = 1,
    limit = 10,
  } = {}) {
    const filter = { role: "STUDENT" };

    if (status === "ACTIVE") {
      filter.isActive = true;
    } else if (status === "INACTIVE") {
      filter.isActive = false;
    }

    if (search && search.trim() !== "") {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(sanitized, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, learners] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-password")
        .lean(),
    ]);

    // Annotate learners with attempt counts and active path existence
    const learnerIds = learners.map((l) => l._id);
    const [attemptsCounts, completedCounts, activePaths] = await Promise.all([
      AssessmentAttempt.aggregate([
        { $match: { user: { $in: learnerIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      AssessmentAttempt.aggregate([
        { $match: { user: { $in: learnerIds }, status: "COMPLETED" } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      LearningPath.find({ user: { $in: learnerIds }, status: "ACTIVE" })
        .select("user")
        .lean(),
    ]);

    const attemptsMap = new Map(
      attemptsCounts.map((a) => [a._id.toString(), a.count]),
    );
    const completedMap = new Map(
      completedCounts.map((a) => [a._id.toString(), a.count]),
    );
    const activePathSet = new Set(activePaths.map((p) => p.user.toString()));

    const enrichedLearners = learners.map((l) => {
      const idStr = l._id.toString();
      return {
        ...l,
        totalAttempts: attemptsMap.get(idStr) || 0,
        completedAttempts: completedMap.get(idStr) || 0,
        hasActiveLearningPath: activePathSet.has(idStr),
      };
    });

    return {
      learners: enrichedLearners,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Retrieve full learner details (profile, attempts, active path, and progress summary)
   */
  async getLearnerDetails(targetUserId) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const error = new Error("Invalid learner ID format");
      error.statusCode = 400;
      error.errorCode = "INVALID_LEARNER_ID";
      throw error;
    }

    const user = await User.findById(targetUserId).select("-password").lean();
    if (!user) {
      const error = new Error("Learner not found");
      error.statusCode = 404;
      error.errorCode = "LEARNER_NOT_FOUND";
      throw error;
    }

    const [profile, attempts, activePath] = await Promise.all([
      LearnerProfile.findOne({ user: targetUserId }).lean(),
      AssessmentAttempt.find({ user: targetUserId })
        .populate("assessment", "title type dimensions estimatedDuration")
        .sort({ createdAt: -1 })
        .lean(),
      LearningPath.findOne({ user: targetUserId, status: "ACTIVE" })
        .populate(
          "modules.module",
          "title category difficulty estimatedDuration skills",
        )
        .lean(),
    ]);

    let progressSummary = null;
    let pathProgressRecords = [];

    if (activePath) {
      pathProgressRecords = await Progress.find({
        user: targetUserId,
        learningPath: activePath._id,
      })
        .populate("module", "title category")
        .lean();

      progressSummary = progressCalculationService.calculatePathSummary(
        activePath,
        pathProgressRecords,
      );
    }

    return {
      user,
      profile: profile || null,
      attempts: attempts || [],
      learningPath: activePath || null,
      progressSummary,
    };
  }

  /**
   * Toggle learner account active status
   */
  async toggleLearnerStatus(targetUserId, isActive) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const error = new Error("Invalid learner ID format");
      error.statusCode = 400;
      error.errorCode = "INVALID_LEARNER_ID";
      throw error;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      const error = new Error("Learner not found");
      error.statusCode = 404;
      error.errorCode = "LEARNER_NOT_FOUND";
      throw error;
    }

    if (user.role === "ADMIN") {
      const error = new Error(
        "Cannot modify administrator account status through learner management",
      );
      error.statusCode = 400;
      error.errorCode = "CANNOT_MODIFY_ADMIN";
      throw error;
    }

    user.isActive = Boolean(isActive);
    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;
    return sanitized;
  }
}

module.exports = new AdminService();
