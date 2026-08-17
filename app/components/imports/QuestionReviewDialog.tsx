import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion, AnswerOption } from "@/lib/import-types";
import { statusBadgeClass, statusLabel } from "@/lib/import-status";
import { QuestionEditDialog } from "@/components/imports/QuestionEditDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon } from "@hugeicons/core-free-icons";

interface QuestionReviewDialogProps {
  question: ParsedQuestion | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (q: ParsedQuestion) => void;
  /** If provided, show duplicate review link */
  onReviewDuplicate?: () => void;
  readOnly?: boolean;
}

export function QuestionReviewDialog({
  question,
  open,
  onClose,
  onEdit,
  onReviewDuplicate,
  readOnly = false,
}: QuestionReviewDialogProps) {
  const [editOpen, setEditOpen] = React.useState(false);

  if (!question) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Question Detail
              <span className={statusBadgeClass(question.status)}>
                {statusLabel(question.status)}
              </span>
            </DialogTitle>
            <DialogDescription>
              {question.subject} · {question.year ?? "Year unknown"} · Row{" "}
              {question.rowIndex}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status reason */}
            {question.statusReason && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  question.status === "error"
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : question.status === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
                      : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300"
                }`}
              >
                {question.statusReason}
                {question.status === "duplicate" && onReviewDuplicate && (
                  <button
                    type="button"
                    onClick={onReviewDuplicate}
                    className="ml-2 underline underline-offset-2 cursor-pointer"
                  >
                    Compare →
                  </button>
                )}
              </div>
            )}

            {/* Question text */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Question
              </p>
              <p className="text-sm leading-relaxed">
                {question.text || (
                  <span className="italic text-muted-foreground">
                    No question text
                  </span>
                )}
              </p>
            </div>

            {/* Options */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Options
              </p>
              <div className="space-y-1.5">
                {question.options.map((opt) => (
                  <div key={opt.key} className="flex items-start gap-2.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                        question.answer === opt.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span
                      className={`text-sm ${
                        question.answer === opt.key
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {opt.text || <span className="italic">—</span>}
                      {question.answer === opt.key && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (correct)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!readOnly && onEdit && (
            <div className="flex justify-end border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <HugeiconsIcon icon={Edit01Icon} className="h-3.5 w-3.5" />
                Edit Question
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nested edit dialog — opens on top */}
      {!readOnly && onEdit && (
        <QuestionEditDialog
          question={editOpen ? question : null}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => {
            onEdit(updated);
            setEditOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
