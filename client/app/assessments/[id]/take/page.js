"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import assessmentService from "../../../../services/assessmentService";
import authService from "../../../../services/authService";

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      router.push(`/login?redirect=/assessments/${id}/take`);
      return;
    }

    const initQuiz = async () => {
      try {
        setLoading(true);

        // 1. Get or start active attempt
        let attRes;
        try {
          attRes = await assessmentService.getActiveAttempt(id);
        } catch (e) {
          attRes = await assessmentService.startAttempt(id);
        }

        const activeAtt = attRes.data;
        setAttempt(activeAtt);

        // 2. Map existing answers
        const answerMap = {};
        if (activeAtt.answers && Array.isArray(activeAtt.answers)) {
          activeAtt.answers.forEach((ans) => {
            const qId =
              typeof ans.question === "object"
                ? ans.question._id
                : ans.question;
            answerMap[qId] = ans.selectedValue;
          });
        }
        setSelectedAnswers(answerMap);

        // 3. Load sanitized questions
        const qRes = await assessmentService.getQuestions(id);
        if (qRes.success && Array.isArray(qRes.data)) {
          // Sort by order ASC
          const sorted = qRes.data.sort((a, b) => a.order - b.order);
          setQuestions(sorted);

          // Find first unanswered question index
          const firstUnanswered = sorted.findIndex((q) => !answerMap[q._id]);
          if (firstUnanswered >= 0) {
            setCurrentIndex(firstUnanswered);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to initialize assessment");
      } finally {
        setLoading(false);
      }
    };

    if (id) initQuiz();
  }, [id, router]);

  const handleSelectOption = async (questionId, optionValue) => {
    // Update local state immediately for responsive UI
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionValue }));

    // Persist answer to backend
    if (attempt?._id) {
      try {
        setSavingAnswer(true);
        await assessmentService.saveAnswers(attempt._id, [
          { questionId, selectedValue: optionValue },
        ]);
      } catch (err) {
        console.error("Auto-save answer error:", err);
      } finally {
        setSavingAnswer(false);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Verify all required questions answered
    const unanswered = questions.filter(
      (q) => q.isRequired && !selectedAnswers[q._id],
    );
    if (unanswered.length > 0) {
      setError(
        `Please answer all questions before submitting. ${unanswered.length} question(s) remaining.`,
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await assessmentService.submitAttempt(attempt._id);
      if (res.success) {
        router.push(`/assessments/result/${attempt._id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to submit assessment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--text-muted)",
        }}
      >
        Loading assessment questions...
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="assessment-page-container">
        <div className="alert-box alert-error">{error}</div>
        <Link
          href={`/assessments/${id}`}
          className="btn-secondary-small"
          style={{ display: "inline-block", marginTop: "1rem" }}
        >
          ← Back to Assessment
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0
      ? Math.round(((currentIndex + 1) / questions.length) * 100)
      : 0;
  const isAnswered = currentQuestion && selectedAnswers[currentQuestion._id];

  return (
    <div className="assessment-page-container">
      <div className="quiz-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              color: savingAnswer ? "#fbbf24" : "#34d399",
            }}
          >
            {savingAnswer ? "Saving..." : "Saved ✓"}
          </span>
        </div>

        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {error && (
          <div
            className="alert-box alert-error"
            style={{ marginBottom: "1.5rem" }}
          >
            {error}
          </div>
        )}

        {currentQuestion && (
          <div>
            <div style={{ marginBottom: "0.5rem" }}>
              <span className="dim-tag" style={{ textTransform: "capitalize" }}>
                {currentQuestion.dimension}
              </span>
            </div>

            <h2 className="quiz-question-text">
              {currentQuestion.questionText}
            </h2>

            <div className="options-list">
              {currentQuestion.options.map((opt) => {
                const isSelected =
                  selectedAnswers[currentQuestion._id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      handleSelectOption(currentQuestion._id, opt.value)
                    }
                    className={`option-button ${isSelected ? "active" : ""}`}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: isSelected
                          ? "5px solid var(--primary)"
                          : "2px solid var(--border-color)",
                        background: isSelected ? "white" : "transparent",
                        flexShrink: 0,
                      }}
                    />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="quiz-nav-row">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn-secondary-small"
            style={{
              opacity: currentIndex === 0 ? 0.4 : 1,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary-small"
              style={{ cursor: "pointer" }}
            >
              Next Question →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="submit-btn"
              style={{
                width: "auto",
                padding: "0.6rem 1.5rem",
                background: "#10b981",
                borderColor: "#10b981",
              }}
            >
              {submitting ? "Scoring Assessment..." : "Submit Assessment ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
