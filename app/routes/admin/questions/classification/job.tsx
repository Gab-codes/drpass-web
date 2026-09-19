/**
 * Topic Classification Job Page
 * Route: /admin/questions/classification/:jobId
 *
 * Route-level orchestration only: reads the job id from the route, owns the
 * job + results queries (and polling), wires the four job mutations
 * (cancel, retry-failed, accept-all, accept-threshold), and composes the page
 * from the focused components in `components/admin/classification`.
 *
 * States based on job.status:
 *   queued / processing  → ClassificationProgress (polling)
 *   completed / partial  → ClassificationResults (results + accept actions)
 *   failed / cancelled   → ClassificationFailed (retry / new job)
 *
 * Exceptions are loaded LAZILY by ExceptionsPanel — they mount only when the
 * admin opens the Review Exceptions panel.
 */

import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  aiClassificationKeys,
  acceptAllClassifications,
  acceptThresholdClassifications,
  cancelClassificationJob,
  getClassificationJob,
  getClassificationJobResults,
  retryFailedClassification,
} from "@/api/ai-classification";
import { getApiErrorMessage } from "@/lib/api-error";
import { questionKeys } from "@/api/admin-questions";
import { JobPageHeader } from "@/components/admin/classification/JobPageHeader";
import { ClassificationProgress } from "@/components/admin/classification/ClassificationProgress";
import { ClassificationResults } from "@/components/admin/classification/ClassificationResults";
import { ClassificationFailed } from "@/components/admin/classification/ClassificationFailed";

const ACTIVE_STATUSES = new Set(["queued", "processing"]);
const TERMINAL_STATUSES = new Set([
  "completed",
  "partial",
  "failed",
  "cancelled",
]);

export default function ClassificationJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
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
      return 5000;
    },
    refetchOnWindowFocus: false,
  });

  // When the job transitions to terminal, fetch results immediately.
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
      // The retry creates a NEW job: navigate to it client-side. Never
      // window.location here — that reloads the whole browser page.
      navigate(`/admin/questions/classification/${newJob.id}`);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to retry job"));
    },
  });

  const acceptAll = useMutation({
    mutationFn: () => acceptAllClassifications(jobId),
    onSuccess: (data) => {
      toast.success(
        `${data.accepted} classification${data.accepted !== 1 ? "s" : ""} accepted`,
      );
      handleAccepted();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to accept classifications"));
    },
  });

  const acceptThreshold = useMutation({
    mutationFn: (minConfidence: number) =>
      acceptThresholdClassifications(jobId, minConfidence),
    onSuccess: (data) => {
      toast.success(
        `${data.accepted} classification${data.accepted !== 1 ? "s" : ""} accepted`,
      );
      handleAccepted();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to accept classifications"));
    },
  });

  function handleAccepted() {
    refetchResults();
    queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-4">
      <JobPageHeader jobId={jobId} subject={job?.subject} />

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
              onAcceptAll={() => acceptAll.mutate()}
              onAcceptThreshold={(minConfidence) =>
                acceptThreshold.mutate(minConfidence)
              }
              isAcceptingAll={acceptAll.isPending}
              isAcceptingThreshold={acceptThreshold.isPending}
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
