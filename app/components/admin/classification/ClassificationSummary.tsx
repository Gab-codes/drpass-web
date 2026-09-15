import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Refresh } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/admin/classification/JobStatusBadge";
import { SummaryCell } from "@/components/admin/classification/SummaryCell";
import type {
  AiClassificationJob,
  AiClassificationJobResults,
} from "@/types/questions";

/**
 * "What was classified?" card — job outcome counters, the partial-job warning
 * and the retry-failed action.
 */
export function ClassificationSummary({
  job,
  results,
  onRetryFailed,
  isRetryingFailed,
}: {
  job: AiClassificationJob;
  results: AiClassificationJobResults;
  onRetryFailed: () => void;
  isRetryingFailed: boolean;
}) {
  const totalSuggested = results.suggested + results.accepted;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Classification Summary</h2>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryCell label="In Scope" value={results.total} />
        <SummaryCell
          label="AI Suggestions"
          value={totalSuggested}
          note="pending your review"
          highlight="info"
        />
        <SummaryCell
          label="Accepted"
          value={results.accepted}
          note="canonical"
          highlight="success"
        />
        <SummaryCell
          label="Needs Review"
          value={results.needsReview}
          note="low confidence"
          highlight="warning"
        />
        <SummaryCell
          label="Failed"
          value={results.failed}
          note={results.failed > 0 ? "no AI suggestion" : undefined}
          highlight={results.failed > 0 ? "destructive" : undefined}
        />
        <SummaryCell label="Skipped" value={results.skipped} />
      </div>

      {job.status === "partial" && (
        <Alert className="border-warning/40 bg-warning-muted text-warning text-xs">
          <HugeiconsIcon icon={Alert02Icon} className="h-3.5 w-3.5" />
          <div className="space-y-2">
            <p>
              This job finished, but {results.failed} question
              {results.failed !== 1 ? "s" : ""} could not be classified.
              Suggestions above are still valid and can be accepted; failed
              questions are listed under exceptions.
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryFailed}
                disabled={isRetryingFailed}
                className="gap-2"
              >
                <HugeiconsIcon icon={Refresh} className="h-3.5 w-3.5" />
                {isRetryingFailed ? "Retrying…" : "Retry Failed Questions"}
              </Button>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}