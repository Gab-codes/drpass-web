/**
 * QuestionEditDialog (import workflow)
 *
 * Allows editing a ParsedQuestion during the import review workflow.
 * Import-specific concerns (status, isEdited, revalidation) remain here.
 * Question field rendering is delegated to QuestionFieldsForm.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  QuestionFieldsForm,
  isQuestionFormValid,
  type QuestionFormValues,
} from "@/components/admin/questions/QuestionFieldsForm";
import type { ParsedQuestion } from "@/types/import-types";

interface QuestionEditDialogProps {
  question: ParsedQuestion | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: ParsedQuestion) => void;
}

/** Adapt ParsedQuestion → QuestionFormValues for QuestionFieldsForm */
function parsedToFormValues(q: ParsedQuestion): QuestionFormValues {
  return {
    year: q.year,
    subject: q.subject,
    text: q.text,
    type: q.type,
    options: q.options,
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty,
    source: q.source,
    explanation: q.explanation,
    hasImage: q.hasImage,
    image: q.image,
  };
}

/** Merge QuestionFormValues back onto the original ParsedQuestion */
function formValuesToParsed(
  original: ParsedQuestion,
  v: QuestionFormValues,
): ParsedQuestion {
  return {
    ...original,
    year: v.year,
    subject: v.subject,
    text: v.text,
    type: v.type,
    options: v.options,
    correctAnswer: v.correctAnswer,
    difficulty: v.difficulty,
    source: v.source,
    explanation: v.explanation,
    hasImage: v.hasImage,
    image: v.image,
    isEdited: true,
  };
}

export function QuestionEditDialog({
  question,
  open,
  onClose,
  onSave,
}: QuestionEditDialogProps) {
  const [values, setValues] = React.useState<QuestionFormValues | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);

  React.useEffect(() => {
    if (question) {
      setValues(parsedToFormValues(question));
      setShowErrors(false);
    }
  }, [question]);

  if (!values || !question) return null;

  function handleSave() {
    setShowErrors(true);
    if (!values || !isQuestionFormValid(values)) return;
    onSave(formValuesToParsed(question!, values));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[93vh] overflow-y-auto scrollbar-none">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        <QuestionFieldsForm
          values={values}
          onChange={setValues}
          showErrors={showErrors}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
