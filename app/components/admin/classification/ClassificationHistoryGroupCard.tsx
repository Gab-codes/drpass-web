import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Folder01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { JobStatusBadge } from "@/components/admin/classification/JobStatusBadge";
import { classificationHistoryJobsPath } from "@/lib/classification-history";
import type { ClassificationSubjectSummary } from "@/types/questions";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(value: string) {
  const date = new Date(value);
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/** Subject names and question counts are scanned, not read — keep them tidy. */
function formatCount(value: number) {
  return value.toLocaleString("en-NG");
}

interface ClassificationHistoryGroupCardProps {
  /** Subject name, or null for jobs recorded without a subject. */
  subject: string | null;
  /** Readily-available summary of that subject's job history, if any. */
  summary?: ClassificationSubjectSummary;
  /** True while the summary query is in flight (never claim "none" early). */
  isSummaryPending: boolean;
}

/**
 * One entry of the classification-history landing level: a subject (or the
 * grouped custom selections) plus the history summary that is already
 * available from the job table. Navigation only — the job detail page stays
 * the inspection surface.
 */
export function ClassificationHistoryGroupCard({
  subject,
  summary,
  isSummaryPending,
}: ClassificationHistoryGroupCardProps) {
  const label = subject ?? "Custom selections";
  const jobCount = summary?.jobCount ?? 0;

  return (
    <Link
      to={classificationHistoryJobsPath(subject)}
      aria-label={`View classification jobs for ${label}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <HugeiconsIcon
              icon={subject ? Folder01Icon : Tag01Icon}
              className="h-4 w-4"
            />
          </div>
          <h2 className="truncate font-semibold">{label}</h2>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>

      <div className="mt-3 flex-1 border-t border-border/60 pt-2.5">
        {isSummaryPending ? (
          <div className="h-9 animate-pulse rounded-md bg-muted/60" aria-hidden />
        ) : summary && jobCount > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">
              {jobCount} {jobCount === 1 ? "job" : "jobs"}
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              {formatCount(summary.totalQuestions)} questions
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {summary.latestJobAt ? (
                <span>Last run {formatDate(summary.latestJobAt)}</span>
              ) : null}
              {summary.latestStatus ? (
                <JobStatusBadge status={summary.latestStatus} />
              ) : null}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No classifications yet</p>
        )}
      </div>
    </Link>
  );
}