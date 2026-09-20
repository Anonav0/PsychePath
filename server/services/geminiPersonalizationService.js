/**
 * PsychePath - Gemini Personalization Service
 *
 * Orchestrates AI prompt generation, response validation, DAG prerequisite
 * integrity checks, zero-hallucination filtering, and automatic fallback.
 */

const geminiService = require("./geminiService");
const { buildLearningPathPrompt } = require("../prompts/learningPathPrompt");
const config = require("../config");

class GeminiPersonalizationService {
  /**
   * Sanitizes learner profile to minimize payload and prevent data leakage
   */
  buildLearnerContext(profile) {
    return {
      educationLevel: profile.educationLevel || "NOT_SPECIFIED",
      experienceLevel: profile.experienceLevel || "BEGINNER",
      currentSkills: (profile.currentSkills || []).map((s) => ({
        name: s.name,
        level: s.level,
      })),
      learningGoals: (profile.learningGoals || []).map((g) =>
        typeof g === "string" ? g : g.name || "",
      ),
      interests: profile.interests || [],
      learningPreferences: {
        preferredFormat:
          profile.learningPreferences?.preferredFormat ||
          profile.preferredFormat ||
          "MIXED",
        preferredDifficulty:
          profile.learningPreferences?.preferredDifficulty ||
          profile.preferredDifficulty ||
          "BEGINNER",
        preferredSessionDuration:
          profile.learningPreferences?.preferredSessionDuration || 60,
      },
      assessmentDimensions: profile.assessmentDimensions || {},
      strengths: profile.strengths || [],
      improvementAreas: profile.improvementAreas || [],
      weeklyLearningHours: profile.weeklyLearningHours || 10,
    };
  }

  /**
   * Sanitizes candidate modules for Gemini prompt
   */
  buildCandidatePayload(candidates) {
    const maxCandidates = config.aiMaxCandidates || 10;
    return candidates.slice(0, maxCandidates).map((c) => ({
      moduleId: c.module.id,
      title: c.module.title,
      category: c.module.category,
      difficulty: c.module.difficulty,
      estimatedDuration: c.module.estimatedDuration,
      matchedSkills: c.matchedSkills || [],
      skillGaps: c.skillGaps || [],
      score: c.score,
      reason: c.reason,
      prerequisitesSatisfied: c.prerequisitesSatisfied,
      missingPrerequisites: c.missingPrerequisites || [],
    }));
  }

  /**
   * Validates structured AI output schema
   */
  validateSchema(aiOutput) {
    if (!aiOutput || typeof aiOutput !== "object" || Array.isArray(aiOutput)) {
      return { isValid: false, error: "AI output is not a JSON object" };
    }

    if (!aiOutput.summary || typeof aiOutput.summary !== "string") {
      return { isValid: false, error: "Missing or invalid 'summary' string" };
    }

    if (
      !Array.isArray(aiOutput.focusAreas) ||
      aiOutput.focusAreas.some((fa) => typeof fa !== "string")
    ) {
      return { isValid: false, error: "Missing or invalid 'focusAreas' array" };
    }

    if (
      !Array.isArray(aiOutput.learningStrategy) ||
      aiOutput.learningStrategy.some((ls) => typeof ls !== "string")
    ) {
      return {
        isValid: false,
        error: "Missing or invalid 'learningStrategy' array",
      };
    }

    if (!Array.isArray(aiOutput.sequence)) {
      return { isValid: false, error: "Missing or invalid 'sequence' array" };
    }

    for (const item of aiOutput.sequence) {
      if (
        !item ||
        typeof item.moduleId !== "string" ||
        typeof item.reason !== "string"
      ) {
        return {
          isValid: false,
          error:
            "Invalid sequence item structure (moduleId and reason required)",
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates and repairs prerequisite DAG ordering
   * Ensures that if module B requires module A, A appears before B.
   */
  enforcePrerequisiteOrdering(orderedCandidateIds, candidatesMap) {
    const position = new Map();
    orderedCandidateIds.forEach((id, index) => position.set(id, index));

    let hasViolation = false;

    // Check each module in the sequence
    for (let i = 0; i < orderedCandidateIds.length; i++) {
      const id = orderedCandidateIds[i];
      const candidate = candidatesMap.get(id);
      if (!candidate) continue;

      // Check against any prerequisites present in the sequence
      const prereqs = [
        ...(candidate.prerequisites || []),
        ...(candidate.missingPrerequisites || []).map(
          (p) => p.id || p.moduleId,
        ),
      ].filter(Boolean);

      for (const prereqId of prereqs) {
        if (position.has(prereqId)) {
          const prereqPos = position.get(prereqId);
          if (prereqPos > i) {
            // Prerequisite appears AFTER dependent module!
            hasViolation = true;
            break;
          }
        }
      }
      if (hasViolation) break;
    }

    if (!hasViolation) {
      return { repaired: false, sequence: orderedCandidateIds };
    }

    // Topological repair: Build in-degree graph and sort deterministically
    const graph = new Map();
    const inDegree = new Map();

    orderedCandidateIds.forEach((id) => {
      graph.set(id, []);
      inDegree.set(id, 0);
    });

    orderedCandidateIds.forEach((id) => {
      const candidate = candidatesMap.get(id);
      const prereqs = [
        ...(candidate?.prerequisites || []),
        ...(candidate?.missingPrerequisites || []).map(
          (p) => p.id || p.moduleId,
        ),
      ]
        .filter(Boolean)
        .filter((pid) => graph.has(pid));

      prereqs.forEach((pid) => {
        graph.get(pid).push(id);
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      });
    });

    const queue = [];
    // Deterministic queue initialization preserving initial sequence order
    orderedCandidateIds.forEach((id) => {
      if (inDegree.get(id) === 0) {
        queue.push(id);
      }
    });

    const repaired = [];
    while (queue.length > 0) {
      const current = queue.shift();
      repaired.push(current);

      const neighbors = graph.get(current) || [];
      neighbors.forEach((neighbor) => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    // If topological sort visited all nodes, return repaired sequence
    if (repaired.length === orderedCandidateIds.length) {
      return { repaired: true, sequence: repaired };
    }

    // Circular or unresolved dependency; return original for rejection/fallback
    return { repaired: false, sequence: orderedCandidateIds, failed: true };
  }

  /**
   * Main personalization pipeline
   */
  async personalize(profile, deterministicActionable, deterministicBlocked) {
    if (!deterministicActionable || deterministicActionable.length === 0) {
      return {
        source: "RULE_ENGINE",
        recommendations: [],
        blockedModules: deterministicBlocked || [],
        profileVersion: profile.profileVersion || 1,
        candidateCount: 0,
      };
    }

    try {
      const learnerContext = this.buildLearnerContext(profile);
      const candidatePayload = this.buildCandidatePayload(
        deterministicActionable,
      );

      const promptData = buildLearningPathPrompt(
        learnerContext,
        candidatePayload,
      );
      const aiResponse = await geminiService.generateContent(promptData);

      // 1. Validate Schema
      const schemaCheck = this.validateSchema(aiResponse);
      if (!schemaCheck.isValid) {
        console.warn(
          `[GeminiPersonalization] Invalid schema: ${schemaCheck.error}. Falling back to RULE_ENGINE.`,
        );
        return this.fallback(
          deterministicActionable,
          deterministicBlocked,
          profile,
        );
      }

      // 2. Candidate Map for O(1) lookup
      const candidatesMap = new Map();
      deterministicActionable.forEach((c) => candidatesMap.set(c.module.id, c));

      // 3. Hallucination Pruning: Filter out any moduleId not in candidates
      const seenIds = new Set();
      const validAiSequence = [];

      for (const item of aiResponse.sequence) {
        const id = item.moduleId;
        if (candidatesMap.has(id) && !seenIds.has(id)) {
          seenIds.add(id);
          validAiSequence.push(item);
        }
      }

      if (validAiSequence.length === 0) {
        console.warn(
          "[GeminiPersonalization] All AI sequence IDs were hallucinated or invalid. Falling back to RULE_ENGINE.",
        );
        return this.fallback(
          deterministicActionable,
          deterministicBlocked,
          profile,
        );
      }

      // 4. DAG Prerequisite Ordering Verification & Repair
      const candidateIds = validAiSequence.map((s) => s.moduleId);
      const orderCheck = this.enforcePrerequisiteOrdering(
        candidateIds,
        candidatesMap,
      );

      if (orderCheck.failed) {
        console.warn(
          "[GeminiPersonalization] Unresolvable prerequisite ordering in AI output. Falling back to RULE_ENGINE.",
        );
        return this.fallback(
          deterministicActionable,
          deterministicBlocked,
          profile,
        );
      }

      const finalOrderedIds = orderCheck.sequence;
      const aiReasonMap = new Map();
      validAiSequence.forEach((s) => aiReasonMap.set(s.moduleId, s.reason));

      // Build personalized recommendations in final validated order
      const personalizedRecommendations = finalOrderedIds.map((id, index) => {
        const candidate = candidatesMap.get(id);
        const aiReason = aiReasonMap.get(id);

        return {
          ...candidate,
          reason:
            aiReason && typeof aiReason === "string" && aiReason.trim()
              ? aiReason.trim()
              : candidate.reason,
          aiSequenced: true,
          aiPriority: index + 1,
        };
      });

      // Append any actionable candidates not explicitly in AI sequence (preserving deterministic ranking)
      deterministicActionable.forEach((c) => {
        if (!seenIds.has(c.module.id)) {
          personalizedRecommendations.push({
            ...c,
            aiSequenced: false,
          });
        }
      });

      return {
        source: "HYBRID",
        summary: aiResponse.summary.trim(),
        focusAreas: aiResponse.focusAreas.map((f) => f.trim()),
        learningStrategy: aiResponse.learningStrategy.map((s) => s.trim()),
        recommendations: personalizedRecommendations,
        blockedModules: deterministicBlocked || [],
        profileVersion: profile.profileVersion || 1,
        candidateCount: deterministicActionable.length,
      };
    } catch (err) {
      console.warn(
        `[GeminiPersonalization] Gemini service error: ${err.message}. Falling back to RULE_ENGINE.`,
      );
      return this.fallback(
        deterministicActionable,
        deterministicBlocked,
        profile,
      );
    }
  }

  /**
   * Deterministic fallback method adhering strictly to Phase 7
   */
  fallback(deterministicActionable, deterministicBlocked, profile) {
    return {
      source: "RULE_ENGINE",
      summary:
        "Deterministic recommendations computed by rule-based scoring engine.",
      focusAreas: (profile.learningGoals || []).map((g) =>
        typeof g === "string" ? g : g.name || "",
      ),
      learningStrategy: [
        "Follow curriculum prerequisite sequence.",
        "Address core skill gaps first before advanced topics.",
      ],
      recommendations: deterministicActionable,
      blockedModules: deterministicBlocked || [],
      profileVersion: profile.profileVersion || 1,
      candidateCount: deterministicActionable.length,
    };
  }
}

module.exports = new GeminiPersonalizationService();
