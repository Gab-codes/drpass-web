import { cn } from "@/lib/utils";
import type { QuestionStatus } from "@/lib/import-types";

// ── Centralised status badge helpers ─────────────────────────────────────────
// All status colour decisions live here so they can be updated in one place.
// We use shadcn semantic classes only — no custom colours.

export interface StatusConfig {
  label: string;
  /** Tailwind classes for a small inline badge. */
  badgeClass: string;
  /** Tailwind classes for an Alert component. */
  alertClass: string;
}

export const STATUS_CONFIG: Record<QuestionStatus, StatusConfig> = {
  valid: {
    label: "Valid",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
    alertClass:
      "border-green-400 bg-green-100 dark:border-green-900 dark:bg-green-950/20",
  },
  warning: {
    label: "Warning",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    alertClass:
      "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20",
  },
  error: {
    label: "Error",
    badgeClass:
      "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/40",
    alertClass:
      "border-destructive/30 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10",
  },
  duplicate: {
    label: "Possible Duplicate",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    alertClass:
      "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20",
  },
};

export function statusBadgeClass(status: QuestionStatus, extra?: string) {
  return cn(
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
    STATUS_CONFIG[status].badgeClass,
    extra,
  );
}

export function statusLabel(status: QuestionStatus): string {
  return STATUS_CONFIG[status].label;
}
