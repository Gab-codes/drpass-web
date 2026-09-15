import type { AiClassificationJob } from "@/types/questions";

/**
 * Pill badge for a classification job's lifecycle status.
 * Shared by the progress, results and failed/cancelled views so the status
 * affordance is rendered identically everywhere.
 */
export function JobStatusBadge({
  status,
}: {
  status: AiClassificationJob["status"];
}) {
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