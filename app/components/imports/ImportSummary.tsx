import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Alert01Icon,
  Copy01Icon,
  FileQuestionMarkIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import * as Icons from "@hugeicons/core-free-icons";
import type { ParseSummary } from "@/lib/import-types";

// HugeIcons exports IconSvgObject (not a React component), so we pass the
// icon object directly to HugeiconsIcon rather than storing ComponentType.
type HugeIcon = Parameters<typeof HugeiconsIcon>[0]["icon"];

interface StatItem {
  icon: HugeIcon;
  label: string;
  value: number | string;
  emphasis?: "muted" | "warning" | "error" | "info" | "default";
}

interface ImportSummaryProps {
  summary: ParseSummary;
  filename?: string;
}

export function ImportSummary({ summary, filename }: ImportSummaryProps) {
  const stats: StatItem[] = [
    {
      icon: Icons.FileQuestionMarkIcon,
      label: "Questions detected",
      value: summary.totalQuestions.toLocaleString(),
      emphasis: "default",
    },
    {
      icon: Icons.Calendar01Icon,
      label: "Years detected",
      value: summary.years.length,
      emphasis: "default",
    },
    {
      icon: Icons.CheckmarkCircle01Icon,
      label: "Valid",
      value: summary.validCount,
      emphasis: "default",
    },
    ...(summary.duplicateCount > 0
      ? [
          {
            icon: Icons.Copy01Icon as HugeIcon,
            label: "Possible duplicates",
            value: summary.duplicateCount,
            emphasis: "info" as const,
          },
        ]
      : []),
    ...(summary.warningCount > 0
      ? [
          {
            icon: Icons.Alert01Icon as HugeIcon,
            label: "Warnings",
            value: summary.warningCount,
            emphasis: "warning" as const,
          },
        ]
      : []),
    ...(summary.errorCount > 0
      ? [
          {
            icon: Icons.AlertCircleIcon as HugeIcon,
            label: "Errors",
            value: summary.errorCount,
            emphasis: "error" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      {filename && (
        <p className="text-xs text-muted-foreground">
          Parsed from{" "}
          <span className="font-medium text-foreground">{filename}</span>
          {summary.years.length > 0 && (
            <>
              {" "}
              ·{" "}
              {summary.years.length === 1
                ? `${summary.years[0]}`
                : `${summary.years[0]}–${summary.years[summary.years.length - 1]}`}
            </>
          )}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {stats.map((s) => (
          <SummaryStat key={s.label} {...s} />
        ))}
      </div>
      {summary.errorCount > 0 && (
        <p className="text-xs text-destructive">
          <span className="font-medium">
            {summary.errorCount} question
            {summary.errorCount === 1 ? "" : "s"} have errors
          </span>{" "}
          and cannot be submitted until fixed or removed. Review the table
          below.
        </p>
      )}
      {summary.duplicateCount > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">
            {summary.duplicateCount} possible duplicate
            {summary.duplicateCount === 1 ? "" : "s"} detected.
          </span>{" "}
          Review each one — JAMB does repeat questions across different years,
          so duplicates are not automatically invalid.
        </p>
      )}
    </div>
  );
}

function emphasisClasses(emphasis: StatItem["emphasis"]) {
  switch (emphasis) {
    case "error":
      return {
        value: "text-destructive",
        icon: "text-destructive",
        card: "ring-destructive/20 dark:ring-destructive/30",
      };
    case "warning":
      return {
        value: "text-amber-700 dark:text-amber-400",
        icon: "text-amber-500",
        card: "ring-amber-200 dark:ring-amber-900",
      };
    case "info":
      return {
        value: "text-blue-700 dark:text-blue-400",
        icon: "text-blue-500",
        card: "ring-blue-200 dark:ring-blue-900",
      };
    default:
      return {
        value: "text-foreground",
        icon: "text-muted-foreground",
        card: "ring-foreground/10",
      };
  }
}

function SummaryStat({ icon, label, value, emphasis }: StatItem) {
  const c = emphasisClasses(emphasis);
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl bg-card px-3 py-3 ring-1 ${c.card}`}
    >
      <HugeiconsIcon icon={icon} className={`h-4 w-4 ${c.icon}`} />
      <div className={`text-xl font-semibold tabular-nums ${c.value}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}
