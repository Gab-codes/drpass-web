import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PRACTICE_LIMITS,
  getAvailableQuestionCount,
  generateMockExam,
} from "@/data/mock-exam";
import { useExamStore } from "@/store/exam-store";
import { StepperInput } from "@/components/practice/stepper-input";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

const DEFAULT_QUESTIONS_PER_SUBJECT = 10;
const TIME_PRESETS = [5, 10, 15, 30, 45, 60];

// Preset chip for time
function PresetChips({
  values,
  current,
  onSelect,
  label,
}: {
  values: readonly number[];
  current: number;
  onSelect: (v: number) => void;
  label: string;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 mt-3"
      role="group"
      aria-label={label}
    >
      {values.map((v) => {
        const isActive = v === current;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            aria-pressed={isActive}
            className={cn(
              "h-8 px-3 rounded-full border text-xs font-medium tabular-nums transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              "cursor-pointer",
            )}
          >
            {v} min
          </button>
        );
      })}
    </div>
  );
}

type SubjectConfig = {
  code: string;
  name: string;
  active: boolean;
  count: number;
};

export default function PracticeSetup() {
  const navigate = useNavigate();
  const setupExam = useExamStore((state) => state.setupExam);
  const { user } = useUser();

  const [subjectsConfig, setSubjectsConfig] = useState<SubjectConfig[]>([]);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(0);
  const [isTimeManuallySet, setIsTimeManuallySet] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Initialize from user subjects
  useEffect(() => {
    if (user?.subjects && subjectsConfig.length === 0) {
      const initialConfig = user.subjects.map((sub) => ({
        code: sub.code,
        name: sub.name,
        active: true,
        count: DEFAULT_QUESTIONS_PER_SUBJECT,
      }));
      setSubjectsConfig(initialConfig);
    }
  }, [user?.subjects, subjectsConfig.length]);

  const activeSubjects = subjectsConfig.filter((s) => s.active && s.count > 0);
  const totalQuestions = activeSubjects.reduce((sum, s) => sum + s.count, 0);

  // Auto-update time limit if not manually set
  useEffect(() => {
    if (!isTimeManuallySet && totalQuestions > 0) {
      // 1 minute per question default
      setTotalTimeMinutes(totalQuestions);
    } else if (!isTimeManuallySet && totalQuestions === 0) {
      setTotalTimeMinutes(0);
    }
  }, [totalQuestions, isTimeManuallySet]);

  const toggleSubject = (code: string) => {
    setSubjectsConfig((prev) =>
      prev.map((s) => {
        if (s.code !== code) return s;
        // If toggling off, count remains its value but it's not active
        return { ...s, active: !s.active };
      }),
    );
  };

  const updateSubjectCount = (code: string, count: number) => {
    setSubjectsConfig((prev) =>
      prev.map((s) => {
        if (s.code !== code) return s;
        // Auto-activate if they increase count from 0 while inactive
        return { ...s, count, active: count > 0 ? true : s.active };
      }),
    );
  };

  const handleTimeChange = (val: number) => {
    setIsTimeManuallySet(true);
    setTotalTimeMinutes(val);
  };

  const isValid =
    activeSubjects.length > 0 &&
    totalQuestions >= 1 &&
    totalTimeMinutes >= PRACTICE_LIMITS.minTotalMinutes &&
    totalTimeMinutes <= PRACTICE_LIMITS.maxTotalMinutes;

  const handleStart = () => {
    if (!isValid) return;
    const config = {
      subjects: activeSubjects.map((s) => ({
        subjectCode: s.code,
        questionCount: s.count,
      })),
      totalTimeMinutes,
      exitPath: "/practice",
    };
    const questions = generateMockExam(config);
    setupExam(config, questions);
    navigate("/practice/exam");
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <header>
        <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">
          Practice Setup
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Customize your practice session by choosing how many questions to
          attempt per subject.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_320px] items-start pb-24 md:pb-0">
        {/* Left Column: Configuration */}
        <div className="space-y-10">
          {/* Subjects Section */}
          <section aria-labelledby="subjects-heading" className="space-y-4">
            <div>
              <h2
                id="subjects-heading"
                className="text-lg font-medium text-foreground"
              >
                Question Distribution
              </h2>
            </div>

            <div
              className="space-y-3"
              role="group"
              aria-label="Subject selection"
            >
              {subjectsConfig.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
                  Loading your subjects...
                </div>
              ) : (
                subjectsConfig.map((subject) => {
                  const isSelected = subject.active && subject.count > 0;
                  return (
                    <div
                      key={subject.code}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 shadow-sm",
                        isSelected
                          ? "border-primary/50 bg-accent/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                          : "border-border/50 bg-card hover:border-border",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubject(subject.code)}
                        aria-pressed={isSelected}
                        className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30 bg-background",
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <div>
                          <span
                            className={cn(
                              "block font-medium",
                              isSelected
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {subject.name}
                          </span>
                        </div>
                      </button>

                      {/* Numeric Stepper for Question Count */}
                      <div
                        className={cn(
                          "transition-opacity ml-8 sm:ml-0",
                          !subject.active && "opacity-50 pointer-events-none",
                        )}
                        onClick={(e) => {
                          // Prevent toggling the subject when clicking the stepper
                          e.stopPropagation();
                        }}
                      >
                        <StepperInput
                          id={`stepper-${subject.code}`}
                          label={`Questions for ${subject.name}`}
                          value={subject.count}
                          onChange={(val) =>
                            updateSubjectCount(subject.code, val)
                          }
                          min={0}
                          max={PRACTICE_LIMITS.maxQuestionsPerSubject}
                          variant="compact"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Soft Warning for availability */}
            {(() => {
              const warnings = activeSubjects.filter(
                (s) => s.count > getAvailableQuestionCount(s.code),
              );
              if (warnings.length === 0) return null;
              return (
                <p className="text-sm text-warning/90 mt-3" role="status">
                  Note: You requested more questions than available for{" "}
                  {warnings.map((w) => w.name).join(", ")}. Remaining slots will
                  be filled with duplicates or generic questions.
                </p>
              );
            })()}
          </section>

          {/* Time Limit Section */}
          <section aria-labelledby="time-heading" className="space-y-4">
            <div>
              <h2
                id="time-heading"
                className="text-lg font-medium text-foreground"
              >
                Time Limit
              </h2>
            </div>

            <div className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Duration (minutes)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!isTimeManuallySet && totalQuestions > 0
                      ? "Automatically suggested based on 1 min per question."
                      : "Custom time selected."}
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <StepperInput
                    id="time-input"
                    label="Total time limit"
                    value={totalTimeMinutes}
                    onChange={handleTimeChange}
                    min={PRACTICE_LIMITS.minTotalMinutes}
                    max={PRACTICE_LIMITS.maxTotalMinutes}
                    variant="compact"
                  />
                </div>
              </div>

              <PresetChips
                values={TIME_PRESETS}
                current={totalTimeMinutes}
                onSelect={handleTimeChange}
                label="Quick duration presets"
              />
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary (Desktop) */}
        <div className="hidden md:block">
          <Card className="sticky top-24 bg-surface-2 shadow-sm rounded-3xl border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="flex justify-between items-center text-sm py-3 border-b border-border/60">
                <span className="text-muted-foreground">Selected Subjects</span>
                <span className="font-medium text-foreground">
                  {activeSubjects.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-3 border-b border-border/60">
                <span className="text-muted-foreground">Total Questions</span>
                <span className="font-medium text-foreground tabular-nums text-lg">
                  {totalQuestions}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-3">
                <span className="text-muted-foreground">Time Limit</span>
                <span className="font-medium text-foreground tabular-nums text-lg">
                  {totalTimeMinutes} min
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogTrigger>
                  <Button
                    size="lg"
                    className="w-full rounded-xl text-base h-12"
                    disabled={!isValid}
                  >
                    Review & Start
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirm Practice Session</DialogTitle>
                    <DialogDescription>
                      Review your selected question distribution and time limit
                      before starting.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">
                          {totalQuestions}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          Questions
                        </p>
                      </div>
                      <div className="h-10 w-px bg-border"></div>
                      <div className="space-y-1 text-right">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">
                          {totalTimeMinutes}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          Minutes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="text-sm font-medium text-foreground mb-3">
                        Question Distribution
                      </h4>
                      {activeSubjects.map((sub) => (
                        <div
                          key={sub.code}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {sub.name}
                          </span>
                          <span className="font-medium tabular-nums">
                            {sub.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="mt-2 sm:justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setIsConfirmOpen(false)}
                    >
                      Edit Configuration
                    </Button>
                    <Button onClick={handleStart}>Start Practice</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40 supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {totalQuestions} Qs{" "}
              <span className="text-muted-foreground">•</span>{" "}
              {totalTimeMinutes} min
            </span>
            <span className="text-xs text-muted-foreground">
              {activeSubjects.length} subject
              {activeSubjects.length !== 1 && "s"}
            </span>
          </div>
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger>
              <Button disabled={!isValid} className="rounded-xl px-6">
                Review & Start
              </Button>
            </DialogTrigger>
            {/* Reusing DialogContent from above via Portal/Dialog structure */}
            <DialogContent className="sm:max-w-md w-[90vw] rounded-3xl">
              <DialogHeader>
                <DialogTitle>Confirm Practice Session</DialogTitle>
                <DialogDescription>
                  Review your question distribution and time limit.
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Questions
                    </p>
                  </div>
                  <div className="h-10 w-px bg-border"></div>
                  <div className="space-y-1 text-right">
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                      {totalTimeMinutes}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Minutes
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Subject Breakdown
                  </h4>
                  {activeSubjects.map((sub) => (
                    <div
                      key={sub.code}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{sub.name}</span>
                      <span className="font-medium tabular-nums">
                        {sub.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="mt-2 flex-col gap-2 sm:justify-between sm:flex-row">
                <Button className="w-full sm:w-auto" onClick={handleStart}>
                  Start Practice
                </Button>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setIsConfirmOpen(false)}
                >
                  Go Back
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
