import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  Copy01Icon,
  Edit01Icon,
  Delete01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion } from "@/lib/import-types";
import { statusBadgeClass, statusLabel } from "@/lib/import-status";

interface QuestionPreviewTableProps {
  questions: ParsedQuestion[];
  totalCount: number;
  onReview: (question: ParsedQuestion) => void;
  onEdit: (question: ParsedQuestion) => void;
  onRemove: (clientId: string) => void;
  onKeepDuplicate?: (clientId: string) => void;
  /** When true, hide edit/remove actions (read-only mode for import detail page). */
  readOnly?: boolean;
}

const TRUNCATE_LEN = 80;

function truncate(text: string) {
  if (!text) return <span className="italic text-muted-foreground">—</span>;
  if (text.length <= TRUNCATE_LEN) return text;
  return text.slice(0, TRUNCATE_LEN) + "…";
}

export function QuestionPreviewTable({
  questions,
  totalCount,
  onReview,
  onEdit,
  onRemove,
  onKeepDuplicate,
  readOnly = false,
}: QuestionPreviewTableProps) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium">
          No questions match the current filters
        </p>
        <p className="text-xs text-muted-foreground">
          Try adjusting the year, status, or search filters above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        Showing {questions.length.toLocaleString()} of{" "}
        {totalCount.toLocaleString()} questions
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-10">
                #
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-16">
                Year
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Question
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-16">
                Answer
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-36">
                Status
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium text-muted-foreground w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {questions.map((q) => (
              <QuestionRow
                key={q._clientId}
                question={q}
                onReview={onReview}
                onEdit={onEdit}
                onRemove={onRemove}
                onKeepDuplicate={onKeepDuplicate}
                readOnly={readOnly}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function QuestionRow({
  question: q,
  onReview,
  onEdit,
  onRemove,
  onKeepDuplicate,
  readOnly,
}: {
  question: ParsedQuestion;
  onReview: (q: ParsedQuestion) => void;
  onEdit: (q: ParsedQuestion) => void;
  onRemove: (id: string) => void;
  onKeepDuplicate?: (id: string) => void;
  readOnly: boolean;
}) {
  const isRemoved = q.duplicateResolution === "remove";

  return (
    <tr
      className={cn(
        "transition-colors",
        isRemoved
          ? "opacity-40 bg-muted/20"
          : q.status === "error"
            ? "bg-destructive/5 hover:bg-destructive/10"
            : q.status === "duplicate"
              ? "bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              : q.status === "warning"
                ? "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                : q.status === "valid"
                  ? "bg-green-100/50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20"
                  : "hover:bg-muted/30",
      )}
    >
      <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
        {q.rowIndex}
      </td>
      <td className="px-3 py-2 text-xs font-medium tabular-nums">
        {q.year ?? <span className="italic text-muted-foreground">—</span>}
      </td>
      <td className="px-3 py-2 max-w-100">
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-sm leading-snug",
              !q.text && "italic text-muted-foreground",
            )}
          >
            {q.text ? truncate(q.text) : "Missing question text"}
          </span>
          {q.isEdited && (
            <span className="text-xs text-muted-foreground">Edited</span>
          )}
          {q.hasImage && (
            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <HugeiconsIcon icon={Image01Icon} className="h-3 w-3" />
              Has image
            </span>
          )}
          {isRemoved && (
            <span className="text-xs font-medium text-muted-foreground">
              Marked for removal
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-xs font-mono font-medium">
        {q.answer ?? <span className="italic text-muted-foreground">—</span>}
      </td>
      <td className="px-3 py-2">
        <span className={statusBadgeClass(q.status)}>
          {q.status === "duplicate" && (
            <HugeiconsIcon icon={Copy01Icon} className="h-2.5 w-2.5" />
          )}
          {statusLabel(q.status)}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onReview(q)}
            aria-label="Review question"
            title="Review"
          >
            <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5" />
          </Button>

          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onEdit(q)}
                aria-label="Edit question"
                title="Edit"
                disabled={isRemoved}
              >
                <HugeiconsIcon icon={Edit01Icon} className="h-3.5 w-3.5" />
              </Button>

              {q.status === "duplicate" && !isRemoved && onKeepDuplicate && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onKeepDuplicate(q._clientId)}
                  aria-label="Keep this duplicate"
                  title="Keep"
                  className="text-blue-600 hover:text-blue-700"
                >
                  ✓
                </Button>
              )}

              {!isRemoved ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemove(q._clientId)}
                  aria-label="Remove question"
                  title="Remove"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onKeepDuplicate?.(q._clientId)}
                  title="Restore"
                  className="text-muted-foreground"
                >
                  ↩
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
