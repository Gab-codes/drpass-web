import { useState, useEffect, useRef } from "react";
import type { AdminQuestionStatus } from "@/types/questions";
import { STATUS_OPTIONS } from "@/constants/questions";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface QuestionFiltersProps {
  search: string;
  statusFilter: AdminQuestionStatus | "all";
  activeFilter: string;
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: AdminQuestionStatus | "all") => void;
  onActiveChange: (value: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function QuestionFilters({
  search,
  statusFilter,
  activeFilter,
  page,
  totalPages,
  total,
  isLoading,
  onSearchChange,
  onStatusChange,
  onActiveChange,
  onPrevPage,
  onNextPage,
}: QuestionFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebouncedValue(localSearch, 700);
  const isFirstRender = useRef(true);
  const lastReported = useRef(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    // Skip the initial mount so we don't fire a redundant API call,
    // and skip if the value was already reported back by the parent.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debouncedSearch === lastReported.current) return;

    lastReported.current = debouncedSearch;
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const showPagination = totalPages > 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search questions..."
          aria-label="Search questions"
          className="h-8 min-w-55 flex-1"
        />
        <Select
          value={statusFilter}
          onValueChange={(val) =>
            onStatusChange(val as AdminQuestionStatus | "all")
          }
        >
          <SelectTrigger className="h-8 w-35">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={activeFilter}
          onValueChange={(val) => val && onActiveChange(val)}
        >
          <SelectTrigger className="h-8 w-35">
            <SelectValue placeholder="All activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFilter === "true" && (
        <p className="w-full text-xs text-muted-foreground mt-1">
          Note: Deactivated questions will immediately leave this view.
        </p>
      )}

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
