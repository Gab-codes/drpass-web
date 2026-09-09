/**
 * QuestionReviewDialog (import workflow)
 *
 * Read-only review of a ParsedQuestion during the import workflow.
 * Shows import-specific metadata: status, statusReason, duplicate info.
 *
 * When not readOnly, provides an "Edit Question" action that transitions
 * this dialog directly into edit mode (no nested second dialog).
 *
 * Responsibilities:
 *   - import status / statusReason / duplicate badge
 *   - view mode via QuestionFieldsForm readOnly
 *   - in-place edit mode transition via QuestionEditDialog
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon } from "@hugeicons/core-free-icons";
import { statusBadgeClass, statusLabel } from "@/lib/import-status";
import { QuestionEditDialog } from "@/components/admin/imports/QuestionEditDialog";
import type { ParsedQuestion } from "@/types/import-types";

interface QuestionReviewDialogProps {
  question: ParsedQuestion | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (q: ParsedQuestion) => void;
  /** If provided, show duplicate comparison link */
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

  // Close edit dialog when review dialog closes
  React.useEffect(() => {
    if (!open) setEditOpen(false);
  }, [open]);

  if (!question) return null;

  const isChoiceType =
    question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-xl max-h-[93vh] overflow-y-auto scrollbar-none">
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

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/20 p-4 border border-border">
              <MetaField label="Type" value={question.type} />
              <MetaField label="Source" value={question.source} />
              <MetaField label="Difficulty" value={question.difficulty} />
              <MetaField
                label="Explanation"
                value={question.explanation ? "Provided" : null}
              />
            </div>

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

            {/* Image */}
            {question.hasImage && (
              <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Image
                </p>
                {question.image ? (
                  <div className="relative inline-block border border-border rounded-md overflow-hidden max-w-sm">
                    <img
                      src={question.image}
                      alt="Question diagram"
                      className="max-h-48 object-contain bg-muted/50"
                    />
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Image missing
                  </p>
                )}
              </div>
            )}

            {/* Options */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Options
              </p>
              <div className="space-y-1.5">
                {isChoiceType ? (
                  question.options.map((opt) => {
                    const isCorrect = Array.isArray(question.correctAnswer)
                      ? question.correctAnswer.includes(opt.key)
                      : question.correctAnswer === opt.key;
                    return (
                      <div key={opt.key} className="flex items-start gap-2.5">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            isCorrect
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span
                          className={`text-sm ${
                            isCorrect
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {opt.text || <span className="italic">—</span>}
                          {isCorrect && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              (correct)
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm">
                    <span className="font-semibold text-primary">
                      Correct Answer:{" "}
                    </span>
                    {Array.isArray(question.correctAnswer)
                      ? question.correctAnswer.join(", ")
                      : question.correctAnswer}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit action */}
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

      {/* Edit dialog — opens alongside review dialog (review stays open in background) */}
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

// ─── Small helper ─────────────────────────────────────────────────────────────

function MetaField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">
        {value ?? <span className="italic text-muted-foreground">None</span>}
      </p>
    </div>
  );
}
