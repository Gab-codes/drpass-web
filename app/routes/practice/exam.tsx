import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useExamStore } from "@/store/exam-store";
import { useExamKeyboard } from "@/hooks/use-exam-keyboard";
import { AnswerOptions } from "@/components/exam/answer-options";
import { QuestionCard } from "@/components/exam/question-card";
import { ExamNavigator } from "@/components/exam/exam-navigator";
import { ExamControls } from "@/components/exam/exam-controls";
import { SubmitDialog } from "@/components/exam/submit-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Timer display helpers ─────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Key thresholds (seconds) at which we announce remaining time to screen readers
const ANNOUNCE_THRESHOLDS = [300, 120, 60, 30, 10];

// ─── Completed / timeout screen ───────────────────────────────────────────
function CompletedScreen({
  timedOut,
  onExit,
}: {
  timedOut: boolean;
  onExit: () => void;
}) {
  const { questions, answers } = useExamStore();
  const answered = Object.keys(answers).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-6 p-8 text-center">
      <div className="max-w-sm space-y-5">
        {timedOut ? (
          <>
            <div
              className="mx-auto w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                className="w-7 h-7 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground">
              Time expired
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your practice session was automatically submitted when the time
              ran out.
            </p>
          </>
        ) : (
          <>
            <div
              className="mx-auto w-14 h-14 rounded-full bg-accent flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground">
              Practice submitted
            </h1>
            <p className="text-muted-foreground text-sm">
              Your session has been recorded.
            </p>
          </>
        )}
        <p className="text-sm text-muted-foreground">
          You answered{" "}
          <strong className="text-foreground font-medium">
            {answered} of {questions.length}
          </strong>{" "}
          questions.
        </p>
        <Button onClick={onExit} size="lg" className="mt-2 rounded-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

// ─── Main exam page ────────────────────────────────────────────────────────
export default function ExamPage() {
  const navigate = useNavigate();
  const timedOutRef = useRef(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Tracks which thresholds have been announced to avoid repeated announcements
  const announcedThresholds = useRef<Set<number>>(new Set());
  const [srAnnouncement, setSrAnnouncement] = useState("");

  const {
    status,
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining,
    isSubmitDialogOpen,
    startExam,
    setAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    tickTime,
    openSubmitDialog,
    closeSubmitDialog,
    submitExam,
    resetExam,
  } = useExamStore();

  // Redirect to setup if no exam is configured
  useEffect(() => {
    if (questions.length === 0) {
      navigate("/practice", { replace: true });
    } else if (status === "idle") {
      startExam();
    }
  }, [questions.length, status, startExam, navigate]);

  // Timer tick
  useEffect(() => {
    if (status !== "in-progress") return;
    const interval = setInterval(() => {
      tickTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [status, tickTime]);

  // Detect timeout — set ref before the completed render
  useEffect(() => {
    if (status === "completed" && timeRemaining === 0) {
      timedOutRef.current = true;
    }
  }, [status, timeRemaining]);

  // Screen-reader threshold announcements — announce at key remaining times
  useEffect(() => {
    if (status !== "in-progress") return;
    for (const threshold of ANNOUNCE_THRESHOLDS) {
      if (
        timeRemaining === threshold &&
        !announcedThresholds.current.has(threshold)
      ) {
        announcedThresholds.current.add(threshold);
        const minutes = Math.floor(threshold / 60);
        const seconds = threshold % 60;
        if (minutes > 0) {
          setSrAnnouncement(`${minutes} minutes remaining`);
        } else {
          setSrAnnouncement(`${seconds} seconds remaining`);
        }
        break;
      }
    }
  }, [status, timeRemaining]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      setAnswer(currentQuestion.id, optionId);
    },
    [currentQuestion, setAnswer]
  );

  const handleExit = () => {
    resetExam();
    navigate("/dashboard");
  };

  // Keyboard shortcuts — centralized
  useExamKeyboard({
    onSelectOption: handleSelectOption,
    onNext: nextQuestion,
    onPrev: prevQuestion,
    onSubmitStart: openSubmitDialog,
    onSubmitConfirm: submitExam,
    onSubmitCancel: closeSubmitDialog,
    isSubmitDialogOpen,
    options: currentQuestion?.options ?? [],
  });

  // ── Completed state ──────────────────────────────────────────────────────
  if (status === "completed") {
    return (
      <CompletedScreen timedOut={timedOutRef.current} onExit={handleExit} />
    );
  }

  if (!currentQuestion || status === "idle") {
    return null;
  }

  // ── Timer urgency thresholds ─────────────────────────────────────────────
  const isUrgent = timeRemaining <= 120; // 2 minutes
  const isCritical = timeRemaining <= 60; // 1 minute

  const selectedOptionId = answers[currentQuestion.id];

  // ── Exam UI ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Screen-reader only live region for timer threshold announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand mark */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="h-6 w-6 rounded-md bg-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                className="w-3.5 h-3.5 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l6.16-3.422A12.083 12.083 0 0121 21v0M12 14l-6.16-3.422A12.083 12.083 0 003 21v0"
                />
              </svg>
            </div>
            <span className="font-heading font-semibold text-sm text-foreground">
              DrPass
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
              Quick Practice
            </span>
          </div>

          {/* Progress — center, desktop only */}
          <div
            className="text-xs text-muted-foreground text-center hidden sm:block"
            aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
          >
            Question{" "}
            <span className="font-medium text-foreground tabular-nums">
              {currentQuestionIndex + 1}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground tabular-nums">
              {questions.length}
            </span>
          </div>

          {/* Timer + controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Visual timer — aria-hidden since SR announcements handled separately */}
            <div
              aria-hidden="true"
              className={cn(
                "flex items-center gap-1.5 text-sm font-mono font-medium tabular-nums transition-colors duration-300",
                isCritical
                  ? "text-destructive"
                  : isUrgent
                  ? "text-warning"
                  : "text-foreground"
              )}
            >
              <svg
                className="w-4 h-4 opacity-60 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatTime(timeRemaining)}
            </div>

            {/* Screen-reader accessible timer label */}
            <span className="sr-only">
              Time remaining: {formatTime(timeRemaining)}
            </span>

            {/* Keyboard shortcuts toggle */}
            <button
              type="button"
              onClick={() => setShowShortcuts((s) => !s)}
              className="hidden md:flex items-center justify-center h-7 px-2.5 rounded-md text-xs text-muted-foreground border border-border bg-transparent hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle keyboard shortcuts panel"
              aria-expanded={showShortcuts}
              aria-controls="shortcuts-panel"
            >
              Keys
            </button>

            {/* Exit */}
            <button
              type="button"
              onClick={handleExit}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label="Exit practice session and return to dashboard"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts panel */}
        {showShortcuts && (
          <div
            id="shortcuts-panel"
            className="border-t border-border bg-muted/30 px-4 sm:px-6 py-3"
          >
            <div className="max-w-6xl mx-auto">
              <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                {(
                  [
                    { key: "A–D", desc: "Select option" },
                    { key: "P", desc: "Previous" },
                    { key: "N", desc: "Next" },
                    { key: "S", desc: "Open submit" },
                    { key: "Y", desc: "Confirm" },
                    { key: "R", desc: "Cancel" },
                  ] as const
                ).map(({ key, desc }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <dt className="sr-only">{desc}</dt>
                    <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-xs">
                      {key}
                    </kbd>
                    <dd>{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 md:py-10"
      >
        {/* Mobile: condensed progress row */}
        <div className="sm:hidden flex items-center justify-between text-sm text-muted-foreground mb-5">
          <span>
            <span className="font-medium text-foreground">
              {currentQuestionIndex + 1}
            </span>
            {" / "}
            {questions.length}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-mono font-medium tabular-nums",
              isCritical
                ? "text-destructive"
                : isUrgent
                ? "text-warning"
                : "text-muted-foreground"
            )}
            aria-hidden="true"
          >
            <svg
              className="w-3.5 h-3.5 opacity-70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/*
         * Desktop: two-column layout
         * Left: Question + navigator
         * Right: Options + controls
         *
         * Mobile: single-column stacked
         * Question → Options → Navigator → Controls
         */}
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-8 lg:gap-14">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            {/* Question */}
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />

            {/* Question navigator — desktop only in left column */}
            <div className="hidden md:block">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
                Questions
              </p>
              <ExamNavigator
                questions={questions}
                currentIndex={currentQuestionIndex}
                answers={answers}
                onNavigate={goToQuestion}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Answer options */}
            <AnswerOptions
              options={currentQuestion.options}
              selectedOptionId={selectedOptionId}
              onSelect={handleSelectOption}
            />

            {/* Question navigator — mobile only */}
            <div className="md:hidden">
              <ExamNavigator
                questions={questions}
                currentIndex={currentQuestionIndex}
                answers={answers}
                onNavigate={goToQuestion}
              />
            </div>

            {/* Navigation controls */}
            <div className="pt-1">
              <ExamControls
                currentIndex={currentQuestionIndex}
                totalQuestions={questions.length}
                onPrev={prevQuestion}
                onNext={nextQuestion}
                onSubmit={openSubmitDialog}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Submit confirmation dialog ──────────────────────────────────── */}
      <SubmitDialog
        open={isSubmitDialogOpen}
        onClose={closeSubmitDialog}
        onConfirm={submitExam}
      />
    </>
  );
}
