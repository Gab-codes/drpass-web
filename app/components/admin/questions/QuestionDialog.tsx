/**
 * QuestionDialog
 *
 * Unified dialog for admin question management.
 * Handles three modes:
 *   - "create" — empty form, submits createQuestion mutation
 *   - "view"   — locked fields, "Edit" button transitions to edit mode
 *   - "edit"   — editable fields, Save/Cancel, submits updateQuestion mutation
 *
 * The view → edit transition happens in-place without navigation or nested dialogs.
 *
 * Responsibility: dialog chrome, mode management, mutation lifecycle.
 * QuestionFieldsForm handles the field rendering.
 */

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createQuestion, updateQuestion, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  QuestionFieldsForm,
  EMPTY_QUESTION_FORM_VALUES,
  isQuestionFormValid,
  type QuestionFormValues,
} from "./QuestionFieldsForm";
import type { AdminQuestion } from "@/types/questions";

export function adminQuestionToFormValues(
  q: AdminQuestion,
): QuestionFormValues {
  return {
    year: q.year,
    subject: q.subject,
    text: q.text,
    // AdminQuestion does not carry type/difficulty/explanation/source/image yet.
    // Default to SINGLE_CHOICE so the form is immediately usable.
    type: "SINGLE_CHOICE",
    options: [
      { key: "A", text: q.optionA },
      { key: "B", text: q.optionB },
      { key: "C", text: q.optionC },
      { key: "D", text: q.optionD },
    ],
    correctAnswer: q.correctAnswer,
    difficulty: null,
    source: null,
    explanation: null,
    hasImage: false,
    image: null,
  };
}

function formValuesToAdminInput(v: QuestionFormValues) {
  // Map back to flat shape expected by the current API.
  // Only SINGLE_CHOICE is currently supported by the admin create/update API.
  const getOption = (key: string) =>
    v.options.find((o) => o.key === key)?.text ?? "";
  return {
    year: v.year ?? new Date().getFullYear(),
    subject: v.subject,
    text: v.text,
    optionA: getOption("A"),
    optionB: getOption("B"),
    optionC: getOption("C"),
    optionD: getOption("D"),
    correctAnswer: (Array.isArray(v.correctAnswer)
      ? v.correctAnswer[0]
      : v.correctAnswer) as "A" | "B" | "C" | "D",
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type QuestionDialogMode = "create" | "view" | "edit";

interface QuestionDialogProps {
  mode: QuestionDialogMode;
  /** The existing question — required for "view" and "edit" modes */
  question?: AdminQuestion;
  /** Pre-fill subject for "create" mode */
  defaultSubject?: string;
  open: boolean;
  onClose: () => void;
  /** Called after a successful create or update */
  onSaved?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestionDialog({
  mode: initialMode,
  question,
  defaultSubject,
  open,
  onClose,
  onSaved,
}: QuestionDialogProps) {
  const queryClient = useQueryClient();
  // Allow in-place transition from view → edit
  const [mode, setMode] = React.useState<QuestionDialogMode>(initialMode);
  const [values, setValues] = React.useState<QuestionFormValues>(
    EMPTY_QUESTION_FORM_VALUES,
  );
  const [showErrors, setShowErrors] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Reset state whenever dialog opens or mode/question changes
  React.useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setShowErrors(false);
    setErrorMsg("");

    if (initialMode === "create") {
      setValues({
        ...EMPTY_QUESTION_FORM_VALUES,
        subject: defaultSubject ?? "",
      });
    } else if (question) {
      setValues(adminQuestionToFormValues(question));
    }
  }, [open, initialMode, question, defaultSubject]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
      onSaved?.();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Failed to create question");
      setErrorMsg(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: ReturnType<typeof formValuesToAdminInput>) =>
      updateQuestion({ id: question!.id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
      onSaved?.();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Failed to update question");
      setErrorMsg(msg);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSubmit() {
    setShowErrors(true);
    if (!isQuestionFormValid(values)) return;
    setErrorMsg("");
    const input = formValuesToAdminInput(values);

    if (mode === "create") {
      toast.promise(createMutation.mutateAsync(input), {
        loading: "Creating question…",
        success: "Question created",
        error: (err) => getApiErrorMessage(err, "Failed to create question"),
      });
    } else {
      toast.promise(updateMutation.mutateAsync(input), {
        loading: "Saving changes…",
        success: "Question updated",
        error: (err) => getApiErrorMessage(err, "Failed to update question"),
      });
    }
  }

  function handleSwitchToEdit() {
    setMode("edit");
    setShowErrors(false);
    setErrorMsg("");
  }

  // ── Titles ─────────────────────────────────────────────────────────────────

  const title =
    mode === "create"
      ? "New Question"
      : mode === "edit"
        ? "Edit Question"
        : "Question";

  const description =
    mode === "create"
      ? "Create a pending, inactive question for review."
      : mode === "edit"
        ? "Update question fields."
        : question
          ? `${question.subject} · ${question.year}`
          : "";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[93vh] overflow-y-auto scrollbar-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="mb-2">
            {errorMsg}
          </Alert>
        )}

        <QuestionFieldsForm
          values={values}
          onChange={setValues}
          readOnly={mode === "view"}
          showErrors={showErrors}
        />

        <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
          {mode === "view" ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleSwitchToEdit}>
                <HugeiconsIcon icon={Edit01Icon} className="h-3.5 w-3.5" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? mode === "create"
                    ? "Creating…"
                    : "Saving…"
                  : mode === "create"
                    ? "Create Question"
                    : "Save Changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
