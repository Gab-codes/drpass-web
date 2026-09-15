/**
 * Topic Classification Job Page
 * Route: /admin/questions/classification/:jobId
 *
 * Orchestrates four states based on job.status:
 *   queued / processing  → ClassificationProgress (polling)
 *   completed / partial  → ClassificationResults (fetch results, accept actions)
 *   failed / cancelled   → ClassificationFailed (retry / new job)
 *
 * Exceptions are loaded LAZILY — only when the admin explicitly opens
 * the Review Exceptions panel.
 */

import * as React from "react";
import { useParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Refresh,
  Tag01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  aiClassificationKeys,
  cancelClassificationJob,
  getClassificationJob,
  getClassificationJobExceptions,
  getClassificationJobResults,
  acceptAllClassifications,
  acceptThresholdClassifications,
  retryFailedClassification,
} from "@/api/ai-classification";
import { getApiErrorMessage } from "@/lib/api-error";
import { questionKeys } from "@/api/questions";
import {
  QuestionDialog,
  adminQuestionToFormValues,
} from "@/components/admin/questions/QuestionDialog";
import type {
  AiClassificationJob,
  AiClassificationJobResults,
  AiJobExceptionItem,
  AiJobExceptionsResult,
  ExceptionFilter,
  AdminQuestion,
} from "@/types/questions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(["queued", "processing"]);
const TERMINAL_STATUSES = new Set([
  "completed",
  "partial",
  "failed",
  "cancelled",
]);

function pct(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

/**
 * Compute how many suggestions would be accepted at a given threshold
 * from the confidence distribution returned by getJobResults.
 * The backend buckets are: high >= 0.9, medium 0.8–0.89, low < 0.8.
 * We use these to approximate the preview count without a network call.
 */
function estimateAboveThreshold(
  confidence: AiClassificationJobResults["confidence"],
  threshold: number, // 0..1
): number {
  if (threshold < 0.8)
    return confidence.high + confidence.medium + confidence.low;
  if (threshold < 0.9) return confidence.high + confidence.medium;
  return confidence.high;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function JobStatusBadge({ status }: { status: AiClassificationJob["status"] }) {
  const cfg = {
    queued: { label: "Queued", cls: "bg-muted text-muted-foreground" },
    processing: { label: "Processing", cls: "bg-info/15 text-info" },
    completed: { label: "Completed", cls: "bg-success-muted text-success" },
    partial: { label: "Partial", cls: "bg-warning-muted text-warning" },
    failed: { label: "Failed", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  }[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Progress View ────────────────────────────────────────────────────────────

function ClassificationProgress({
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

// ─── Results View ─────────────────────────────────────────────────────────────

function ClassificationResults({
  job,
  results,
  onAccepted,
  onRetryFailed,
  isRetryingFailed,
}: {
  job: AiClassificationJob;
  results: AiClassificationJobResults;
  onAccepted: () => void;
  onRetryFailed: () => void;
  isRetryingFailed: boolean;
}) {
  // Threshold: 0–100 integer for display, converted to 0..1 for API
  const [threshold, setThreshold] = React.useState(80);
  const [showExceptions, setShowExceptions] = React.useState(false);

  const thresholdFraction = threshold / 100;
  const previewCount = estimateAboveThreshold(
    results.confidence,
    thresholdFraction,
  );

  // Failed questions (no AI suggestion), needs-review suggestions, and
  // low-confidence suggestions all require admin attention.
  const totalExceptions =
    results.failed + results.needsReview + results.confidence.low;

  const acceptAll = useMutation({
    mutationFn: () => acceptAllClassifications(job.id),
    onSuccess: (data) => {
      toast.success(
        `${data.accepted} classification${data.accepted !== 1 ? "s" : ""} accepted`,
      );
      onAccepted();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to accept classifications"));
    },
  });

  const acceptThreshold = useMutation({
    mutationFn: () => acceptThresholdClassifications(job.id, thresholdFraction),
    onSuccess: (data) => {
      toast.success(
        `${data.accepted} classification${data.accepted !== 1 ? "s" : ""} accepted`,
      );
      onAccepted();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to accept classifications"));
    },
  });

  const isBusy = acceptAll.isPending || acceptThreshold.isPending;
  const totalSuggested = results.suggested + results.accepted;
  const totalConfidenceCounts =
    results.confidence.high +
    results.confidence.medium +
    results.confidence.low;

  return (
    <div className="space-y-5">
      {/* ── Decision 1: What was classified? ───────────────────────── */}
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

      {/* ── Decision 2: Confidence distribution ────────────────────── */}
      {totalConfidenceCounts > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Confidence Distribution</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              These are AI suggestion scores — not official classifications. No
              topic is assigned until you accept below.
            </p>
          </div>

          <div className="space-y-2.5">
            <ConfidenceRow
              label="High (≥ 90%)"
              count={results.confidence.high}
              total={totalConfidenceCounts}
              colorClass="bg-success"
            />
            <ConfidenceRow
              label="Medium (80–89%)"
              count={results.confidence.medium}
              total={totalConfidenceCounts}
              colorClass="bg-info"
            />
            <ConfidenceRow
              label="Low (< 80%)"
              count={results.confidence.low}
              total={totalConfidenceCounts}
              colorClass="bg-warning"
            />
          </div>
        </div>
      )}

      {/* ── Decision 3: What can I safely accept? ──────────────────── */}
      {results.suggested > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Accept Suggestions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accepting converts AI suggestions into{" "}
              <strong>official canonical classifications</strong>. This action
              is recorded under your account.
            </p>
          </div>

          {/* Threshold slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidence-threshold" className="text-sm">
                Minimum Confidence Threshold
              </Label>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {threshold}%
              </span>
            </div>
            <input
              id="confidence-threshold"
              type="range"
              min={0}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% (all)</span>
              <span>100% (only exact)</span>
            </div>
            <p className="text-sm text-center rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">
              {previewCount} suggestion{previewCount !== 1 ? "s" : ""} will be
              accepted at ≥{threshold}% confidence
            </p>
          </div>

          {/* Accept actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => acceptAll.mutate()}
              disabled={isBusy}
              className="gap-2"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
              {acceptAll.isPending ? "Accepting…" : "Accept All Suggestions"}
            </Button>
            <Button
              size="sm"
              onClick={() => acceptThreshold.mutate()}
              disabled={isBusy || previewCount === 0}
              className="gap-2"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
              {acceptThreshold.isPending
                ? "Accepting…"
                : `Accept ≥ ${threshold}%`}
            </Button>
          </div>
        </div>
      )}

      {/* ── Decision 4: What needs attention? ──────────────────────── */}
      {totalExceptions > 0 && (
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
                {results.needsReview > 0 && results.confidence.low > 0
                  ? " · "
                  : ""}
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

          {showExceptions && <ExceptionPanel jobId={job.id} />}
        </div>
      )}
    </div>
  );
}

// ─── Failed / Cancelled View ──────────────────────────────────────────────────

function ClassificationFailed({
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

// ─── Exception Panel (lazy) ───────────────────────────────────────────────────

const EXCEPTION_FILTERS: { value: ExceptionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "failed", label: "Failed" },
  { value: "needs_review", label: "Needs Review" },
  { value: "low_confidence", label: "Low Confidence" },
];

/**
 * Backend diagnostic categories → readable labels. Backend may add new
 * categories at any time, so this is a best-effort mapping with a readable
 * fallback (raw category humanized) — never a closed enum.
 */
const FAILURE_CATEGORY_LABELS: Record<string, string> = {
  provider_credential: "Provider credential error",
  provider_rate_limit: "Rate limited",
  provider_server: "Provider unavailable",
  model_config: "Model/configuration error",
  timeout_network: "Network/timeout error",
  classification_validation: "Classification validation error",
  unexpected: "Unexpected error",
  no_active_concepts: "No active concepts",
  database: "Database error",
};

function failureCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Failed";
  return (
    FAILURE_CATEGORY_LABELS[category] ??
    category.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

function ExceptionPanel({ jobId }: { jobId: string }) {
  const [filter, setFilter] = React.useState<ExceptionFilter>("all");
  const [page, setPage] = React.useState(1);
  const [reviewQuestion, setReviewQuestion] =
    React.useState<AdminQuestion | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: aiClassificationKeys.exceptions(jobId, { filter, page }),
    queryFn: () =>
      getClassificationJobExceptions(jobId, { filter, page, limit: 25 }),
  });

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {EXCEPTION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-muted/40"
            />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive" className="text-sm">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(error, "Failed to load exceptions")}
        </Alert>
      )}

      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No exceptions found for the selected filter.
        </p>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Question
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Confidence
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Reason
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <ExceptionRow
                    key={item.questionId}
                    item={item}
                    onReview={(q) => setReviewQuestion(q)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.total > data.limit && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {(page - 1) * data.limit + 1}–
                {Math.min(page * data.limit, data.total)} of {data.total}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * data.limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Exception correction via existing QuestionDialog */}
      {reviewQuestion && (
        <QuestionDialog
          mode="edit"
          question={reviewQuestion}
          open={!!reviewQuestion}
          onClose={() => setReviewQuestion(null)}
          onSaved={() => setReviewQuestion(null)}
        />
      )}
    </div>
  );
}

function ExceptionRow({
  item,
  onReview,
}: {
  item: AiJobExceptionItem;
  onReview: (q: AdminQuestion) => void;
}) {
  const reasonLabels: Record<string, string> = {
    failed: "Failed",
    needs_review: "Needs Review",
    low_confidence: "Low Confidence",
  };

  const reasonColors: Record<string, string> = {
    failed: "text-destructive bg-destructive/10",
    needs_review: "text-warning bg-warning-muted",
    low_confidence: "text-muted-foreground bg-muted",
  };

  const isFailed = item.reason === "failed";
  const detail = isFailed
    ? (item.failureReason ?? item.failureCategory ?? null)
    : null;

  // Build a minimal AdminQuestion stub for the QuestionDialog
  function openReview() {
    // We only have partial data; open the dialog with what we have.
    // The dialog will use the existing form with the question text loaded.
    // Since we don't have all fields here, we create a minimal stub.
    // The admin can edit fields they need to correct.
    const stub: AdminQuestion = {
      id: item.questionId,
      subject: item.subject,
      text: item.questionText,
      year: new Date().getFullYear(),
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      status: "approved",
      isActive: false,
      importId: null,
      textHash: "",
      createdBy: null,
      updatedBy: null,
      reviewedBy: null,
      createdAt: "",
      updatedAt: "",
      classification: null,
    };
    onReview(stub);
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm line-clamp-2 text-foreground">
          {item.questionText}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.subject}</p>
      </td>
      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
        {item.confidence !== null
          ? `${Math.round(item.confidence * 100)}%`
          : isFailed
            ? "— no AI suggestion"
            : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              reasonColors[item.reason] ?? "text-muted-foreground bg-muted"
            }`}
          >
            {isFailed
              ? failureCategoryLabel(item.failureCategory)
              : (reasonLabels[item.reason] ?? item.reason)}
          </span>
          {detail && (
            <p
              className="text-[11px] text-muted-foreground max-w-xs wrap-break-words"
              title={detail}
            >
              {detail}
            </p>
          )}
          {item.reason === "low_confidence" && (
            <p className="text-[11px] text-muted-foreground">
              AI suggestion — not yet the canonical classification
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="outline" onClick={openReview}>
          Review
        </Button>
      </td>
    </tr>
  );
}

// ─── Small reusable sub-components ────────────────────────────────────────────

function SummaryCell({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: number;
  note?: string;
  highlight?: "success" | "info" | "warning" | "destructive";
}) {
  const numColor =
    highlight === "success"
      ? "text-success"
      : highlight === "info"
        ? "text-info"
        : highlight === "warning"
          ? "text-warning"
          : highlight === "destructive"
            ? "text-destructive"
            : "text-foreground";

  return (
    <div className="rounded-lg bg-muted/30 px-3 py-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${numColor}`}>{value}</p>
      {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
    </div>
  );
}

function ConfidenceRow({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const widthPct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-8 text-right">
        {count}
      </span>
    </div>
  );
}

// ─── Page Orchestrator ────────────────────────────────────────────────────────

export default function ClassificationJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();

  if (!jobId) {
    return (
      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
        Invalid job ID.
      </Alert>
    );
  }

  const {
    data: job,
    isLoading: jobLoading,
    isError: jobError,
    error: jobErr,
  } = useQuery({
    queryKey: aiClassificationKeys.job(jobId),
    queryFn: () => getClassificationJob(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || jobErr || TERMINAL_STATUSES.has(status)) return false;
      return 10000;
    },
    refetchOnWindowFocus: false,
  });

  // When job transitions to terminal, fetch results immediately
  const jobStatus = job?.status;
  const shouldFetchResults =
    jobStatus === "completed" || jobStatus === "partial";

  const {
    data: results,
    isLoading: resultsLoading,
    refetch: refetchResults,
  } = useQuery({
    queryKey: aiClassificationKeys.results(jobId),
    queryFn: () => getClassificationJobResults(jobId),
    enabled: shouldFetchResults,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  const cancelJob = useMutation({
    mutationFn: () => cancelClassificationJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiClassificationKeys.job(jobId),
      });
      toast.info("Job cancelled");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to cancel job"));
    },
  });

  const retryJob = useMutation({
    mutationFn: () => retryFailedClassification(jobId),
    onSuccess: (newJob) => {
      toast.success("Retry job started");
      // Navigate to new job
      window.location.href = `/admin/questions/classification/${newJob.id}`;
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to retry job"));
    },
  });

  function handleAccepted() {
    refetchResults();
    queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/admin/questions/classification" />}
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
          Classification
        </Button>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
          <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">
            {job?.subject
              ? `${job.subject} — Classification Job`
              : "Classification Job"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
            {jobId}
          </p>
        </div>
      </div>

      <Separator />

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {jobLoading && (
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-muted/40"
            />
          ))}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {jobError && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(jobErr, "Could not load classification job")}
        </Alert>
      )}

      {/* ── Active: processing / queued ──────────────────────────────── */}
      {job && ACTIVE_STATUSES.has(job.status) && (
        <ClassificationProgress
          job={job}
          onCancel={() => cancelJob.mutate()}
          isCancelling={cancelJob.isPending}
        />
      )}

      {/* ── Terminal: completed / partial → show results ─────────────── */}
      {job && shouldFetchResults && (
        <>
          {resultsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="h-4 w-4 animate-spin"
              />
              Loading results…
            </div>
          )}
          {results && (
            <ClassificationResults
              job={job}
              results={results}
              onAccepted={handleAccepted}
              onRetryFailed={() => retryJob.mutate()}
              isRetryingFailed={retryJob.isPending}
            />
          )}
        </>
      )}

      {/* ── Terminal: failed / cancelled ─────────────────────────────── */}
      {job && (job.status === "failed" || job.status === "cancelled") && (
        <ClassificationFailed
          job={job}
          onRetry={() => retryJob.mutate()}
          isRetrying={retryJob.isPending}
        />
      )}
    </div>
  );
}
