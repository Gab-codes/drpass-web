import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, ArrowLeft01Icon, ViewIcon, BookOpen01Icon } from "@hugeicons/core-free-icons";

import { useExamStore } from "@/store/exam-store";
import { calculatePracticeResults } from "@/lib/practice-results";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "./score-ring";
import { ResultStats } from "./result-stats";
import { SubjectBreakdown } from "./subject-breakdown";

/**
 * Results summary view: score ring, stat strip, subject breakdown and actions.
 * Reads the exam session snapshot from the exam store, matching the
 * convention used by other exam feature components (e.g. SubmitDialog).
 */
export function ResultsSummary({
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

        <ResultStats summary={summary} />

        <SubjectBreakdown subjects={summary.subjects} />

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