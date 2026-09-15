import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import {
  aiClassificationKeys,
  getClassificationJobExceptions,
} from "@/api/ai-classification";
import { getApiErrorMessage } from "@/lib/api-error";
import { QuestionDialog } from "@/components/admin/questions/QuestionDialog";
import type {
  AdminQuestion,
  AiJobExceptionItem,
  ExceptionFilter,
} from "@/types/questions";

/**
 * Backend diagnostic categories → readable labels. The backend may add new
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

/**
 * A single exception row: question, confidence, reason/category detail and the
 * Review action that opens the existing QuestionDialog.
 */
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

const EXCEPTION_FILTERS: { value: ExceptionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "failed", label: "Failed" },
  { value: "needs_review", label: "Needs Review" },
  { value: "low_confidence", label: "Low Confidence" },
];

/**
 * Lazily-loaded, job-scoped exception list: filter tabs, table, pagination and
 * the correction dialog. Mounted only when the admin opens Review Exceptions,
 * so its query never runs on page load.
 */
export function ExceptionsPanel({ jobId }: { jobId: string }) {
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