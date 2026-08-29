import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ParsedQuestion, AnswerOption } from "@/types/import-types";

interface QuestionEditDialogProps {
  question: ParsedQuestion | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: ParsedQuestion) => void;
}

const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D"];

export function QuestionEditDialog({
  question,
  open,
  onClose,
  onSave,
}: QuestionEditDialogProps) {
  // Local edit state — initialised from question when it changes
  const [draft, setDraft] = React.useState<ParsedQuestion | null>(null);

  React.useEffect(() => {
    if (question) setDraft({ ...question });
  }, [question]);

  if (!draft) return null;

  function setField<K extends keyof ParsedQuestion>(
    key: K,
    value: ParsedQuestion[K],
  ) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function setOptionText(optionKey: AnswerOption, text: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        options: prev.options.map((o) =>
          o.key === optionKey ? { ...o, text } : o,
        ),
      };
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setField("image", event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleHasImageChange(checked: boolean) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hasImage: checked,
        image: checked ? prev.image : null,
      };
    });
  }

  function handleSave() {
    if (!draft) return;
    onSave({ ...draft, isEdited: true });
    onClose();
  }

  const hasText = draft.text.trim() !== "";
  const hasAnswer = draft.answer !== null;
  const hasYear = draft.year !== null;
  const hasValidImage = !draft.hasImage || draft.image !== null;
  const canSave = hasText && hasAnswer && hasYear && hasValidImage;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[93vh] overflow-y-auto scrollbar-none">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Row: Year + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                min={1978}
                max={new Date().getFullYear()}
                value={draft.year ?? ""}
                onChange={(e) =>
                  setField("year", parseInt(e.target.value, 10) || null)
                }
                placeholder="e.g. 2020"
                className={!hasYear ? "border-destructive" : ""}
              />
              {!hasYear && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
                  Year is required
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={draft.subject}
                onChange={(e) => setField("subject", e.target.value)}
                placeholder="e.g. Accountancy"
              />
            </div>
          </div>

          {/* Question text */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-question">
              Question Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-question"
              value={draft.text}
              onChange={(e) => setField("text", e.target.value)}
              placeholder="Enter the full question text…"
              rows={3}
              className={!hasText ? "border-destructive" : ""}
            />
            {!hasText && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
                Question text is required
              </p>
            )}
          </div>

          {/* Image */}
          <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-has-image" className="text-base">
                  Question contains an image
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable this if the question includes a diagram, chart, figure,
                  or other visual content.
                </p>
              </div>
              <Switch
                id="edit-has-image"
                checked={draft.hasImage}
                onCheckedChange={handleHasImageChange}
              />
            </div>

            {draft.hasImage && (
              <div className="pt-2">
                {draft.image ? (
                  <div className="space-y-2">
                    <div className="relative inline-block border border-border rounded-md overflow-hidden max-w-sm">
                      <img
                        src={draft.image}
                        alt="Question diagram"
                        className="max-h-48 object-contain bg-muted/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Label htmlFor="replace-image" className="cursor-pointer">
                        <div className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                          Replace Image
                        </div>
                        <input
                          id="replace-image"
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </Label>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setField("image", null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      className={!hasValidImage ? "border-destructive" : ""}
                    />
                    {!hasValidImage && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <HugeiconsIcon
                          icon={AlertCircleIcon}
                          className="h-3 w-3"
                        />
                        Image is required because this question is marked as
                        containing an image.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Answer Options</Label>
            <div className="grid grid-cols-2 gap-2">
              {ANSWER_OPTIONS.map((key) => {
                const opt = draft.options.find((o) => o.key === key);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                      {key}
                    </span>
                    <Input
                      id={`edit-opt-${key}`}
                      value={opt?.text ?? ""}
                      onChange={(e) => setOptionText(key, e.target.value)}
                      placeholder={`Option ${key}`}
                      className="h-8 text-sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correct answer */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-answer">
              Correct Answer <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              {ANSWER_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setField("answer", key)}
                  aria-pressed={draft.answer === key}
                  aria-label={`Set correct answer to ${key}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                    draft.answer === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            {!hasAnswer && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
                Correct answer is required
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
