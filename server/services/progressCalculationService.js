/**
 * Service responsible for deterministic, server-authoritative progress calculations
 */

/**
 * Calculates overall learning path progress metrics based on progress records
 *
 * Primary Metric Rule:
 * overallProgress = (completedModules / actionableModules) * 100
 * where actionableModules = totalModules - skippedModules
 *
 * @param {Object} learningPath - The LearningPath document
 * @param {Array<Object>} progressRecords - Array of Progress documents for this path
 * @returns {Object} Calculated summary metrics
 */
const calculatePathSummary = (learningPath, progressRecords = []) => {
  const pathModules = learningPath.modules || [];
  const totalModules = pathModules.length;

  // Build a fast lookup map: moduleId (as string) -> Progress record
  const progressMap = new Map();
  for (const record of progressRecords) {
    const modId = (record.module?._id || record.module)?.toString();
    if (modId) {
      progressMap.set(modId, record);
    }
  }

  let completedModules = 0;
  let inProgressModules = 0;
  let notStartedModules = 0;
  let skippedModules = 0;

  for (const item of pathModules) {
    const modId = (item.module?._id || item.module)?.toString();
    const progress = progressMap.get(modId);
    const status = progress ? progress.status : item.status || "NOT_STARTED";

    switch (status) {
      case "COMPLETED":
        completedModules++;
        break;
      case "IN_PROGRESS":
        inProgressModules++;
        break;
      case "SKIPPED":
        skippedModules++;
        break;
      case "NOT_STARTED":
      default:
        notStartedModules++;
        break;
    }
  }

  // Actionable modules exclude SKIPPED modules from the denominator
  const actionableModules = Math.max(0, totalModules - skippedModules);

  // Overall progress percentage (0 - 100)
  const overallProgress =
    actionableModules === 0
      ? 0
      : Math.min(100, Math.round((completedModules / actionableModules) * 100));

  const isComplete =
    actionableModules > 0 && completedModules === actionableModules;

  return {
    learningPathId: learningPath._id,
    totalModules,
    actionableModules,
    completedModules,
    inProgressModules,
    notStartedModules,
    skippedModules,
    overallProgress,
    isComplete,
  };
};

/**
 * Merges learning path module catalog details with active progress records
 *
 * @param {Object} learningPath - Populated LearningPath document
 * @param {Array<Object>} progressRecords - Array of Progress documents for this path
 * @returns {Object} Enriched view with module progress and overall path summary
 */
const mergePathWithProgress = (learningPath, progressRecords = []) => {
  const summary = calculatePathSummary(learningPath, progressRecords);

  const progressMap = new Map();
  for (const record of progressRecords) {
    const modId = (record.module?._id || record.module)?.toString();
    if (modId) {
      progressMap.set(modId, record);
    }
  }

  const enrichedModules = (learningPath.modules || []).map((item) => {
    const modDoc = item.module || {};
    const modId = (modDoc._id || modDoc).toString();
    const progress = progressMap.get(modId);

    return {
      moduleId: modId,
      title: modDoc.title || "",
      category: modDoc.category || "",
      difficulty: modDoc.difficulty || "",
      estimatedDuration: modDoc.estimatedDuration || 0,
      skills: modDoc.skills || [],
      order: item.order,
      priority: item.priority || 1,
      reason: item.reason || "",
      status: progress ? progress.status : item.status || "NOT_STARTED",
      percentage: progress ? progress.percentage : 0,
      startedAt: progress?.startedAt || null,
      completedAt: progress?.completedAt || null,
      lastAccessedAt: progress?.lastAccessedAt || null,
    };
  });

  return {
    learningPathId: learningPath._id,
    title: learningPath.title,
    version: learningPath.version,
    status: learningPath.status,
    generatedBy: learningPath.generatedBy,
    estimatedDuration: learningPath.estimatedDuration,
    summary: learningPath.summary,
    focusAreas: learningPath.focusAreas,
    learningStrategy: learningPath.learningStrategy,
    modules: enrichedModules,
    pathSummary: summary,
  };
};

module.exports = {
  calculatePathSummary,
  mergePathWithProgress,
};
