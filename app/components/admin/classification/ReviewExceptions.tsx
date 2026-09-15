import * as React from "react";
import { Button } from "@/components/ui/button";
import { ExceptionsPanel } from "@/components/admin/classification/ExceptionsPanel";
import type { AiClassificationJobResults } from "@/types/questions";

/**
 * "What needs attention?" card — summarises the counts that require admin
 * attention and lazily mounts the exceptions panel (its query only runs once
 * the admin opens it).
 *
 * Renders nothing when the job has no exceptions.
 */
export function ReviewExceptions({
  jobId,
  results,
}: {
  jobId: string;
  results: AiClassificationJobResults;
}) {
  const [showExceptions, setShowExceptions] = React.useState(false);

  // Failed questions (no AI suggestion), needs-review suggestions, and
  // low-confidence suggestions all require admin attention.
  const totalExceptions =
    results.failed + results.needsReview + results.confidence.low;

  if (totalExceptions <= 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Review Exceptions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {results.failed > 0 && (
              <>
                {results.failed} question
                {results.failed !== 1 ? "s" : ""} failed (no AI suggestion)
                {" · "}
              </>
            )}
            {results.needsReview > 0 &&
              `${results.needsReview} question${
                results.needsReview !== 1 ? "s" : ""
              } need manual review`}
            {results.needsReview > 0 && results.confidence.low > 0 ? " · " : ""}
            {results.confidence.low > 0 &&
              `${results.confidence.low} low-confidence suggestion${
                results.confidence.low !== 1 ? "s" : ""
              }`}
            .
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExceptions((v) => !v)}
        >
          {showExceptions ? "Hide Exceptions" : "Review Exceptions"}
        </Button>
      </div>

      {showExceptions && <ExceptionsPanel jobId={jobId} />}
    </div>
  );
}