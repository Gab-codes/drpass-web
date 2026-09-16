import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { ClassificationJobSummary } from "@/types/questions";
import { JobStatusBadge } from "@/components/admin/classification/JobStatusBadge";

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Counts such as 1,240 are scanned, not read. */
function formatCount(value: number) {
  return value.toLocaleString("en-NG");
}

/**
 * Compact metric chips — only non-zero counters are shown so a healthy
 * completed job reads as one calm line instead of a wall of statistics.
 */
function OutcomeChips({ job }: { job: ClassificationJobSummary }) {
  const outcome: { label: string; cls: string }[] = [];
  if (job.accepted > 0)
    outcome.push({ label: `${job.accepted} accepted`, cls: "text-success" });
  if (job.suggested > 0)
    outcome.push({
      label: `${job.suggested} suggested`,
      cls: "text-info",
    });
  if (job.needsReview > 0)
    outcome.push({
      label: `${job.needsReview} need${job.needsReview === 1 ? "s" : ""} review`,
      cls: "text-warning",
    });

  if (outcome.length === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      {outcome.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/50">·</span>}
          <span className={item.cls}>{item.label}</span>
        </span>
      ))}
    </p>
  );
}

/**
 * One Topic Classification history entry. The whole row is a link to the
 * existing job detail page, which remains the single place for detailed
 * inspection.
 *
 * On a subject-scoped list the subject is already the page context, so the
 * date becomes the row label instead of one repeated subject name.
 */
export function ClassificationHistoryRow({
  job,
  showSubject = true,
}: {
  job: ClassificationJobSummary;
  showSubject?: boolean;
}) {
  const isActive = job.status === "queued" || job.status === "processing";
  const subjectLabel = job.subject ?? "Custom selection";
  const dateLabel = formatDateTime(job.createdAt);
  const title = showSubject ? subjectLabel : dateLabel;

  const metrics: string[] = [];
  if (isActive) {
    metrics.push(`${job.processed} of ${job.total} processed`);
  } else {
    metrics.push(`${formatCount(job.total)} questions`);
    if (job.succeeded > 0)
      metrics.push(`${formatCount(job.succeeded)} classified`);
    if (job.failed > 0) metrics.push(`${formatCount(job.failed)} failed`);
    if (job.skipped > 0) metrics.push(`${formatCount(job.skipped)} skipped`);
  }

  const modelLabel = job.model ? (
    <span
      className={
        showSubject ? "ml-2 font-mono text-[11px]" : "font-mono text-[11px]"
      }
    >
      {job.model}
    </span>
  ) : null;

  return (
    <Link
      to={`/admin/questions/classification/${job.id}`}
      aria-label={
        showSubject
          ? `Open classification job for ${subjectLabel}`
          : `Open classification job from ${dateLabel}`
      }
      className="group block rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            <JobStatusBadge status={job.status} />
          </div>
          {showSubject || modelLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {showSubject ? dateLabel : null}
              {modelLabel}
            </p>
          ) : null}
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>

      <div className="mt-2.5 space-y-1 border-t border-border/60 pt-2.5">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          {metrics.map((metric, i) => (
            <span key={metric} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50">·</span>}
              <span
                className={
                  metric.endsWith("failed") ? "text-destructive" : undefined
                }
              >
                {metric}
              </span>
            </span>
          ))}
        </p>
        <OutcomeChips job={job} />
        {job.error && (job.status === "failed" || job.failed > 0) ? (
          <p
            className="truncate text-wrap text-xs text-destructive/90"
            title={job.error}
          >
            {job.error}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
