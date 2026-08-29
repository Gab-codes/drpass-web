import * as React from "react";
import type { ParsedQuestion, QuestionStatus } from "@/types/import-types";
import { statusBadgeClass, statusLabel } from "@/lib/import-status";

interface ImportFiltersProps {
  questions: ParsedQuestion[];
  yearFilter: string;
  statusFilter: string;
  search: string;
  onYearChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

const ALL_STATUSES: { value: QuestionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "valid", label: "Valid" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
  { value: "duplicate", label: "Possible Duplicate" },
];

export function ImportFilters({
  questions,
  yearFilter,
  statusFilter,
  search,
  onYearChange,
  onStatusChange,
  onSearchChange,
}: ImportFiltersProps) {
  const years = React.useMemo(() => {
    const ys = [
      ...new Set(
        questions.map((q) => q.year).filter((y): y is number => y !== null),
      ),
    ].sort((a, b) => b - a);
    return ys;
  }, [questions]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search question text…"
          aria-label="Search questions"
          className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Year filter */}
      <select
        value={yearFilter}
        onChange={(e) => onYearChange(e.target.value)}
        aria-label="Filter by year"
        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">All years</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function applyFilters(
  questions: ParsedQuestion[],
  yearFilter: string,
  statusFilter: string,
  search: string,
): ParsedQuestion[] {
  return questions.filter((q) => {
    if (yearFilter !== "all" && String(q.year) !== yearFilter) return false;
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    if (
      search.trim() !== "" &&
      !q.text.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });
}
