"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import assessmentService from "../../services/assessmentService";
import authService from "../../services/authService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { Brain, Clock, FileText, ArrowRight, History } from "lucide-react";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = authService.getUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await assessmentService.getAssessments();
        if (res.success) {
          setAssessments(res.data);
        }

        if (user) {
          try {
            const attemptsRes = await assessmentService.getMyAttempts();
            if (attemptsRes.success) {
              setMyAttempts(attemptsRes.data);
            }
          } catch (e) {
            // Ignore attempt fetch error if guest
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load assessments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Psychometric Assessments
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
          Standardized psychometric and learning style diagnostics to determine
          your cognitive strengths and personalized learning journey.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <CardSkeleton count={3} />}

      {!loading && assessments.length === 0 && !error && (
        <EmptyState
          icon={Brain}
          title="No Active Assessments Available"
          description="Check back soon or contact platform administration."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((item) => (
          <Card
            key={item._id}
            className="flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <Brain className="h-4 w-4" />
                <span>Diagnostic Module</span>
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {item.title}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                {item.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {item.dimensions && item.dimensions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.dimensions.map((dim) => (
                    <Badge
                      key={dim.key}
                      variant="secondary"
                      className="text-[10px] bg-muted/70 text-foreground"
                    >
                      {dim.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {item.estimatedDuration} mins &bull;{" "}
                  {item.questionCount || 12} Qs
                </span>
              </div>
              <Link href={`/assessments/${item._id}`}>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {user && myAttempts.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Your Assessment History
            </h2>
          </div>

          <Card className="divide-y overflow-hidden shadow-sm">
            {myAttempts.map((att) => (
              <div
                key={att._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {att.assessment?.title || "Assessment"}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <StatusBadge status={att.status} size="small" />
                    <span>&bull;</span>
                    <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  {att.status === "COMPLETED" ? (
                    <Link href={`/assessments/result/${att._id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        View Results
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/assessments/${att.assessment?._id || att.assessment}/take`}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                      >
                        <span>Resume</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
