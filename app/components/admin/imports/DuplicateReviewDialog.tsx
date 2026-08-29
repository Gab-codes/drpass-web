import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion } from "@/types/import-types";

interface DuplicateReviewDialogProps {
  question: ParsedQuestion | null;
  matchingQuestion: ParsedQuestion | null;
  open: boolean;
  onClose: () => void;
  onKeepBoth: () => void;
  onRemoveThis: () => void;
}

export function DuplicateReviewDialog({
  question,
  matchingQuestion,
  open,
  onClose,
  onKeepBoth,
  onRemoveThis,
}: DuplicateReviewDialogProps) {
  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[93dvh] md:max-w-2xl! overflow-y-auto overflow-x-hidden scrollbar-none">
        <DialogHeader>
          <DialogTitle>Review Possible Duplicate</DialogTitle>
          <DialogDescription className="flex items-start gap-1.5 text-sm">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
            />
            JAMB does repeat questions across different years. This is not
            automatically invalid — review both questions and decide.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <QuestionCard label="This question" question={question} highlight />
          <QuestionCard label="Possible match" question={matchingQuestion} />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="sm:mr-auto">
            Back to Review
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onRemoveThis();
              onClose();
            }}
          >
            Remove This Question
          </Button>
          <Button
            onClick={() => {
              onKeepBoth();
              onClose();
            }}
          >
            Keep Both
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Single question card for side-by-side comparison ─────────────────────────

function QuestionCard({
  label,
  question,
  highlight,
}: {
  label: string;
  question: ParsedQuestion | null;
  highlight?: boolean;
}) {
  if (!question) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground italic">
        Matching question not found in this import.
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 text-sm ${
        highlight
          ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{question.subject}</span>
          {question.year && (
            <>
              <span>·</span>
              <span>{question.year}</span>
            </>
          )}
        </div>
      </div>

      {/* Question text */}
      <p className="leading-snug text-foreground">
        {question.text || (
          <span className="italic text-muted-foreground">No question text</span>
        )}
      </p>

      {/* Options */}
      <div className="space-y-1">
        {question.options.map((opt) => (
          <div key={opt.key} className="flex items-start gap-2">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${
                question.answer === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {opt.key}
            </span>
            <span
              className={
                question.answer === opt.key
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {opt.text || <span className="italic">—</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Answer indicator */}
      <div className="border-t border-border pt-2 text-xs text-muted-foreground">
        Correct answer:{" "}
        <span className="font-semibold text-foreground">
          {question.answer ?? "—"}
        </span>
      </div>
    </div>
  );
}
