const mongoose = require("mongoose");
const { CurriculumModule } = require("../models");

class CurriculumDependencyService {
  /**
   * Validates that all prerequisite IDs exist and do not self-reference
   * @param {string|ObjectId} targetModuleId - ID of module being created/updated
   * @param {Array<string|ObjectId>} prerequisiteIds - List of prerequisite IDs
   */
  async validatePrerequisites(targetModuleId, prerequisiteIds = []) {
    if (!Array.isArray(prerequisiteIds) || prerequisiteIds.length === 0) {
      return true;
    }

    const targetStr = targetModuleId ? targetModuleId.toString() : null;

    // Check for self-reference
    for (const preId of prerequisiteIds) {
      const preStr = preId.toString();
      if (targetStr && preStr === targetStr) {
        const error = new Error(
          "A curriculum module cannot list itself as a prerequisite",
        );
        error.statusCode = 400;
        error.errorCode = "CURRICULUM_INVALID_PREREQUISITE";
        throw error;
      }
    }

    // Verify all prerequisites exist in database
    const uniqueIds = Array.from(
      new Set(prerequisiteIds.map((id) => id.toString())),
    );
    const existingModules = await CurriculumModule.find({
      _id: { $in: uniqueIds },
    })
      .select("_id title isActive")
      .lean();

    if (existingModules.length !== uniqueIds.length) {
      const foundIds = new Set(existingModules.map((m) => m._id.toString()));
      const missing = uniqueIds.filter((id) => !foundIds.has(id));
      const error = new Error(
        `Prerequisite module(s) not found: ${missing.join(", ")}`,
      );
      error.statusCode = 400;
      error.errorCode = "CURRICULUM_INVALID_PREREQUISITE";
      throw error;
    }

    return true;
  }

  /**
   * Graph traversal detecting direct or transitive circular dependencies
   * @param {string|ObjectId} targetModuleId - ID of module receiving prerequisites
   * @param {Array<string|ObjectId>} newPrerequisiteIds - Proposed prerequisites
   */
  async detectCircularDependency(targetModuleId, newPrerequisiteIds = []) {
    if (
      !targetModuleId ||
      !Array.isArray(newPrerequisiteIds) ||
      newPrerequisiteIds.length === 0
    ) {
      return false;
    }

    const targetStr = targetModuleId.toString();
    const queue = [...newPrerequisiteIds.map((id) => id.toString())];
    const visited = new Set();

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (currentId === targetStr) {
        const error = new Error(
          "Circular dependency detected in curriculum prerequisites. A module cannot depend on itself directly or transitively.",
        );
        error.statusCode = 400;
        error.errorCode = "CURRICULUM_CIRCULAR_DEPENDENCY";
        throw error;
      }

      if (!visited.has(currentId)) {
        visited.add(currentId);
        const moduleDoc = await CurriculumModule.findById(currentId)
          .select("prerequisites")
          .lean();

        if (moduleDoc && Array.isArray(moduleDoc.prerequisites)) {
          for (const nextPreId of moduleDoc.prerequisites) {
            queue.push(nextPreId.toString());
          }
        }
      }
    }

    return false;
  }

  /**
   * Identifies any active modules that have targetModuleId as a prerequisite
   * @param {string|ObjectId} moduleId - ID of module to check
   */
  async checkDependentModules(moduleId) {
    return await CurriculumModule.find({
      prerequisites: moduleId,
      isActive: true,
    })
      .select("_id title category difficulty")
      .lean();
  }
}

module.exports = new CurriculumDependencyService();
