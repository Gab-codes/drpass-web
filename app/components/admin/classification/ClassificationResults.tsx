import { ClassificationSummary } from "@/components/admin/classification/ClassificationSummary";
import { ConfidenceBreakdown } from "@/components/admin/classification/ConfidenceBreakdown";
import { AcceptSuggestions } from "@/components/admin/classification/AcceptSuggestions";
import { ReviewExceptions } from "@/components/admin/classification/ReviewExceptions";
import type {
  AiClassificationJob,
  AiClassificationJobResults,
} from "@/types/questions";

/**
 * Completed / partial job view.
 *
 * Composes the four decision surfaces in order:
 *   1. what was classified        → ClassificationSummary (+ retry failed)
 *   2. confidence distribution    → ConfidenceBreakdown
 *   3. what can I safely accept?  → AcceptSuggestions
 *   4. what needs attention?      → ReviewExceptions (lazy panel)
 *
 * Presentational only: mutations, refetching and navigation live in the route.
 */
export function ClassificationResults({
  job,
  results,
  onAcceptAll,
  onAcceptThreshold,
  isAcceptingAll,
  isAcceptingThreshold,
  onRetryFailed,
  isRetryingFailed,
}: {
  job: AiClassificationJob;
  results: AiClassificationJobResults;
  onAcceptAll: () => void;
  onAcceptThreshold: (minConfidence: number) => void;
  isAcceptingAll: boolean;
  isAcceptingThreshold: boolean;
  onRetryFailed: () => void;
  isRetryingFailed: boolean;
}) {
  return (
    <div className="space-y-5">
      <ClassificationSummary
        job={job}
        results={results}
        onRetryFailed={onRetryFailed}
        isRetryingFailed={isRetryingFailed}
      />
      <ConfidenceBreakdown confidence={results.confidence} />
      <AcceptSuggestions
        results={results}
        onAcceptAll={onAcceptAll}
        onAcceptThreshold={onAcceptThreshold}
        isAcceptingAll={isAcceptingAll}
        isAcceptingThreshold={isAcceptingThreshold}
      />
      <ReviewExceptions jobId={job.id} results={results} />
    </div>
  );
}