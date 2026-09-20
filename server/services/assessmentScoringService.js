/**
 * Backend Authoritative Scoring Engine for PsychePath Assessments
 */
class AssessmentScoringService {
  /**
   * Evaluates submitted answers against questions and authoritative scoring configuration
   * @param {Object} options
   * @param {Object} options.attempt - AssessmentAttempt document
   * @param {Object} options.assessment - Assessment document
   * @param {Array<Object>} options.questions - Array of Question documents
   * @returns {Object} Calculated scores and educational result summary
   */
  scoreAttempt({ attempt, assessment, questions }) {
    // 1. Validate completeness of required questions
    const requiredQuestions = questions.filter(
      (q) => q.isRequired && q.isActive !== false,
    );
    const answeredQuestionIds = new Set(
      attempt.answers.map((ans) => ans.question.toString()),
    );

    const missingQuestions = requiredQuestions.filter(
      (q) => !answeredQuestionIds.has(q._id.toString()),
    );

    if (missingQuestions.length > 0) {
      const error = new Error(
        `Assessment is incomplete: ${missingQuestions.length} required question(s) have not been answered.`,
      );
      error.statusCode = 400;
      error.errorCode = "ASSESSMENT_INCOMPLETE";
      error.missingQuestionIds = missingQuestions.map((q) => q._id);
      throw error;
    }

    // 2. Build index of questions by ID
    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(q._id.toString(), q));

    // 3. Track dimension score totals and maximum possible scores
    const dimensionRawTotals = {};
    const dimensionMaxPossible = {};

    // Initialize all dimensions defined on assessment
    if (assessment.dimensions && Array.isArray(assessment.dimensions)) {
      assessment.dimensions.forEach((dim) => {
        const key = dim.key.toLowerCase().trim();
        dimensionRawTotals[key] = 0;
        dimensionMaxPossible[key] = 0;
      });
    }

    // Calculate maximum possible scores per dimension across questions
    questions.forEach((q) => {
      if (!q.options || q.options.length === 0) return;

      // Group max scores per dimension for this question
      const questionDimMax = {};

      q.options.forEach((opt) => {
        if (opt.dimensionScores) {
          const dimScores =
            opt.dimensionScores instanceof Map
              ? Object.fromEntries(opt.dimensionScores)
              : opt.dimensionScores;

          Object.entries(dimScores).forEach(([dim, val]) => {
            const key = dim.toLowerCase().trim();
            const scoreNum = Number(val) || 0;
            questionDimMax[key] = Math.max(questionDimMax[key] || 0, scoreNum);
          });
        }

        // Also check question.dimension and option.score
        if (q.dimension) {
          const key = q.dimension.toLowerCase().trim();
          const scoreNum = Number(opt.score) || 0;
          questionDimMax[key] = Math.max(questionDimMax[key] || 0, scoreNum);
        }
      });

      // Accumulate into overall max
      Object.entries(questionDimMax).forEach(([dim, maxVal]) => {
        dimensionMaxPossible[dim] = (dimensionMaxPossible[dim] || 0) + maxVal;
      });
    });

    // 4. Process student's submitted answers
    attempt.answers.forEach((ans) => {
      const question = questionMap.get(ans.question.toString());
      if (!question) return;

      // Find matching option authoritative value in DB
      const option = question.options.find(
        (opt) => opt.value === ans.selectedValue,
      );
      if (!option) {
        const error = new Error(
          `Invalid option value "${ans.selectedValue}" submitted for question "${question.questionText}"`,
        );
        error.statusCode = 400;
        error.errorCode = "INVALID_OPTION";
        throw error;
      }

      // Add scores from option.dimensionScores
      if (option.dimensionScores) {
        const dimScores =
          option.dimensionScores instanceof Map
            ? Object.fromEntries(option.dimensionScores)
            : option.dimensionScores;

        Object.entries(dimScores).forEach(([dim, val]) => {
          const key = dim.toLowerCase().trim();
          const scoreNum = Number(val) || 0;
          dimensionRawTotals[key] = (dimensionRawTotals[key] || 0) + scoreNum;
        });
      }

      // Add score from option.score to question.dimension
      if (question.dimension) {
        const key = question.dimension.toLowerCase().trim();
        const scoreNum = Number(option.score) || 0;
        // If option.dimensionScores didn't already record this dimension
        const hasSpecific =
          option.dimensionScores &&
          (option.dimensionScores instanceof Map
            ? option.dimensionScores.has(key)
            : option.dimensionScores[key] !== undefined);
        if (!hasSpecific) {
          dimensionRawTotals[key] = (dimensionRawTotals[key] || 0) + scoreNum;
        }
      }
    });

    // 5. Calculate percentage scores per dimension (normalized to 0-100)
    const normalizedScores = {};
    const dimensionDetails = {};
    const allDimensions = Array.from(
      new Set([
        ...Object.keys(dimensionRawTotals),
        ...Object.keys(dimensionMaxPossible),
      ]),
    );

    allDimensions.forEach((dim) => {
      const raw = dimensionRawTotals[dim] || 0;
      const max = dimensionMaxPossible[dim] || 1;
      const percentage = Math.min(
        100,
        Math.max(0, Math.round((raw / max) * 100)),
      );

      normalizedScores[dim] = percentage;
      dimensionDetails[dim] = {
        rawScore: raw,
        maxScore: max,
        percentage,
      };
    });

    // 6. Compute overall score
    const dimensionPercentages = Object.values(normalizedScores);
    const overallScore =
      dimensionPercentages.length > 0
        ? Math.round(
            dimensionPercentages.reduce((sum, p) => sum + p, 0) /
              dimensionPercentages.length,
          )
        : 0;

    // 7. Determine strongest dimensions and development areas
    const sortedDimensions = Object.entries(normalizedScores).sort(
      ([, a], [, b]) => b - a,
    );

    const strongestDimensions = sortedDimensions
      .filter(([, score]) => score >= 70)
      .map(([dim]) => dim);

    // Fallback if none >= 70
    if (strongestDimensions.length === 0 && sortedDimensions.length > 0) {
      strongestDimensions.push(sortedDimensions[0][0]);
    }

    const developmentAreas = sortedDimensions
      .filter(([, score]) => score < 70)
      .map(([dim]) => dim);

    // 8. Generate educational, learning-oriented summary (strictly non-clinical)
    const summaryText = this.generateSummaryText({
      assessmentTitle: assessment.title,
      overallScore,
      strongestDimensions,
      developmentAreas,
    });

    return {
      scores: normalizedScores,
      detailedScores: dimensionDetails,
      overallScore,
      strongestDimensions,
      developmentAreas,
      resultSummary: summaryText,
    };
  }

  /**
   * Generates educational learning style feedback
   */
  generateSummaryText({
    assessmentTitle,
    overallScore,
    strongestDimensions,
    developmentAreas,
  }) {
    const formatName = (k) =>
      k
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

    const strengthsStr =
      strongestDimensions.length > 0
        ? strongestDimensions.map(formatName).join(", ")
        : "general problem solving";

    const developmentStr =
      developmentAreas.length > 0
        ? developmentAreas.map(formatName).join(", ")
        : "specialized advanced topics";

    return `Completed ${assessmentTitle} with an overall psychometric learning alignment of ${overallScore}%. Demonstrated marked aptitude in ${strengthsStr}. Recommended learning pathways should incorporate structured modules reinforcing ${strengthsStr} while strategically targeting skill progression in ${developmentStr}.`;
  }
}

module.exports = new AssessmentScoringService();
