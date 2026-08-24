import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion, AnswerOption } from "@/types/import-types";
import { statusBadgeClass, statusLabel } from "@/lib/import-status";
import { QuestionEditDialog } from "@/components/imports/QuestionEditDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Edit01Icon,
  Image01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onEdit || !question) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!question) return;
      onEdit({
        ...question,
        image: event.target?.result as string,
        isEdited: true,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleHasImageChange(checked: boolean) {
    if (!onEdit || !question) return;
    onEdit({
      ...question,
      hasImage: checked,
      image: checked ? question.image : null,
      isEdited: true,
    });
  }

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

            {/* Image Section */}
            {(question.hasImage || (!readOnly && onEdit)) && (
              <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/10">
                <div className="flex flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="review-has-image"
                      className="text-base font-semibold flex items-center gap-1.5"
                    >
                      <HugeiconsIcon icon={Image01Icon} className="h-4 w-4" />
                      Image Attachment
                    </Label>
                    {!readOnly && onEdit && (
                      <p className="text-sm text-muted-foreground">
                        Does this question require an image?
                      </p>
                    )}
                  </div>
                  {!readOnly && onEdit ? (
                    <Switch
                      id="review-has-image"
                      checked={question.hasImage}
                      onCheckedChange={handleHasImageChange}
                    />
                  ) : (
                    question.hasImage && (
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Yes
                      </span>
                    )
                  )}
                </div>

                {question.hasImage && (
                  <div className="pt-2">
                    {question.image ? (
                      <div className="space-y-2">
                        <div className="relative inline-block border border-border rounded-md overflow-hidden max-w-sm">
                          <img
                            src={question.image}
                            alt="Question diagram"
                            className="max-h-48 object-contain bg-muted/50"
                          />
                        </div>
                        {!readOnly && onEdit && (
                          <div className="flex gap-2">
                            <Label
                              htmlFor="review-replace-image"
                              className="cursor-pointer"
                            >
                              <div className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                                Replace Image
                              </div>
                              <input
                                id="review-replace-image"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() =>
                                onEdit({
                                  ...question,
                                  image: null,
                                  isEdited: true,
                                })
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!readOnly && onEdit ? (
                          <>
                            <Input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleImageUpload}
                              className="border-destructive"
                            />
                            <p className="flex items-center gap-1 text-xs text-destructive">
                              <HugeiconsIcon
                                icon={AlertCircleIcon}
                                className="h-3 w-3"
                              />
                              Image is required because this question is marked
                              as containing an image.
                            </p>
                          </>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            Image missing
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
