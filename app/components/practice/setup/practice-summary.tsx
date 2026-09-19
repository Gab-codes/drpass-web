import type { ReactNode } from "react";

import type { PracticeSummaryData } from "@/types/practice";

interface PracticeSummaryProps {
  /** `panel` is the sticky desktop summary, `bar` the compact mobile action bar. */
  variant: "panel" | "bar";
  summary: PracticeSummaryData;
  /** Client-side validation message, or `null` when the setup can start. */
  error: string | null;
  /** The start action (a `PracticeConfirmation` trigger). */
  action: ReactNode;
}

/**
 * Presents a summary. Both presentations read the same derived data and only
 * differ in layout, so there is no second copy of the summary logic.
 */
export function PracticeSummary({
  variant,
  summary,
  error,
  action,
}: PracticeSummaryProps) {
  const { subjects, totalQuestions, totalTimeMinutes, timeMode } = summary;

  if (variant === "bar") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium tabular-nums text-foreground">
              {totalQuestions} questions
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {totalTimeMinutes} min{timeMode === "custom" ? " (custom)" : ""} ·{" "}
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
            </p>
          </div>
          {error && (
            <p role="status" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {action}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="practice-summary-heading"
      className="sticky top-24 hidden rounded-3xl border border-border/60 bg-surface-2 p-5 shadow-sm md:block"
    >
      <h2
        id="practice-summary-heading"
        className="text-lg font-medium text-foreground"
      >
        Summary
      </h2>

      <dl className="mt-4 text-sm">
        <div className="flex items-center justify-between border-b border-border/60 py-3">
          <dt className="text-muted-foreground">Selected subjects</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {subjects.length}
          </dd>
        </div>
        <div className="flex items-center justify-between border-b border-border/60 py-3">
          <dt className="text-muted-foreground">Total questions</dt>
          <dd className="text-lg font-medium tabular-nums text-foreground">
            {totalQuestions}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted-foreground">Time limit</dt>
          <dd className="text-lg font-medium tabular-nums text-foreground">
            {totalTimeMinutes} min
          </dd>
        </div>
      </dl>

      {timeMode === "custom" && (
        <p className="text-xs text-muted-foreground">
          Custom time · suggested {summary.suggestedTimeMinutes} min
        </p>
      )}

      {error && (
        <p role="status" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4">{action}</div>
    </section>
  );
}