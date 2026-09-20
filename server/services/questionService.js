const { Question, Assessment } = require("../models");

class QuestionService {
  /**
   * Adds a new question to an assessment
   */
  async addQuestion(assessmentId, questionData) {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      const error = new Error("Assessment not found");
      error.statusCode = 404;
      error.errorCode = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    // Auto-determine order if not explicitly specified
    let order = questionData.order;
    if (!order) {
      const lastQuestion = await Question.findOne({
        assessment: assessmentId,
      }).sort({ order: -1 });
      order = lastQuestion ? lastQuestion.order + 1 : 1;
    }

    const question = await Question.create({
      ...questionData,
      assessment: assessmentId,
      order,
    });

    // Increment questionCount on assessment
    await Assessment.findByIdAndUpdate(assessmentId, {
      $inc: { questionCount: 1 },
    });

    return question;
  }

  /**
   * Retrieves all questions for an assessment, sanitizing scoring internals for students
   */
  async getQuestionsByAssessment(assessmentId, { isAdmin = false } = {}) {
    const questions = await Question.find({
      assessment: assessmentId,
      isActive: true,
    })
      .sort({ order: 1 })
      .lean();

    if (isAdmin) {
      return questions;
    }

    // Security Sanitization: Strip option.score and option.dimensionScores for students
    return questions.map((q) => ({
      _id: q._id,
      assessment: q.assessment,
      questionText: q.questionText,
      questionType: q.questionType,
      dimension: q.dimension,
      order: q.order,
      isRequired: q.isRequired,
      options: q.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
    }));
  }

  /**
   * Retrieves single question by ID (Admin)
   */
  async getQuestionById(questionId) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error("Question not found");
      error.statusCode = 404;
      error.errorCode = "QUESTION_NOT_FOUND";
      throw error;
    }
    return question;
  }

  /**
   * Updates question by ID (Admin)
   */
  async updateQuestion(questionId, updateData) {
    const question = await Question.findByIdAndUpdate(questionId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!question) {
      const error = new Error("Question not found");
      error.statusCode = 404;
      error.errorCode = "QUESTION_NOT_FOUND";
      throw error;
    }

    return question;
  }

  /**
   * Deletes question and decrements assessment questionCount (Admin)
   */
  async deleteQuestion(questionId) {
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      const error = new Error("Question not found");
      error.statusCode = 404;
      error.errorCode = "QUESTION_NOT_FOUND";
      throw error;
    }

    await Assessment.findByIdAndUpdate(question.assessment, {
      $inc: { questionCount: -1 },
    });

    return { message: "Question deleted successfully", id: questionId };
  }

  /**
   * Reorders a question within an assessment (Admin)
   */
  async reorderQuestion(questionId, newOrder) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error("Question not found");
      error.statusCode = 404;
      error.errorCode = "QUESTION_NOT_FOUND";
      throw error;
    }

    question.order = newOrder;
    await question.save();
    return question;
  }
}

module.exports = new QuestionService();
