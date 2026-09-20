const ProgressHistory = require("../models/ProgressHistory");
const LearningPath = require("../models/LearningPath");

/**
 * Service managing the immutable progress history audit trail
 */

/**
 * Records a state transition or progress update event
 *
 * @param {Object} eventData
 * @param {ObjectId} eventData.user - The user ID
 * @param {ObjectId} eventData.learningPath - The LearningPath ID
 * @param {ObjectId} eventData.module - The CurriculumModule ID
 * @param {String} eventData.action - STARTED | PROGRESS_UPDATED | COMPLETED | SKIPPED
 * @param {String} eventData.previousStatus
 * @param {String} eventData.newStatus
 * @param {Number} eventData.previousPercentage
 * @param {Number} eventData.newPercentage
 * @param {Object} [eventData.metadata] - Optional context
 * @returns {Promise<Object>} Created ProgressHistory record
 */
const recordEvent = async ({
  user,
  learningPath,
  module,
  action,
  previousStatus = "NOT_STARTED",
  newStatus,
  previousPercentage = 0,
  newPercentage,
  metadata = {},
}) => {
  return await ProgressHistory.create({
    user,
    learningPath,
    module,
    action,
    previousStatus,
    newStatus,
    previousPercentage,
    newPercentage,
    timestamp: new Date(),
    metadata,
  });
};

/**
 * Retrieves paginated progress history for a learning path
 *
 * @param {ObjectId|String} userId - Authenticated user ID
 * @param {ObjectId|String} learningPathId - LearningPath ID
 * @param {Object} options - Query options (moduleId, page, limit)
 * @returns {Promise<Object>} Paginated history records
 */
const getHistory = async (userId, learningPathId, options = {}) => {
  const path = await LearningPath.findById(learningPathId);
  if (!path) {
    const error = new Error("Learning path not found");
    error.statusCode = 404;
    error.errorCode = "LEARNING_PATH_NOT_FOUND";
    throw error;
  }

  if (path.user.toString() !== userId.toString()) {
    const error = new Error("You do not have access to this learning path");
    error.statusCode = 403;
    error.errorCode = "LEARNING_PATH_NOT_OWNED";
    throw error;
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {
    user: userId,
    learningPath: learningPathId,
  };

  if (options.moduleId) {
    filter.module = options.moduleId;
  }

  const [total, records] = await Promise.all([
    ProgressHistory.countDocuments(filter),
    ProgressHistory.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("module", "title category difficulty estimatedDuration")
      .lean(),
  ]);

  return {
    history: records.map((record) => ({
      id: record._id,
      action: record.action,
      moduleId: record.module?._id || record.module,
      moduleTitle: record.module?.title || "",
      previousStatus: record.previousStatus,
      newStatus: record.newStatus,
      previousPercentage: record.previousPercentage,
      newPercentage: record.newPercentage,
      timestamp: record.timestamp,
      metadata: record.metadata,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

module.exports = {
  recordEvent,
  getHistory,
};
