import * as React from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  InboxIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  aiClassificationKeys,
  listClassificationJobs,
} from "@/api/ai-classification";
import { getApiErrorMessage } from "@/lib/api-error";
import { ClassificationHistoryFilters } from "@/components/admin/classification/ClassificationHistoryFilters";
import { ClassificationHistoryRow } from "@/components/admin/classification/ClassificationHistoryRow";
import {
  CLASSIFICATION_HISTORY_PATH,
  UNASSIGNED_HISTORY_SEGMENT,
} from "@/lib/classification-history";
import type { AiJobStatus } from "@/types/questions";

const PAGE_SIZE = 20;

/**
 * Level two of the subject-first Topic Classification history: the jobs
 * recorded for one subject. Each row is a React Router link into the existing
 * job detail page, which is not duplicated here.
 */
export default function SubjectClassificationHistory() {
  const params = useParams<{ subject: string }>();
  // React Router hands back the decoded segment; the reserved value addresses
  // the jobs recorded without a subject.
  const isUnassigned =
    !params.subject || params.subject === UNASSIGNED_HISTORY_SEGMENT;
  const subject = isUnassigned ? null : params.subject;
  const label = subject ?? "Custom selections";

  const [status, setStatus] = React.useState<AiJobStatus | "all">("all");
  const [page, setPage] = React.useState(1);

  // The subject is the scope; only pagination and an optional status filter
  // remain. No subject-less job falls into a subject's list.
  const filters = React.useMemo(
    () => ({
      ...(subject ? { subject } : { unassigned: true }),
      ...(status !== "all" ? { status } : {}),
      page,
      limit: PAGE_SIZE,
    }),
    [subject, status, page],
  );

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
    queryKey: aiClassificationKeys.jobs(filters),
    queryFn: () => listClassificationJobs(filters),
    placeholderData: (prev) => prev,
  });

  const jobs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = data?.page ?? page;

  // Changing the scope invalidates the current page.
  React.useEffect(() => {
    setPage(1);
  }, [subject, status]);

  return (
    <div className="max-w-full">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-1 text-muted-foreground hover:text-foreground"
        render={<Link to={CLASSIFICATION_HISTORY_PATH} />}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
        All Subjects
      </Button>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
            <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{label}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {subject
                ? `Classification jobs for ${subject} — open one to inspect its results.`
                : "Classification jobs from targeted question selections with no single subject."}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-5" />

      <ClassificationHistoryFilters
        status={status}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        isLoading={isLoading}
        onStatusChange={setStatus}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      {isError && (
        <Alert variant="destructive" className="mt-4 text-sm">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(error, "Failed to load classification jobs")}
        </Alert>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div
          className="mt-4 space-y-3"
          aria-busy="true"
          aria-label="Loading classification jobs"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {/* ─ Empty ───────────────────────────────────────────────────── */}
      {!isLoading && !isError && jobs.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <HugeiconsIcon icon={InboxIcon} className="h-5 w-5" />
          </div>
          {status !== "all" ? (
            <>
              <p className="mt-3 text-sm font-medium">
                No classification jobs match this status
              </p>
              <Button
                variant="link"
                className="mt-1 h-auto p-0"
                onClick={() => setStatus("all")}
              >
                Clear filter
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-medium">
                {subject
                  ? `No classification jobs for ${subject} yet`
                  : "No custom selections yet"}
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Start a job from Topic Classification to have AI suggest topics
                for your approved questions.
              </p>
              <Button
                size="sm"
                className="mt-3"
                render={<Link to="/admin/questions/classification" />}
              >
                <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
                Start a Classification
              </Button>
            </>
          )}
        </div>
      )}

      {/* ─ Jobs ────────────────────────────────────────────────────── */}
      {!isLoading && jobs.length > 0 && (
        <div
          className={"mt-4 space-y-3" + (isPlaceholderData ? " opacity-60" : "")}
        >
          {jobs.map((job) => (
            <ClassificationHistoryRow
              key={job.id}
              job={job}
              showSubject={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}