const { AssessmentAttempt, Assessment, Question } = require("../models");
const assessmentScoringService = require("./assessmentScoringService");

class AssessmentAttemptService {
  /**
   * Starts a new assessment attempt for the student, or returns existing in-progress attempt
   */
  async startAttempt(assessmentId, userId) {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    if (!assessment.isActive) {
      const error = new Error("Cannot start attempt: Assessment is inactive");
      error.statusCode = 400;
      error.errorCode = "ASSESSMENT_INACTIVE";
      throw error;
    }

    // Check if an active attempt already exists for this student and assessment
    const existingActiveAttempt = await AssessmentAttempt.findOne({
      user: userId,
      assessment: assessmentId,
      status: "IN_PROGRESS",
    });

    if (existingActiveAttempt) {
      return {
        attempt: existingActiveAttempt,
        isExisting: true,
        message: "Resuming active assessment attempt",
      };
    }

    // Create new attempt
    const newAttempt = await AssessmentAttempt.create({
      user: userId,
      assessment: assessmentId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      answers: [],
    });

    return {
      attempt: newAttempt,
      isExisting: false,
      message: "New assessment attempt started",
    };
  }

  /**
   * Retrieves active attempt for a specific assessment
   */
  async getActiveAttempt(assessmentId, userId) {
    const attempt = await AssessmentAttempt.findOne({
      user: userId,
      assessment: assessmentId,
      status: "IN_PROGRESS",
    })
      .select("-scores -resultSummary")
      .lean();

    if (!attempt) {
      const error = new Error("No active attempt found for this assessment");
      error.statusCode = 404;
      error.errorCode = "ATTEMPT_NOT_FOUND";
      throw error;
    }

    return attempt;
  }

  /**
   * Saves or updates answers for an in-progress attempt
   */
  async saveAnswers(attemptId, userId, incomingAnswers) {
    const attempt = await AssessmentAttempt.findById(attemptId);

    if (!attempt) {
      const error = new Error("Attempt not found");
      error.statusCode = 404;
      error.errorCode = "ATTEMPT_NOT_FOUND";
      throw error;
    }

    // IDOR Protection: Enforce student ownership
    if (attempt.user.toString() !== userId.toString()) {
      const error = new Error(
        "You do not have permission to modify this attempt",
      );
      error.statusCode = 403;
      error.errorCode = "ATTEMPT_ACCESS_DENIED";
      throw error;
    }

    // Prevent modifying completed attempts
    if (attempt.status !== "IN_PROGRESS") {
      const error = new Error(
        "Cannot modify answers: Attempt has already been submitted or completed",
      );
      error.statusCode = 400;
      error.errorCode = "ATTEMPT_ALREADY_COMPLETED";
      throw error;
    }

    // Verify questions belong to this assessment
    const questionIds = incomingAnswers.map((a) => a.questionId);
    const validQuestions = await Question.find({
      _id: { $in: questionIds },
      assessment: attempt.assessment,
      isActive: true,
    });

    const validQuestionMap = new Map();
    validQuestions.forEach((q) => validQuestionMap.set(q._id.toString(), q));

    // Update existing answers or append new ones
    incomingAnswers.forEach((ans) => {
      const question = validQuestionMap.get(ans.questionId.toString());
      if (!question) {
        const error = new Error(
          `Question ${ans.questionId} does not belong to this assessment or is inactive`,
        );
        error.statusCode = 400;
        error.errorCode = "INVALID_QUESTION";
        throw error;
      }

      // Check option exists
      const optionExists = question.options.some(
        (opt) => opt.value === ans.selectedValue,
      );
      if (!optionExists) {
        const error = new Error(
          `Invalid option "${ans.selectedValue}" for question ${ans.questionId}`,
        );
        error.statusCode = 400;
        error.errorCode = "INVALID_OPTION";
        throw error;
      }

      const existingIndex = attempt.answers.findIndex(
        (a) => a.question.toString() === ans.questionId.toString(),
      );

      if (existingIndex >= 0) {
        attempt.answers[existingIndex].selectedValue = ans.selectedValue;
        attempt.answers[existingIndex].selectedOption =
          ans.selectedOption || "";
        attempt.answers[existingIndex].answeredAt = new Date();
      } else {
        attempt.answers.push({
          question: ans.questionId,
          selectedValue: ans.selectedValue,
          selectedOption: ans.selectedOption || "",
          answeredAt: new Date(),
        });
      }
    });

    await attempt.save();

    return {
      attemptId: attempt._id,
      answeredCount: attempt.answers.length,
      answers: attempt.answers,
    };
  }

  /**
   * Finalizes and submits attempt, triggering backend-authoritative scoring
   */
  async submitAttempt(attemptId, userId) {
    const attempt = await AssessmentAttempt.findById(attemptId);

    if (!attempt) {
      const error = new Error("Attempt not found");
      error.statusCode = 404;
      error.errorCode = "ATTEMPT_NOT_FOUND";
      throw error;
    }

    // IDOR Protection: Enforce student ownership
    if (attempt.user.toString() !== userId.toString()) {
      const error = new Error(
        "You do not have permission to submit this attempt",
      );
      error.statusCode = 403;
      error.errorCode = "ATTEMPT_ACCESS_DENIED";
      throw error;
    }

    if (attempt.status === "COMPLETED") {
      const error = new Error(
        "This assessment attempt has already been submitted",
      );
      error.statusCode = 400;
      error.errorCode = "ATTEMPT_ALREADY_COMPLETED";
      throw error;
    }

    // Retrieve assessment and questions
    const [assessment, questions] = await Promise.all([
      Assessment.findById(attempt.assessment),
      Question.find({ assessment: attempt.assessment, isActive: true }),
    ]);

    if (!assessment) {
      const error = new Error("Associated assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    // Execute authoritative scoring calculation
    const evaluation = assessmentScoringService.scoreAttempt({
      attempt,
      assessment,
      questions,
    });

    // Save final scores and transition status to COMPLETED
    attempt.scores = evaluation.scores;
    attempt.resultSummary = evaluation.resultSummary;
    attempt.status = "COMPLETED";
    attempt.submittedAt = new Date();

    await attempt.save();

    return {
      attemptId: attempt._id,
      assessmentId: assessment._id,
      assessmentTitle: assessment.title,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      scores: evaluation.scores,
      detailedScores: evaluation.detailedScores,
      overallScore: evaluation.overallScore,
      strongestDimensions: evaluation.strongestDimensions,
      developmentAreas: evaluation.developmentAreas,
      resultSummary: evaluation.resultSummary,
    };
  }

  /**
   * Retrieves results for a completed attempt with IDOR protection
   */
  async getAttemptResult(attemptId, user) {
    const attempt = await AssessmentAttempt.findById(attemptId).populate(
      "assessment",
      "title description type dimensions version",
    );

    if (!attempt) {
      const error = new Error("Attempt not found");
      error.statusCode = 404;
      error.errorCode = "ATTEMPT_NOT_FOUND";
      throw error;
    }

    // IDOR Protection: Only the student owner or an admin can access results
    if (
      user.role !== "ADMIN" &&
      attempt.user.toString() !== user._id.toString()
    ) {
      const error = new Error(
        "You do not have permission to view this assessment result",
      );
      error.statusCode = 403;
      error.errorCode = "ATTEMPT_ACCESS_DENIED";
      throw error;
    }

    if (attempt.status !== "COMPLETED") {
      const error = new Error(
        "Attempt is still in progress. Submit the assessment to view results.",
      );
      error.statusCode = 400;
      error.errorCode = "ATTEMPT_NOT_COMPLETED";
      throw error;
    }

    // Parse scores map to standard object
    const scores =
      attempt.scores instanceof Map
        ? Object.fromEntries(attempt.scores)
        : attempt.scores || {};

    return {
      attemptId: attempt._id,
      assessment: attempt.assessment,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      scores,
      resultSummary: attempt.resultSummary,
    };
  }

  /**
   * Retrieves historical attempts for the authenticated student
   */
  async getUserAttempts(userId) {
    return await AssessmentAttempt.find({ user: userId })
      .populate("assessment", "title type estimatedDuration")
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Retrieves all attempts with optional filters (Admin)
   */
  async getAllAttempts(filter = {}) {
    return await AssessmentAttempt.find(filter)
      .populate("user", "firstName lastName email")
      .populate("assessment", "title type")
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new AssessmentAttemptService();
