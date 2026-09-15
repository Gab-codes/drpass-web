import * as React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  AlertCircleIcon,
  Tag01Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  aiClassificationKeys,
  listClassificationJobs,
} from "@/api/ai-classification";
import { getAdminSubjects, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { ClassificationHistoryRow } from "@/components/admin/classification/ClassificationHistoryRow";
import { ClassificationHistoryFilters } from "@/components/admin/classification/ClassificationHistoryFilters";
import type { AiJobStatus } from "@/types/questions";

const PAGE_SIZE = 20;

export default function TopicClassificationHistory() {
  const [subject, setSubject] = React.useState("all");
  const [status, setStatus] = React.useState<AiJobStatus | "all">("all");
  const [page, setPage] = React.useState(1);

  // Subject options reuse the existing Question Bank subjects summary —
  // the same list the classification setup page offers.
  const {
    data: subjectSummaries = [],
    isError: subjectsError,
    error: subjectsErr,
  } = useQuery({
    queryKey: questionKeys.adminSubjects(),
    queryFn: getAdminSubjects,
    staleTime: 5 * 60 * 1000,
  });
  const subjects = subjectSummaries.map((s) => s.subject);
  const hasActiveFilters = subject !== "all" || status !== "all";

  const filters = React.useMemo(
    () => ({
      ...(subject !== "all" ? { subject } : {}),
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
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
            <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Topic Classification History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Past AI classification jobs — what they covered, how they
              performed, and whether their suggestions were accepted.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link to="/admin/questions/classification" />}
        >
          <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
          New Classification
        </Button>
      </div>

      <Separator className="my-5" />

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <ClassificationHistoryFilters
        subject={subject}
        subjects={subjects}
        status={status}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        isLoading={isLoading}
        onSubjectChange={setSubject}
        onStatusChange={setStatus}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      {subjectsError && (
        <Alert variant="destructive" className="mt-3 text-sm">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(subjectsErr, "Could not load subject filters")}
        </Alert>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div
          className="mt-4 space-y-3"
          aria-busy="true"
          aria-label="Loading classification history"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {isError && (
        <Alert variant="destructive" className="mt-4 text-sm">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(error, "Failed to load classification history")}
        </Alert>
      )}

      {/* ── Empty states ────────────────────────────────────────────── */}
      {!isLoading && !isError && jobs.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <HugeiconsIcon icon={InboxIcon} className="h-5 w-5" />
          </div>
          {hasActiveFilters ? (
            <>
              <p className="mt-3 text-sm font-medium">
                No classification jobs match these filters
              </p>
              <Button
                variant="link"
                className="mt-1 h-auto p-0"
                onClick={() => {
                  setSubject("all");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-medium">
                No classification jobs yet
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

      {/* ── History list ────────────────────────────────────────────── */}
      {!isLoading && jobs.length > 0 && (
        <div
          className={
            "mt-4 space-y-3" + (isPlaceholderData ? " opacity-60" : "")
          }
        >
          {jobs.map((job) => (
            <ClassificationHistoryRow key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* ── Footer pagination for long lists ────────────────────────── */}
      {!isLoading && jobs.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages} ({total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
