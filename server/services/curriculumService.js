const { CurriculumModule } = require("../models");
const curriculumDependencyService = require("./curriculumDependencyService");

class CurriculumService {
  /**
   * Creates a new curriculum module with prerequisite integrity
   */
  async createModule(moduleData, adminUserId) {
    // Check duplicate title within category
    const existing = await CurriculumModule.findOne({
      title: { $regex: new RegExp(`^${moduleData.title.trim()}$`, "i") },
      category: { $regex: new RegExp(`^${moduleData.category.trim()}$`, "i") },
    });

    if (existing) {
      const error = new Error(
        `A module with title "${moduleData.title}" already exists in category "${moduleData.category}"`,
      );
      error.statusCode = 409;
      error.errorCode = "CURRICULUM_DUPLICATE_MODULE";
      throw error;
    }

    // Validate prerequisites if specified
    if (moduleData.prerequisites && moduleData.prerequisites.length > 0) {
      await curriculumDependencyService.validatePrerequisites(
        null,
        moduleData.prerequisites,
      );
    }

    const newModule = await CurriculumModule.create({
      ...moduleData,
      createdBy: adminUserId,
    });

    return await CurriculumModule.findById(newModule._id)
      .populate("prerequisites", "title category difficulty estimatedDuration")
      .lean();
  }

  /**
   * Retrieves paginated and filtered curriculum modules
   */
  async getModules(queryParams = {}, user = null) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(queryParams.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    const filter = {};

    // Enforce active-only for students / guests
    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin) {
      filter.isActive = true;
    } else if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === "true";
    }

    // Category filter
    if (queryParams.category && queryParams.category.trim().length > 0) {
      filter.category = new RegExp(`^${queryParams.category.trim()}$`, "i");
    }

    // Difficulty filter
    if (queryParams.difficulty && queryParams.difficulty.trim().length > 0) {
      filter.difficulty = queryParams.difficulty.trim().toUpperCase();
    }

    // Skill name filter
    if (queryParams.skill && queryParams.skill.trim().length > 0) {
      filter["skills.name"] = new RegExp(queryParams.skill.trim(), "i");
    }

    // Search query across title and description
    if (queryParams.search && queryParams.search.trim().length > 0) {
      const searchRegex = new RegExp(queryParams.search.trim(), "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Sorting
    let sortObj = { order: 1, createdAt: 1 };
    if (queryParams.sort) {
      const sortField = queryParams.sort.trim();
      const isDesc = sortField.startsWith("-");
      let rawField = isDesc ? sortField.substring(1) : sortField;
      if (rawField === "estimatedHours") rawField = "estimatedDuration";
      sortObj = { [rawField]: isDesc ? -1 : 1 };
    } else if (queryParams.sortBy) {
      let rawField = queryParams.sortBy.trim();
      if (rawField === "estimatedHours") rawField = "estimatedDuration";
      const order =
        (queryParams.sortOrder || "asc").toLowerCase() === "desc" ||
        queryParams.sortOrder === "-1"
          ? -1
          : 1;
      sortObj = { [rawField]: order };
    }

    const [items, total] = await Promise.all([
      CurriculumModule.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate(
          "prerequisites",
          "title category difficulty estimatedDuration",
        )
        .lean(),
      CurriculumModule.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single module with populated prerequisites
   */
  async getModuleById(moduleId, user = null) {
    const moduleDoc = await CurriculumModule.findById(moduleId)
      .populate("prerequisites", "title category difficulty estimatedDuration")
      .lean();

    if (!moduleDoc) {
      const error = new Error("Curriculum module not found");
      error.statusCode = 404;
      error.errorCode = "CURRICULUM_MODULE_NOT_FOUND";
      throw error;
    }

    const isAdmin = user?.role === "ADMIN";
    if (!moduleDoc.isActive && !isAdmin) {
      const error = new Error(
        "Curriculum module not found or is currently inactive",
      );
      error.statusCode = 404;
      error.errorCode = "CURRICULUM_MODULE_NOT_FOUND";
      throw error;
    }

    return moduleDoc;
  }

  /**
   * Updates an existing curriculum module, validating prerequisite cycle safety
   */
  async updateModule(moduleId, updateData) {
    const existing = await CurriculumModule.findById(moduleId);
    if (!existing) {
      const error = new Error("Curriculum module not found");
      error.statusCode = 404;
      error.errorCode = "CURRICULUM_MODULE_NOT_FOUND";
      throw error;
    }

    // If prerequisites are being updated, validate existence and cycle prevention
    if (updateData.prerequisites !== undefined) {
      await curriculumDependencyService.validatePrerequisites(
        moduleId,
        updateData.prerequisites,
      );
      await curriculumDependencyService.detectCircularDependency(
        moduleId,
        updateData.prerequisites,
      );
    }

    // Prevent direct override of system fields
    delete updateData.createdBy;
    delete updateData.createdAt;

    const updated = await CurriculumModule.findByIdAndUpdate(
      moduleId,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate("prerequisites", "title category difficulty estimatedDuration")
      .lean();

    return updated;
  }

  /**
   * Toggles active status of a module
   */
  async toggleStatus(moduleId, isActive) {
    const moduleDoc = await CurriculumModule.findByIdAndUpdate(
      moduleId,
      { isActive: Boolean(isActive) },
      { new: true },
    );

    if (!moduleDoc) {
      const error = new Error("Curriculum module not found");
      error.statusCode = 404;
      error.errorCode = "CURRICULUM_MODULE_NOT_FOUND";
      throw error;
    }

    return moduleDoc;
  }

  /**
   * Safely deletes module or soft-deactivates if dependencies exist
   */
  async deleteModule(moduleId) {
    const moduleDoc = await CurriculumModule.findById(moduleId);
    if (!moduleDoc) {
      const error = new Error("Curriculum module not found");
      error.statusCode = 404;
      error.errorCode = "CURRICULUM_MODULE_NOT_FOUND";
      throw error;
    }

    // Check for dependent active modules
    const dependents =
      await curriculumDependencyService.checkDependentModules(moduleId);

    if (dependents.length > 0) {
      // Soft-deactivate to prevent breaking prerequisite graph
      moduleDoc.isActive = false;
      await moduleDoc.save();
      return {
        message: `Module has ${dependents.length} active dependent module(s). It has been deactivated to preserve curriculum dependency integrity.`,
        softDeleted: true,
        deactivated: true,
        dependentModules: dependents.map((d) => ({
          id: d._id,
          title: d.title,
        })),
        id: moduleId,
      };
    }

    await CurriculumModule.findByIdAndDelete(moduleId);
    return {
      message: "Curriculum module deleted successfully",
      deleted: true,
      permanent: true,
      id: moduleId,
    };
  }
}

module.exports = new CurriculumService();
