import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { JobStatusBadge } from "@/components/admin/classification/JobStatusBadge";
import type { AiClassificationJob } from "@/types/questions";

function pct(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

/**
 * Active job view (queued / processing): progress bar, live outcome counters,
 * the "failures so far" warning and the cancel action.
 *
 * Purely presentational — polling and the cancel mutation live in the route.
 */
export function ClassificationProgress({
  job,
  onCancel,
  isCancelling,
}: {
  job: AiClassificationJob;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const progressPct = pct(job.processed, job.total);

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border border-border bg-card p-6 space-y-5"
        aria-live="polite"
        aria-label="Classification job progress"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">AI is classifying questions…</p>
          <JobStatusBadge status={job.status} />
        </div>

        <div className="space-y-2">
          <Progress value={progressPct} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {job.processed} of {job.total} processed
            </span>
            <span>{progressPct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Succeeded</p>
            <p className="text-xl font-semibold mt-1">{job.succeeded}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p
              className={`text-xl font-semibold mt-1 ${
                job.failed > 0 ? "text-destructive" : ""
              }`}
            >
              {job.failed}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Skipped</p>
            <p className="text-xl font-semibold mt-1">{job.skipped}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-xl font-semibold mt-1">
              {Math.max(0, job.total - job.processed)}
            </p>
          </div>
        </div>

        {job.failed > 0 && (
          <Alert className="border-warning/40 bg-warning-muted text-warning text-xs">
            <HugeiconsIcon icon={Alert02Icon} className="h-3.5 w-3.5" />
            {job.failed} question{job.failed !== 1 ? "s have" : " has"} failed
            so far. The job is still processing — failed questions can be
            retried or reviewed once it finishes.
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          This page will update automatically. You can leave and come back.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isCancelling || job.status === "cancelled"}
          className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/5"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
          {isCancelling ? "Cancelling…" : "Cancel Job"}
        </Button>
      </div>
    </div>
  );
}