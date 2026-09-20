const { Assessment, AssessmentAttempt, Question } = require("../models");
const questionService = require("./questionService");

class AssessmentService {
  /**
   * Creates a new assessment (Admin)
   */
  async createAssessment(data, adminId) {
    const assessment = await Assessment.create({
      ...data,
      createdBy: adminId,
    });
    return assessment;
  }

  /**
   * Retrieves assessments list (filtered & sanitized for students)
   */
  async getAssessments({ isAdmin = false } = {}) {
    const filter = isAdmin ? {} : { isActive: true };
    const query = Assessment.find(filter).sort({ createdAt: -1 });

    if (!isAdmin) {
      query.select("-scoringConfig -createdBy");
    }

    return await query.lean();
  }

  /**
   * Retrieves assessment by ID, along with its questions
   */
  async getAssessmentById(assessmentId, { isAdmin = false } = {}) {
    const assessment = await Assessment.findById(assessmentId).lean();

    if (!assessment) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    if (!isAdmin && !assessment.isActive) {
      const error = new Error("This assessment is currently inactive");
      error.statusCode = 400;
      error.errorCode = "ASSESSMENT_INACTIVE";
      throw error;
    }

    // Retrieve and sanitize questions
    const questions = await questionService.getQuestionsByAssessment(
      assessmentId,
      { isAdmin },
    );

    // Sanitize assessment details if student
    let sanitizedAssessment = assessment;
    if (!isAdmin) {
      sanitizedAssessment = {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        instructions: assessment.instructions,
        dimensions: assessment.dimensions,
        questionCount: questions.length || assessment.questionCount,
        estimatedDuration: assessment.estimatedDuration,
        version: assessment.version,
      };
    }

    return {
      ...sanitizedAssessment,
      questions,
    };
  }

  /**
   * Updates assessment details (Admin)
   */
  async updateAssessment(assessmentId, updateData) {
    // Prevent overriding createdBy from request payload
    delete updateData.createdBy;

    const assessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!assessment) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    return assessment;
  }

  /**
   * Toggles active status of an assessment (Admin)
   */
  async toggleStatus(assessmentId, isActive) {
    const assessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      { isActive: Boolean(isActive) },
      { new: true },
    );

    if (!assessment) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    return assessment;
  }

  /**
   * Safely deletes assessment or deactivates if attempts already exist
   */
  async deleteAssessment(assessmentId) {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    // Check if historical student attempts exist
    const attemptCount = await AssessmentAttempt.countDocuments({
      assessment: assessmentId,
    });

    if (attemptCount > 0) {
      // Soft-delete to preserve learner attempt integrity
      assessment.isActive = false;
      await assessment.save();
      return {
        message:
          "Assessment has historical attempts. It has been deactivated rather than deleted to preserve records.",
        softDeleted: true,
        deactivated: true,
        id: assessmentId,
      };
    }

    // Hard delete assessment and its associated questions
    await Promise.all([
      Assessment.findByIdAndDelete(assessmentId),
      Question.deleteMany({ assessment: assessmentId }),
    ]);

    return {
      message: "Assessment and associated questions deleted successfully",
      deleted: true,
      id: assessmentId,
    };
  }
}

module.exports = new AssessmentService();
