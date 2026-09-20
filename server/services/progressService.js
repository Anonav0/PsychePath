const mongoose = require("mongoose");
const { LearningPath, Progress, CurriculumModule } = require("../models");
const progressCalculationService = require("./progressCalculationService");
const progressHistoryService = require("./progressHistoryService");

/**
 * Core service orchestrating module progress transitions, timestamps,
 * regression protection, and path synchronization.
 */

/**
 * Internal helper to load and validate learning path ownership and module membership
 */
const _verifyPathAndModule = async (
  userId,
  learningPathId,
  moduleId,
  requireActive = true,
) => {
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

  if (requireActive && path.status === "ARCHIVED") {
    const error = new Error(
      "Cannot modify progress on an archived learning path version",
    );
    error.statusCode = 400;
    error.errorCode = "PATH_ARCHIVED";
    throw error;
  }

  if (moduleId) {
    const isMember = path.modules.some(
      (m) => (m.module?._id || m.module).toString() === moduleId.toString(),
    );

    if (!isMember) {
      const error = new Error(
        "Requested module is not part of this learning path",
      );
      error.statusCode = 400;
      error.errorCode = "MODULE_NOT_IN_LEARNING_PATH";
      throw error;
    }
  }

  return path;
};

/**
 * Starts a module in the learner's path
 */
const startModule = async (userId, learningPathId, moduleId) => {
  const path = await _verifyPathAndModule(
    userId,
    learningPathId,
    moduleId,
    true,
  );

  let progress = await Progress.findOne({
    user: userId,
    learningPath: learningPathId,
    module: moduleId,
  });

  const now = new Date();
  let statusChanged = false;
  let previousStatus = "NOT_STARTED";
  let previousPercentage = 0;

  if (!progress) {
    progress = new Progress({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      status: "IN_PROGRESS",
      percentage: 0,
      startedAt: now,
      completedAt: null,
      lastAccessedAt: now,
    });
    statusChanged = true;
  } else {
    previousStatus = progress.status;
    previousPercentage = progress.percentage;
    progress.lastAccessedAt = now;

    if (progress.status === "NOT_STARTED" || progress.status === "SKIPPED") {
      progress.status = "IN_PROGRESS";
      if (!progress.startedAt) {
        progress.startedAt = now;
      }
      statusChanged = true;
    }
  }

  await progress.save();

  // Audit state transition if new or changed
  if (statusChanged) {
    await progressHistoryService.recordEvent({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      action: "STARTED",
      previousStatus,
      newStatus: "IN_PROGRESS",
      previousPercentage,
      newPercentage: progress.percentage,
    });

    // Synchronize module status in LearningPath document
    await LearningPath.updateOne(
      { _id: learningPathId, "modules.module": moduleId },
      { $set: { "modules.$.status": "IN_PROGRESS" } },
    );
  }

  // Load all progress records for path summary
  const allRecords = await Progress.find({
    user: userId,
    learningPath: learningPathId,
  });
  const summary = progressCalculationService.calculatePathSummary(
    path,
    allRecords,
  );

  return {
    progress: {
      id: progress._id,
      moduleId: progress.module,
      status: progress.status,
      percentage: progress.percentage,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
    },
    summary,
  };
};

/**
 * Updates progress percentage for a module with regression protection
 */
const updateProgress = async (userId, learningPathId, moduleId, percentage) => {
  const path = await _verifyPathAndModule(
    userId,
    learningPathId,
    moduleId,
    true,
  );

  let progress = await Progress.findOne({
    user: userId,
    learningPath: learningPathId,
    module: moduleId,
  });

  const now = new Date();
  let previousStatus = "NOT_STARTED";
  let previousPercentage = 0;

  if (!progress) {
    const initialStatus = percentage === 100 ? "COMPLETED" : "IN_PROGRESS";
    progress = new Progress({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      status: initialStatus,
      percentage,
      startedAt: now,
      completedAt: percentage === 100 ? now : null,
      lastAccessedAt: now,
    });
  } else {
    previousStatus = progress.status;
    previousPercentage = progress.percentage;

    // Enforce monotonic progress policy: reject accidental regression
    if (percentage < progress.percentage) {
      const error = new Error(
        `Cannot regress progress from ${progress.percentage}% to ${percentage}%`,
      );
      error.statusCode = 400;
      error.errorCode = "PROGRESS_REGRESSION";
      throw error;
    }

    if (progress.status === "COMPLETED" && percentage < 100) {
      const error = new Error(
        "Cannot reduce progress percentage on an already completed module",
      );
      error.statusCode = 400;
      error.errorCode = "PROGRESS_ALREADY_COMPLETED";
      throw error;
    }

    progress.percentage = percentage;
    progress.lastAccessedAt = now;
    if (!progress.startedAt) {
      progress.startedAt = now;
    }

    if (percentage === 100) {
      progress.status = "COMPLETED";
      if (!progress.completedAt) {
        progress.completedAt = now;
      }
    } else if (progress.status !== "COMPLETED") {
      progress.status = "IN_PROGRESS";
    }
  }

  await progress.save();

  // Audit event if percentage or status changed
  if (percentage !== previousPercentage || progress.status !== previousStatus) {
    const action =
      progress.status === "COMPLETED" && previousStatus !== "COMPLETED"
        ? "COMPLETED"
        : "PROGRESS_UPDATED";

    await progressHistoryService.recordEvent({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      action,
      previousStatus,
      newStatus: progress.status,
      previousPercentage,
      newPercentage: progress.percentage,
    });

    // Synchronize module status in LearningPath document
    await LearningPath.updateOne(
      { _id: learningPathId, "modules.module": moduleId },
      { $set: { "modules.$.status": progress.status } },
    );
  }

  // Load all progress records for path summary
  const allRecords = await Progress.find({
    user: userId,
    learningPath: learningPathId,
  });
  const summary = progressCalculationService.calculatePathSummary(
    path,
    allRecords,
  );

  // If path is complete, sync LearningPath status
  if (summary.isComplete && path.status !== "COMPLETED") {
    await LearningPath.findByIdAndUpdate(learningPathId, {
      status: "COMPLETED",
    });
  }

  return {
    progress: {
      id: progress._id,
      moduleId: progress.module,
      status: progress.status,
      percentage: progress.percentage,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
    },
    summary,
  };
};

/**
 * Marks a module as completed (sets percentage to 100 and status to COMPLETED)
 */
const completeModule = async (userId, learningPathId, moduleId) => {
  const path = await _verifyPathAndModule(
    userId,
    learningPathId,
    moduleId,
    true,
  );

  let progress = await Progress.findOne({
    user: userId,
    learningPath: learningPathId,
    module: moduleId,
  });

  const now = new Date();
  let previousStatus = "NOT_STARTED";
  let previousPercentage = 0;
  let newlyCompleted = false;

  if (!progress) {
    progress = new Progress({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      status: "COMPLETED",
      percentage: 100,
      startedAt: now,
      completedAt: now,
      lastAccessedAt: now,
    });
    newlyCompleted = true;
  } else {
    previousStatus = progress.status;
    previousPercentage = progress.percentage;
    progress.lastAccessedAt = now;

    if (progress.status !== "COMPLETED") {
      progress.status = "COMPLETED";
      progress.percentage = 100;
      if (!progress.startedAt) {
        progress.startedAt = now;
      }
      progress.completedAt = now;
      newlyCompleted = true;
    }
  }

  await progress.save();

  if (newlyCompleted) {
    await progressHistoryService.recordEvent({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      action: "COMPLETED",
      previousStatus,
      newStatus: "COMPLETED",
      previousPercentage,
      newPercentage: 100,
    });

    // Synchronize module status in LearningPath document
    await LearningPath.updateOne(
      { _id: learningPathId, "modules.module": moduleId },
      { $set: { "modules.$.status": "COMPLETED" } },
    );
  }

  // Load all progress records for path summary
  const allRecords = await Progress.find({
    user: userId,
    learningPath: learningPathId,
  });
  const summary = progressCalculationService.calculatePathSummary(
    path,
    allRecords,
  );

  if (summary.isComplete && path.status !== "COMPLETED") {
    await LearningPath.findByIdAndUpdate(learningPathId, {
      status: "COMPLETED",
    });
  }

  return {
    progress: {
      id: progress._id,
      moduleId: progress.module,
      status: progress.status,
      percentage: progress.percentage,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
    },
    summary,
  };
};

/**
 * Skips a module in the learning path (sets status to SKIPPED, percentage to 0)
 */
const skipModule = async (userId, learningPathId, moduleId) => {
  const path = await _verifyPathAndModule(
    userId,
    learningPathId,
    moduleId,
    true,
  );

  let progress = await Progress.findOne({
    user: userId,
    learningPath: learningPathId,
    module: moduleId,
  });

  const now = new Date();
  let previousStatus = "NOT_STARTED";
  let previousPercentage = 0;

  if (progress && progress.status === "COMPLETED") {
    const error = new Error(
      "Cannot skip a module that has already been completed",
    );
    error.statusCode = 400;
    error.errorCode = "INVALID_PROGRESS_TRANSITION";
    throw error;
  }

  if (!progress) {
    progress = new Progress({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      status: "SKIPPED",
      percentage: 0,
      startedAt: null,
      completedAt: null,
      lastAccessedAt: now,
    });
  } else {
    previousStatus = progress.status;
    previousPercentage = progress.percentage;
    progress.status = "SKIPPED";
    progress.percentage = 0;
    progress.lastAccessedAt = now;
  }

  await progress.save();

  if (previousStatus !== "SKIPPED") {
    await progressHistoryService.recordEvent({
      user: userId,
      learningPath: learningPathId,
      module: moduleId,
      action: "SKIPPED",
      previousStatus,
      newStatus: "SKIPPED",
      previousPercentage,
      newPercentage: 0,
    });

    await LearningPath.updateOne(
      { _id: learningPathId, "modules.module": moduleId },
      { $set: { "modules.$.status": "SKIPPED" } },
    );
  }

  const allRecords = await Progress.find({
    user: userId,
    learningPath: learningPathId,
  });
  const summary = progressCalculationService.calculatePathSummary(
    path,
    allRecords,
  );

  return {
    progress: {
      id: progress._id,
      moduleId: progress.module,
      status: progress.status,
      percentage: progress.percentage,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
    },
    summary,
  };
};

/**
 * Retrieves full progress and module details for the user's active learning path
 */
const getCurrentPathProgress = async (userId) => {
  const path = await LearningPath.findOne({
    user: userId,
    status: { $in: ["ACTIVE", "COMPLETED"] },
  })
    .sort({ createdAt: -1 })
    .populate("modules.module");

  if (!path) {
    return null;
  }

  const records = await Progress.find({
    user: userId,
    learningPath: path._id,
  });

  return progressCalculationService.mergePathWithProgress(path, records);
};

/**
 * Retrieves progress and module details for any learning path owned by the user (including archived)
 */
const getPathProgress = async (userId, learningPathId) => {
  const path = await _verifyPathAndModule(
    userId,
    learningPathId,
    null,
    false, // allow archived path retrieval
  );

  await path.populate("modules.module");

  const records = await Progress.find({
    user: userId,
    learningPath: path._id,
  });

  return progressCalculationService.mergePathWithProgress(path, records);
};

/**
 * Retrieves calculated summary metrics for a learning path
 */
const getPathSummary = async (userId, learningPathId) => {
  const path = await _verifyPathAndModule(userId, learningPathId, null, false);
  const records = await Progress.find({
    user: userId,
    learningPath: path._id,
  });

  return progressCalculationService.calculatePathSummary(path, records);
};

module.exports = {
  startModule,
  updateProgress,
  completeModule,
  skipModule,
  getCurrentPathProgress,
  getPathProgress,
  getPathSummary,
};
