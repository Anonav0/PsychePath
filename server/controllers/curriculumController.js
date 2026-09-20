const mongoose = require("mongoose");
const curriculumService = require("../services/curriculumService");
const { successResponse } = require("../utils/apiResponse");

class CurriculumController {
  async createModule(req, res, next) {
    try {
      const moduleDoc = await curriculumService.createModule(
        req.body,
        req.user._id,
      );
      return successResponse(res, {
        statusCode: 201,
        message: "Curriculum module created successfully",
        data: moduleDoc,
      });
    } catch (err) {
      next(err);
    }
  }

  async getModules(req, res, next) {
    try {
      const result = await curriculumService.getModules(req.query, req.user);
      return successResponse(res, {
        statusCode: 200,
        message: "Curriculum modules retrieved successfully",
        data: {
          modules: result.items,
          pagination: result.pagination,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getModuleById(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        const err = new Error("Invalid curriculum module ID format");
        err.statusCode = 400;
        err.errorCode = "CURRICULUM_MODULE_INVALID";
        throw err;
      }
      const moduleDoc = await curriculumService.getModuleById(
        req.params.id,
        req.user,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Curriculum module retrieved successfully",
        data: moduleDoc,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateModule(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        const err = new Error("Invalid curriculum module ID format");
        err.statusCode = 400;
        err.errorCode = "CURRICULUM_MODULE_INVALID";
        throw err;
      }
      const updated = await curriculumService.updateModule(
        req.params.id,
        req.body,
      );
      return successResponse(res, {
        statusCode: 200,
        message: "Curriculum module updated successfully",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        const err = new Error("Invalid curriculum module ID format");
        err.statusCode = 400;
        err.errorCode = "CURRICULUM_MODULE_INVALID";
        throw err;
      }
      const { isActive } = req.body;
      const updated = await curriculumService.toggleStatus(
        req.params.id,
        isActive,
      );
      return successResponse(res, {
        statusCode: 200,
        message: `Curriculum module ${updated.isActive ? "activated" : "deactivated"} successfully`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteModule(req, res, next) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        const err = new Error("Invalid curriculum module ID format");
        err.statusCode = 400;
        err.errorCode = "CURRICULUM_MODULE_INVALID";
        throw err;
      }
      const result = await curriculumService.deleteModule(req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CurriculumController();
