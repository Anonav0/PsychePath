"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import profileService from "../../services/profileService";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  User,
  Sparkles,
  Plus,
  X,
  Save,
  RefreshCw,
  GraduationCap,
  Target,
  BookOpen,
  Award,
  Clock,
  Briefcase,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form states
  const [educationLevel, setEducationLevel] = useState("UNDERGRADUATE");
  const [experienceLevel, setExperienceLevel] = useState("BEGINNER");
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [preferredFormat, setPreferredFormat] = useState("MIXED");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("BEGINNER");
  const [skills, setSkills] = useState([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }

    const loadProfileData = async () => {
      try {
        setLoading(true);
        // Load profile
        try {
          const res = await profileService.getMyProfile();
          if (res.success && res.data) {
            const p = res.data;
            setProfile(p);
            setEducationLevel(p.educationLevel || "UNDERGRADUATE");
            setExperienceLevel(p.experienceLevel || "BEGINNER");
            setWeeklyHours(p.weeklyLearningHours || 10);
            setPreferredFormat(
              p.learningPreferences?.preferredFormat || "MIXED",
            );
            setSkills(p.currentSkills || []);
            setGoals(p.learningGoals || []);
          }
        } catch (err) {
          if (err.data?.errorCode === "PROFILE_NOT_FOUND") {
            // Profile not initialized yet; defaults remain in form
          } else {
            throw err;
          }
        }

        // Load attempts to allow sync
        try {
          const attRes = await assessmentService.getMyAttempts();
          if (attRes.success && Array.isArray(attRes.data)) {
            setAttempts(attRes.data);
          }
        } catch (e) {
          // Ignore attempt fetch error
        }
      } catch (err) {
        setError(err.message || "Failed to load learner profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [router]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (
      skills.some(
        (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase(),
      )
    ) {
      const err = "Skill already exists in your profile";
      setError(err);
      toast.warning("Duplicate Skill", err);
      return;
    }
    setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName("");
    setError(null);
  };

  const handleRemoveSkill = (skillIndex) => {
    setSkills(skills.filter((_, idx) => idx !== skillIndex));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    if (
      goals.some(
        (g) => g.name.toLowerCase() === newGoalName.trim().toLowerCase(),
      )
    ) {
      const err = "Goal already exists in your profile";
      setError(err);
      toast.warning("Duplicate Goal", err);
      return;
    }
    setGoals([...goals, { name: newGoalName.trim(), priority: 2 }]);
    setNewGoalName("");
    setError(null);
  };

  const handleRemoveGoal = (goalIndex) => {
    setGoals(goals.filter((_, idx) => idx !== goalIndex));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        educationLevel,
        experienceLevel,
        weeklyLearningHours: Number(weeklyHours),
        currentSkills: skills,
        learningGoals: goals,
        learningPreferences: {
          preferredFormat,
          preferredDifficulty: experienceLevel,
          preferredSessionDuration: 45,
        },
      };

      const res = await profileService.updateMyProfile(payload);
      if (res.success) {
        setProfile(res.data);
        const msg = "Learner profile saved successfully!";
        setMessage(msg);
        toast.success("Profile Saved", msg);
      }
    } catch (err) {
      const errMsg = err.message || "Failed to save profile";
      setError(errMsg);
      toast.error("Save Failed", errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFromAttempt = async (attemptId) => {
    try {
      setSaving(true);
      setError(null);
      const res = await profileService.generateFromAssessment(attemptId);
      if (res.success) {
        setProfile(res.data);
        const msg =
          "Profile psychometrics synced successfully from assessment!";
        setMessage(msg);
        toast.success("Psychometrics Synced", msg);
      }
    } catch (err) {
      const errMsg =
        err.message || "Failed to generate profile from assessment";
      setError(errMsg);
      toast.error("Sync Failed", errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-2xl border p-8 bg-card/40 space-y-4">
          <CardSkeleton count={1} />
        </div>
        <CardSkeleton count={2} />
      </div>
    );
  }

  const completedAttempts = attempts.filter((a) => a.status === "COMPLETED");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Learner Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Maintain your educational background, skills, and assessment-derived
            psychometrics.
          </p>
        </div>

        {profile && (
          <div className="text-left sm:text-right space-y-1">
            <Badge variant="success" className="text-xs font-bold">
              {profile.profileCompleteness || 0}% Complete
            </Badge>
            <div className="text-[11px] text-muted-foreground">
              Profile v{profile.profileVersion || 1}
            </div>
          </div>
        )}
      </div>

      {message && (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assessment-Derived Attributes Section */}
      <Card className="border-primary/30 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Assessment-Derived Psychometrics</span>
              </div>
              <CardTitle className="text-lg">
                Cognitive Diagnostic Strengths
              </CardTitle>
              <CardDescription className="text-xs">
                Derived authoritatively by the backend scoring engine from your
                completed assessments.
              </CardDescription>
            </div>

            {completedAttempts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleGenerateFromAttempt(completedAttempts[0]._id)
                }
                disabled={saving}
                className="gap-2 text-xs shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync from Latest Assessment</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {profile?.lastAssessmentAttempt ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    <span>Demonstrated Strengths (&ge; 75%)</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.strengths && profile.strengths.length > 0 ? (
                      profile.strengths.map((s) => (
                        <Badge
                          key={s}
                          variant="success"
                          className="text-xs capitalize"
                        >
                          &bull; {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        None identified above threshold yet.
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    <span>Development Areas (&lt; 60%)</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.improvementAreas &&
                    profile.improvementAreas.length > 0 ? (
                      profile.improvementAreas.map((ia) => (
                        <Badge
                          key={ia}
                          variant="secondary"
                          className="text-xs capitalize bg-amber-500/10 text-amber-500 border-amber-500/20"
                        >
                          &bull; {ia}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No targeted development areas detected.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {profile.assessmentDimensions && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Dimension Alignment Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      profile.assessmentDimensions instanceof Map
                        ? Object.fromEntries(profile.assessmentDimensions)
                        : profile.assessmentDimensions,
                    ).map(([dim, score]) => (
                      <div key={dim} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="capitalize text-foreground">
                            {dim}
                          </span>
                          <span className="text-primary font-bold">
                            {score}%
                          </span>
                        </div>
                        <ProgressBar
                          value={score}
                          height="6px"
                          variant="gradient"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                No assessment-derived profile generated yet.
              </p>
              <Link href="/assessments">
                <Button size="sm" variant="default" className="text-xs">
                  Take Psychometric Assessment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User-Managed Profile Attributes Section */}
      <form onSubmit={handleSaveProfile}>
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                User-Managed Information
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure your career goals, education, format preferences, and
              verified technical skills.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Education Level</span>
                </label>
                <Select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                >
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="UNDERGRADUATE">Undergraduate Degree</option>
                  <option value="POSTGRADUATE">Postgraduate Degree</option>
                  <option value="BOOTCAMP">Bootcamp / Technical Program</option>
                  <option value="SELF_TAUGHT">Self-Taught</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Overall Experience Level</span>
                </label>
                <Select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Weekly Learning Hours (1–168)</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Preferred Learning Format</span>
                </label>
                <Select
                  value={preferredFormat}
                  onChange={(e) => setPreferredFormat(e.target.value)}
                >
                  <option value="PROJECT">Project-Based</option>
                  <option value="VIDEO">Video Tutorials</option>
                  <option value="READING">Reading & Documentation</option>
                  <option value="PRACTICE">Hands-on Practice</option>
                  <option value="MIXED">Mixed Multi-format</option>
                </Select>
              </div>
            </div>

            {/* Current Skills Manager */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-foreground block">
                Current Technical Skills
              </label>

              <div className="flex flex-wrap gap-2">
                {skills.map((sk, idx) => (
                  <Badge
                    key={sk.name}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2.5 text-xs"
                  >
                    <span className="font-semibold">{sk.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      ({sk.level})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-muted-foreground hover:text-destructive focus:outline-none ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="e.g. JavaScript, Python, SQL"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="flex-1"
                />
                <div className="w-full sm:w-40">
                  <Select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value)}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleAddSkill}
                  className="gap-1 text-xs shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Skill</span>
                </Button>
              </div>
            </div>

            {/* Learning Goals Manager */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-foreground block">
                Target Learning Goals
              </label>

              <div className="flex flex-wrap gap-2">
                {goals.map((g, idx) => (
                  <Badge
                    key={g.name}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2.5 text-xs"
                  >
                    <span className="font-semibold">{g.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-muted-foreground hover:text-destructive focus:outline-none ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. Become a Backend Architect"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleAddGoal}
                  className="gap-1 text-xs shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Goal</span>
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t flex justify-end">
            <Button
              type="submit"
              variant="default"
              size="default"
              loading={saving}
              className="gap-2 shadow-md text-xs sm:text-sm"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
