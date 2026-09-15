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
  status: AiJobStatus | "all";
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onStatusChange: (value: AiJobStatus | "all") => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

/**
 * Filter + pagination chrome for a subject's classification-job list.
 * Follows the established admin filter pattern (compact select, Prev/Next
 * pagination with an explicit page/total readout).
 *
 * There is deliberately no subject select: the subject *is* the list now, and
 * the history landing page is what moves between subjects.
 */
export function ClassificationHistoryFilters({
  status,
  page,
  totalPages,
  total,
  isLoading,
  onStatusChange,
  onPrevPage,
  onNextPage,
}: ClassificationHistoryFiltersProps) {
  const showPagination = totalPages > 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Select
        value={status}
        onValueChange={(val) => val && onStatusChange(val as AiJobStatus | "all")}
      >
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
