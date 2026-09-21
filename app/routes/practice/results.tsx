import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  InformationCircleIcon,
  Alert02Icon,
  ArrowLeft01Icon,
  ViewIcon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons";

import { useExamStore } from "@/store/exam-store";
import { calculatePracticeResults } from "@/lib/practice-results";
import type { PracticeQuestion } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Answer status helpers ─────────────────────────────────────────────────

type AnswerStatus = "correct" | "incorrect" | "unanswered";

function getAnswerStatus(
  question: PracticeQuestion,
  answers: Record<string, string>,
): AnswerStatus {
  const selected = answers[question.id];
  if (!selected) return "unanswered";
  return selected === question.correctOptionId ? "correct" : "incorrect";
}

// ─── Question status icon ──────────────────────────────────────────────────

function StatusIcon({
  status,
  className,
}: {
  status: AnswerStatus;
  className?: string;
}) {
  if (status === "correct") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        className={cn("text-success", className)}
        aria-hidden="true"
      />
    );
  }
  if (status === "incorrect") {
    return (
      <HugeiconsIcon
        icon={Cancel01Icon}
        className={cn("text-destructive", className)}
        aria-hidden="true"
      />
    );
  }
  return (
    <HugeiconsIcon
      icon={InformationCircleIcon}
      className={cn("text-muted-foreground", className)}
      aria-hidden="true"
    />
  );
}

// ─── Score ring ────────────────────────────────────────────────────────────

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      aria-hidden="true"
    >
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-primary transition-all duration-700 ease-out"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-2xl font-bold font-mono tabular-nums text-foreground">
        {percentage}%
      </span>
    </div>
  );
}

// ─── Summary view ─────────────────────────────────────────────────────────

function SummaryView({
  timedOut,
  onReview,
  onExit,
}: {
  timedOut: boolean;
  onReview: () => void;
  onExit: () => void;
}) {
  const { questions, answers } = useExamStore();

  const summary = useMemo(
    () => calculatePracticeResults(questions, answers),
    [questions, answers],
  );

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="Return to Practice"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4"
              aria-hidden="true"
            />
            Practice
          </button>
          <span className="text-sm font-medium text-foreground">Results</span>
          <div className="w-16" aria-hidden="true" />
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8"
      >
        {/* Timeout notice */}
        {timedOut && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
          >
            <HugeiconsIcon
              icon={Alert02Icon}
              className="size-4 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p>Your session was automatically submitted when time ran out.</p>
          </div>
        )}

        {/* Score ring + headline */}
        <section
          aria-labelledby="score-heading"
          className="text-center space-y-4"
        >
          <ScoreRing percentage={summary.overallPercentage} />
          <div>
            <h1
              id="score-heading"
              className="text-xl font-heading font-semibold text-foreground"
            >
              {summary.overallPercentage >= 70
                ? "Well done!"
                : summary.overallPercentage >= 50
                  ? "Good effort"
                  : "Keep practising"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              You got{" "}
              <strong className="text-foreground">
                {summary.totalCorrect} of {summary.totalQuestions}
              </strong>{" "}
              questions correct.
            </p>
          </div>
        </section>

        {/* Stat strip */}
        <section
          aria-label="Score breakdown"
          className="grid grid-cols-3 gap-3"
        >
          {(
            [
              {
                label: "Correct",
                value: summary.totalCorrect,
                status: "correct" as AnswerStatus,
              },
              {
                label: "Incorrect",
                value: summary.totalIncorrect,
                status: "incorrect" as AnswerStatus,
              },
              {
                label: "Unanswered",
                value: summary.totalUnanswered,
                status: "unanswered" as AnswerStatus,
              },
            ] as const
          ).map(({ label, value, status }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-4"
            >
              <StatusIcon status={status} className="size-5" />
              <span className="text-xl font-bold tabular-nums text-foreground">
                {value}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </section>

        {/* Per-subject breakdown */}
        {summary.subjects.length > 1 && (
          <section aria-labelledby="subjects-heading">
            <h2
              id="subjects-heading"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3"
            >
              By subject
            </h2>
            <div className="space-y-2">
              {summary.subjects.map((sub) => (
                <div
                  key={sub.subjectCode}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sub.subjectName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.correct}/{sub.total} correct
                    </p>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-20 shrink-0">
                    <div
                      className="h-1.5 rounded-full bg-muted overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground text-right mt-0.5">
                      {sub.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button size="lg" className="w-full rounded-xl" onClick={onReview}>
            <HugeiconsIcon
              icon={ViewIcon}
              className="size-4 mr-2"
              aria-hidden="true"
            />
            Review Answers
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl"
            onClick={onExit}
          >
            <HugeiconsIcon
              icon={BookOpen01Icon}
              className="size-4 mr-2"
              aria-hidden="true"
            />
            Back to Practice
          </Button>
        </div>
      </main>
    </div>
  );
}

// ─── Review option row ─────────────────────────────────────────────────────

function ReviewOption({
  option,
  status,
  isSelected,
  isCorrect,
}: {
  option: PracticeQuestion["options"][number];
  status: AnswerStatus;
  isSelected: boolean;
  isCorrect: boolean;
}) {
  const isHighlighted = isSelected || isCorrect;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-colors",
        isSelected && status === "correct" && "border-success/50 bg-success/5",
        isSelected &&
          status === "incorrect" &&
          "border-destructive/50 bg-destructive/5",
        isCorrect && !isSelected && "border-success/50 bg-success/5",
        !isHighlighted && "border-border bg-card",
      )}
    >
      {/* Label badge */}
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold mt-px",
          isSelected && status === "correct" && "bg-success text-white",
          isSelected && status === "incorrect" && "bg-destructive text-white",
          isCorrect && !isSelected && "bg-success text-white",
          !isHighlighted && "bg-muted text-muted-foreground",
        )}
      >
        {option.label}
      </span>

      {/* Text */}
      <span
        className={cn(
          "flex-1 leading-relaxed",
          isHighlighted
            ? "text-foreground font-medium"
            : "text-muted-foreground",
        )}
      >
        {option.text}
      </span>

      {/* Icon */}
      {isSelected && (
        <StatusIcon status={status} className="size-4 mt-0.5 shrink-0" />
      )}
      {isCorrect && !isSelected && (
        <HugeiconsIcon
          icon={CheckmarkCircle01Icon}
          className="size-4 mt-0.5 shrink-0 text-success"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ─── Review question card ──────────────────────────────────────────────────

function ReviewQuestionCard({
  question,
  index,
  answers,
}: {
  question: PracticeQuestion;
  index: number;
  answers: Record<string, string>;
}) {
  const status = getAnswerStatus(question, answers);
  const selectedOptionId = answers[question.id];

  const statusLabel =
    status === "correct"
      ? "Correct"
      : status === "incorrect"
        ? "Incorrect"
        : "Unanswered";

  return (
    <article
      aria-label={`Question ${index + 1}: ${statusLabel}`}
      className="border border-border rounded-2xl overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground mt-0.5 tabular-nums shrink-0">
          Q{index + 1}
        </span>
        <span className="flex-1 text-xs text-muted-foreground">
          {question.subject}
        </span>
        <span
          className={cn(
            "shrink-0 flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
            status === "correct" && "text-success bg-success/10",
            status === "incorrect" && "text-destructive bg-destructive/10",
            status === "unanswered" && "text-muted-foreground bg-muted",
          )}
        >
          <StatusIcon status={status} className="size-3" />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Question text */}
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-foreground">
          {question.text}
        </p>
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === question.correctOptionId;

          // Show only relevant options:
          // - The student's selected answer (if any)
          // - The correct answer (always)
          // - All options when both match (correct selection)
          const shouldShow =
            status === "correct"
              ? isSelected // only show selected (which is correct)
              : isSelected || isCorrect;

          if (!shouldShow) return null;

          return (
            <ReviewOption
              key={option.id}
              option={option}
              status={status}
              isSelected={isSelected}
              isCorrect={isCorrect}
            />
          );
        })}

        {/* Unanswered: show the correct answer with an explanation label */}
        {status === "unanswered" && (
          <p className="text-xs text-muted-foreground mt-2">
            No answer was selected.
          </p>
        )}
      </div>
    </article>
  );
}

// ─── Review view ──────────────────────────────────────────────────────────

function ReviewView({ onBack }: { onBack: () => void }) {
  const { questions, answers } = useExamStore();

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="Back to Results summary"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4"
              aria-hidden="true"
            />
            Results
          </button>
          <span className="text-sm font-medium text-foreground">Review</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {questions.length} questions
          </span>
        </div>
      </header>

      <main
        id="review-content"
        className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4"
      >
        <p className="text-xs text-muted-foreground">
          Showing your answer and the correct answer for each question.
        </p>
        {questions.map((q, i) => (
          <ReviewQuestionCard
            key={q.id}
            question={q}
            index={i}
            answers={answers}
          />
        ))}

        <div className="pt-4 pb-8">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl"
            onClick={onBack}
          >
            Back to Results
          </Button>
        </div>
      </main>
    </div>
  );
}

// ─── Results page ─────────────────────────────────────────────────────────

export default function PracticeResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<"summary" | "review">("summary");

  const { questions, resetExam } = useExamStore();
  const timedOut =
    (location.state as { timedOut?: boolean } | null)?.timedOut ?? false;

  // Guard: if the store has no questions the student navigated here directly
  // (e.g. refreshed). Send them back to Practice setup.
  useEffect(() => {
    if (questions.length === 0) {
      navigate("/practice", { replace: true });
    }
  }, []);

  const handleExit = () => {
    resetExam();
    navigate("/practice");
  };

  if (view === "review") {
    return <ReviewView onBack={() => setView("summary")} />;
  }

  return (
    <SummaryView
      timedOut={timedOut}
      onReview={() => setView("review")}
      onExit={handleExit}
    />
  );
}
