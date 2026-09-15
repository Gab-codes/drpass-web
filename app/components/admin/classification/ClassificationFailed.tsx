import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Cancel01Icon,
  Refresh,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/admin/classification/JobStatusBadge";
import { SummaryCell } from "@/components/admin/classification/SummaryCell";
import type { AiClassificationJob } from "@/types/questions";

/**
 * Failed / cancelled job view: explains the outcome, keeps the outcome counters
 * and the server-provided error visible, and offers retry / new-job actions.
 *
 * Presentational — the retry mutation and its navigation live in the route.
 */
export function ClassificationFailed({
  job,
  onRetry,
  isRetrying,
}: {
  job: AiClassificationJob;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const isCancelled = job.status === "cancelled";

  return (
    <div
      className={`rounded-xl border p-6 space-y-4 ${
        isCancelled
          ? "border-border bg-card"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <HugeiconsIcon
            icon={isCancelled ? Cancel01Icon : AlertCircleIcon}
            className={`h-5 w-5 mt-0.5 shrink-0 ${
              isCancelled ? "text-muted-foreground" : "text-destructive"
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                isCancelled ? "text-foreground" : "text-destructive"
              }`}
            >
              {isCancelled
                ? "Classification job was cancelled"
                : "Classification job failed"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isCancelled
                ? "The job was stopped before all questions were processed. Start a new job to classify the remaining questions."
                : "No questions could be classified. Review the error below, then retry."}
            </p>
          </div>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      {/* Outcome counters — preserved for cancelled jobs too */}
      {(job.total > 0 || job.processed > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCell label="Processed" value={job.processed} />
          <SummaryCell label="Total" value={job.total} />
          <SummaryCell
            label="Succeeded"
            value={job.succeeded}
            highlight={job.succeeded > 0 ? "success" : undefined}
          />
          <SummaryCell
            label="Failed"
            value={job.failed}
            highlight={job.failed > 0 ? "destructive" : undefined}
          />
        </div>
      )}

      {job.error && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">Error</p>
          <p className="text-xs text-foreground mt-1 wrap-break-words">
            {job.error}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Check the provider configuration and credentials, then retry. The
            message above is provided by the server and never contains secrets.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isCancelled && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <HugeiconsIcon icon={Refresh} className="h-3.5 w-3.5" />
            {isRetrying ? "Retrying…" : "Retry Failed Questions"}
          </Button>
        )}
        <Button
          size="sm"
          render={<Link to="/admin/questions/classification" />}
          className="gap-2"
        >
          <HugeiconsIcon icon={Tag01Icon} className="h-3.5 w-3.5" />
          Start New Job
        </Button>
      </div>
    </div>
  );
}