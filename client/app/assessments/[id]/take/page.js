"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import assessmentService from "../../../../services/assessmentService";
import authService from "../../../../services/authService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProgressBar from "@/components/ui/ProgressBar";
import { toast } from "@/components/ui/use-toast";
import {
  Brain,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      const msg = `Please answer all questions before submitting. ${unanswered.length} question(s) remaining.`;
      setError(msg);
      toast.warning("Unanswered Questions", msg);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await assessmentService.submitAttempt(attempt._id);
      if (res.success) {
        toast.success(
          "Assessment Completed",
          "Your cognitive profile has been scored!",
        );
        router.push(`/assessments/result/${attempt._id}`);
      }
    } catch (err) {
      const errMsg = err.message || "Failed to submit assessment";
      setError(errMsg);
      toast.error("Submission Failed", errMsg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">
          Loading assessment questions...
        </p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href={`/assessments/${id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Assessment Details</span>
          </Button>
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent =
    questions.length > 0
      ? Math.round(((currentIndex + 1) / questions.length) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Quiz Container Card */}
      <Card className="shadow-lg border-border/80">
        <CardHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {answeredCount} of {questions.length} Answered
              </Badge>
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold transition-colors flex items-center gap-1",
                savingAnswer ? "text-amber-500" : "text-emerald-500",
              )}
            >
              {savingAnswer ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Saved</span>
                </>
              )}
            </span>
          </div>

          <ProgressBar
            value={progressPercent}
            height="6px"
            variant="gradient"
          />
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentQuestion && (
            <div className="space-y-4">
              <div>
                <Badge
                  variant="outline"
                  className="text-[11px] uppercase tracking-wider text-primary border-primary/30"
                >
                  {currentQuestion.dimension}
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {currentQuestion.questionText}
              </h2>

              <div className="space-y-2.5 pt-2">
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
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 group",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm text-foreground"
                          : "border-border bg-card/60 hover:bg-muted/50 hover:border-border text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 group-hover:border-primary",
                        )}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium leading-relaxed">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleNext}
              className="gap-1 text-xs"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              size="default"
              onClick={handleSubmit}
              loading={submitting}
              className="gap-1.5 shadow-md"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? "Scoring..." : "Submit Assessment"}</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
