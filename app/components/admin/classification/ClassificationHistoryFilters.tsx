import type { AiJobStatus } from "@/types/questions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS: Array<AiJobStatus | "all"> = [
  "all",
  "queued",
  "processing",
  "completed",
  "partial",
  "failed",
  "cancelled",
];

const STATUS_LABELS: Record<AiJobStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  partial: "Partial",
  failed: "Failed",
  cancelled: "Cancelled",
};

interface ClassificationHistoryFiltersProps {
  subject: string;
  subjects: string[];
  status: AiJobStatus | "all";
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onSubjectChange: (value: string) => void;
  onStatusChange: (value: AiJobStatus | "all") => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

/**
 * Filter + pagination chrome for the Topic Classification history.
 * Follows the established admin filter pattern (compact selects, Prev/Next
 * pagination with an explicit page/total readout).
 */
export function ClassificationHistoryFilters({
  subject,
  subjects,
  status,
  page,
  totalPages,
  total,
  isLoading,
  onSubjectChange,
  onStatusChange,
  onPrevPage,
  onNextPage,
}: ClassificationHistoryFiltersProps) {
  const showPagination = totalPages > 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={subject}
          onValueChange={(val) => val && onSubjectChange(val)}
        >
          <SelectTrigger
            className="h-8 w-44"
            aria-label="Filter by subject"
          >
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(val) => val && onStatusChange(val as AiJobStatus | "all")}>
          <SelectTrigger className="h-8 w-36" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showPagination && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={page === 1 || isLoading}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={page === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
