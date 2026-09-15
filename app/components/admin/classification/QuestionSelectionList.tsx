import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusVariant, truncate } from "@/constants/questions";
import type { AdminQuestion } from "@/types/questions";

interface QuestionSelectionListProps {
  questions: AdminQuestion[];
  isLoading: boolean;
  /** True while the ids of the whole eligible result set are loading. */
  isSelectingAll: boolean;
  eligibleTotal: number;
  isSelected: (id: string) => boolean;
  allEligibleSelected: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  onSelectAllEligible: () => void;
  onClearSelection: () => void;
}

/**
 * Selectable question table for the Topic Classification setup stage.
 *
 * Row selection is id-based and owned by the caller, so it survives pagination.
 * The banner offers the two whole-result-set actions (select all eligible /
 * clear selection) without loading every question record.
 */
export function QuestionSelectionList({
  questions,
  isLoading,
  isSelectingAll,
  eligibleTotal,
  isSelected,
  allEligibleSelected,
  onToggle,
  onTogglePage,
  onSelectAllEligible,
  onClearSelection,
}: QuestionSelectionListProps) {
  const pageIds = questions.map((q) => q.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(isSelected);
  const someOnPage = pageIds.some(isSelected) && !allOnPage;
  const hasMoreEligibleThanPage = eligibleTotal > questions.length;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* ── Selection scope banner ──────────────────────────────────── */}
      {isSelectingAll ? (
        <p className="px-4 py-2.5 text-sm text-muted-foreground">
          Loading all {eligibleTotal} eligible questions…
        </p>
      ) : allEligibleSelected ? (
        <p className="px-4 py-2.5 text-sm text-muted-foreground">
          All {eligibleTotal} eligible questions are selected.{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={onClearSelection}
          >
            Clear selection
          </Button>
        </p>
      ) : allOnPage && hasMoreEligibleThanPage ? (
        <p className="px-4 py-2.5 text-sm text-muted-foreground">
          {questions.length === 1
            ? "The question on this page is selected."
            : `All ${questions.length} questions on this page are selected.`}{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={onSelectAllEligible}
          >
            Select all {eligibleTotal} eligible questions
          </Button>
        </p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 px-3">
              <Checkbox
                checked={allOnPage}
                indeterminate={someOnPage}
                onCheckedChange={(checked) => onTogglePage(checked as boolean)}
                disabled={questions.length === 0 || isLoading}
                aria-label="Select all questions on this page"
              />
            </TableHead>
            <TableHead className="px-3">Question</TableHead>
            <TableHead className="w-20 px-3">Year</TableHead>
            <TableHead className="w-28 px-3">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-62.5" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : questions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                No eligible questions match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="px-3 py-2">
                  <Checkbox
                    checked={isSelected(question.id)}
                    onCheckedChange={(checked) =>
                      onToggle(question.id, checked as boolean)
                    }
                    aria-label={`Select ${truncate(question.text)}`}
                  />
                </TableCell>
                <TableCell className="max-w-136 px-3 py-2 whitespace-normal">
                  <p className="font-medium leading-snug">
                    {truncate(question.text)}
                  </p>
                </TableCell>
                <TableCell className="px-3 py-2 text-xs font-medium tabular-nums">
                  {question.year}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Badge variant={statusVariant(question.status)}>
                    {question.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}