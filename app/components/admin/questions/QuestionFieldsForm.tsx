/**
 * QuestionFieldsForm
 *
 * The single source of truth for question field rendering.
 * Used by:
 *   - ImportQuestionEditDialog (import workflow editing)
 *   - QuestionDialog (admin question management — create / edit / view)
 *
 * Responsibility: render the question fields with appropriate conditional UI
 * based on question type. In read-only mode, renders as display text.
 *
 * Not responsible for: API calls, dialog chrome, mutation lifecycle.
 */

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QUESTION_SOURCES } from "@/constants/question-sources";

export interface QuestionOption {
  key: string;
  text: string;
}

/**
 * The canonical shape for question form state.
 * Shared between the import workflow (adapted from ParsedQuestion)
 * and the admin question management workflow (adapted from AdminQuestion).
 */
export interface QuestionFormValues {
  year: number | null;
  subject: string;
  text: string;
  /** SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | NUMERIC | SHORT_ANSWER | UNKNOWN */
  type: string;
  options: QuestionOption[];
  /** string for single-answer types, string[] for MULTIPLE_CHOICE */
  correctAnswer: string | string[] | null;
  difficulty: string | null;
  source: string | null;
  explanation: string | null;
  hasImage: boolean;
  image: string | null;
}

export const EMPTY_QUESTION_FORM_VALUES: QuestionFormValues = {
  year: new Date().getFullYear(),
  subject: "",
  text: "",
  type: "SINGLE_CHOICE",
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctAnswer: null,
  difficulty: null,
  source: null,
  explanation: null,
  hasImage: false,
  image: null,
};

const CHOICE_KEYS = ["A", "B", "C", "D"] as const;
const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "Single Choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "NUMERIC", label: "Numeric" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "", label: "None" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
] as const;

export interface QuestionFieldErrors {
  year?: string;
  text?: string;
  type?: string;
  correctAnswer?: string;
  image?: string;
}

export function validateQuestionFormValues(
  v: QuestionFormValues,
): QuestionFieldErrors {
  const errors: QuestionFieldErrors = {};
  if (v.year === null || isNaN(v.year)) errors.year = "Year is required";
  if (!v.text.trim()) errors.text = "Question text is required";
  if (!v.type || v.type === "UNKNOWN") errors.type = "Select a question type";
  if (
    v.correctAnswer === null ||
    v.correctAnswer === "" ||
    (Array.isArray(v.correctAnswer) && v.correctAnswer.length === 0)
  ) {
    errors.correctAnswer = "Correct answer is required";
  }
  if (v.hasImage && !v.image) errors.image = "Image is required";
  return errors;
}

export function isQuestionFormValid(v: QuestionFormValues): boolean {
  return Object.keys(validateQuestionFormValues(v)).length === 0;
}

interface QuestionFieldsFormProps {
  values: QuestionFormValues;
  onChange: (values: QuestionFormValues) => void;
  /** When true, all fields render as read-only display text */
  readOnly?: boolean;
  /** Highlight validation errors inline */
  showErrors?: boolean;
}

export function QuestionFieldsForm({
  values,
  onChange,
  readOnly = false,
  showErrors = false,
}: QuestionFieldsFormProps) {
  const errors = showErrors ? validateQuestionFormValues(values) : {};

  // ── Field helpers ──────────────────────────────────────────────────────────

  function setField<K extends keyof QuestionFormValues>(
    key: K,
    value: QuestionFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  function setOptionText(key: string, text: string) {
    onChange({
      ...values,
      options: values.options.map((o) => (o.key === key ? { ...o, text } : o)),
    });
  }

  function handleTypeChange(newType: string) {
    // Reset correctAnswer when type changes to avoid shape mismatches
    onChange({ ...values, type: newType, correctAnswer: null });
  }

  function handleCorrectAnswerToggle(key: string) {
    if (values.type === "MULTIPLE_CHOICE") {
      const current = Array.isArray(values.correctAnswer)
        ? [...values.correctAnswer]
        : values.correctAnswer
          ? [values.correctAnswer as string]
          : [];
      const next = current.includes(key)
        ? current.filter((c) => c !== key)
        : [...current, key];
      setField("correctAnswer", next);
    } else {
      setField("correctAnswer", key);
    }
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
    onChange({
      ...values,
      hasImage: checked,
      image: checked ? values.image : null,
    });
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const isChoiceType =
    values.type === "SINGLE_CHOICE" || values.type === "MULTIPLE_CHOICE";

  if (readOnly) {
    return <QuestionFieldsReadOnly values={values} />;
  }

  // ── Editable render ────────────────────────────────────────────────────────

  return (
    <div className="grid gap-4">
      {/* Row: Year + Subject */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="qf-year">Year</Label>
          <Input
            id="qf-year"
            type="number"
            min={1978}
            max={new Date().getFullYear()}
            value={values.year ?? ""}
            onChange={(e) =>
              setField("year", parseInt(e.target.value, 10) || null)
            }
            placeholder="e.g. 2020"
            className={errors.year ? "border-destructive" : ""}
          />
          {errors.year && <FieldError message={errors.year} />}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qf-subject">Subject</Label>
          <Input
            id="qf-subject"
            value={values.subject}
            onChange={(e) => setField("subject", e.target.value)}
            placeholder="e.g. Chemistry"
          />
        </div>
      </div>

      {/* Row: Type + Source */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="qf-type">Question Type</Label>
          <select
            id="qf-type"
            value={values.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={`flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm ${
              errors.type
                ? "border-destructive text-destructive"
                : "border-input"
            }`}
          >
            <option value="UNKNOWN">Select type…</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.type && <FieldError message={errors.type} />}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qf-source">Source</Label>
          <select
            id="qf-source"
            value={values.source ?? ""}
            onChange={(e) => setField("source", e.target.value || null)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">None</option>
            {QUESTION_SOURCES.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question text */}
      <div className="space-y-1.5">
        <Label htmlFor="qf-text">
          Question Text <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="qf-text"
          value={values.text}
          onChange={(e) => setField("text", e.target.value)}
          placeholder="Enter the full question text…"
          rows={3}
          className={errors.text ? "border-destructive" : ""}
        />
        {errors.text && <FieldError message={errors.text} />}
      </div>

      {/* Image */}
      <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="qf-has-image" className="text-base">
              Question contains an image
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable if the question includes a diagram, chart, or figure.
            </p>
          </div>
          <Switch
            id="qf-has-image"
            checked={values.hasImage}
            onCheckedChange={handleHasImageChange}
          />
        </div>

        {values.hasImage && (
          <div className="pt-2">
            {values.image ? (
              <div className="space-y-2">
                <div className="relative inline-block border border-border rounded-md overflow-hidden max-w-sm">
                  <img
                    src={values.image}
                    alt="Question diagram"
                    className="max-h-48 object-contain bg-muted/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Label htmlFor="qf-replace-image" className="cursor-pointer">
                    <div className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                      Replace Image
                    </div>
                    <input
                      id="qf-replace-image"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </Label>
                  <button
                    type="button"
                    onClick={() => setField("image", null)}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className={errors.image ? "border-destructive" : ""}
                />
                {errors.image && <FieldError message={errors.image} />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options — only for choice types */}
      {isChoiceType && (
        <div className="space-y-2">
          <Label>Answer Options</Label>
          <div className="grid grid-cols-2 gap-2">
            {CHOICE_KEYS.map((key) => {
              const opt = values.options.find((o) => o.key === key);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                    {key}
                  </span>
                  <Input
                    id={`qf-opt-${key}`}
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
      )}

      {/* Correct answer */}
      <div className="space-y-1.5">
        <Label htmlFor="qf-answer">
          Correct Answer <span className="text-destructive">*</span>
        </Label>
        {isChoiceType ? (
          <div className="flex gap-2">
            {CHOICE_KEYS.map((key) => {
              const isSelected = Array.isArray(values.correctAnswer)
                ? values.correctAnswer.includes(key)
                : values.correctAnswer === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCorrectAnswerToggle(key)}
                  aria-pressed={isSelected}
                  aria-label={`Set correct answer to ${key}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {key}
                </button>
              );
            })}
            {values.type === "MULTIPLE_CHOICE" && (
              <p className="self-center text-xs text-muted-foreground">
                Select all that apply
              </p>
            )}
          </div>
        ) : (
          <Input
            id="qf-answer"
            value={
              Array.isArray(values.correctAnswer)
                ? values.correctAnswer.join(", ")
                : (values.correctAnswer ?? "")
            }
            onChange={(e) => setField("correctAnswer", e.target.value)}
            placeholder={
              values.type === "TRUE_FALSE"
                ? "e.g. TRUE or FALSE"
                : values.type === "NUMERIC"
                  ? "e.g. 42"
                  : "Short answer text"
            }
            className={errors.correctAnswer ? "border-destructive" : ""}
          />
        )}
        {errors.correctAnswer && <FieldError message={errors.correctAnswer} />}
      </div>

      {/* Row: Difficulty */}
      <div className="space-y-1.5">
        <Label htmlFor="qf-difficulty">Difficulty</Label>
        <select
          id="qf-difficulty"
          value={values.difficulty ?? ""}
          onChange={(e) => setField("difficulty", e.target.value || null)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm sm:w-48"
        >
          {DIFFICULTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Explanation */}
      <div className="space-y-1.5">
        <Label htmlFor="qf-explanation">Explanation</Label>
        <Textarea
          id="qf-explanation"
          value={values.explanation ?? ""}
          onChange={(e) => setField("explanation", e.target.value || null)}
          placeholder="Optional explanation for the correct answer…"
          rows={2}
        />
      </div>
    </div>
  );
}

function QuestionFieldsReadOnly({ values }: { values: QuestionFormValues }) {
  const isChoiceType =
    values.type === "SINGLE_CHOICE" || values.type === "MULTIPLE_CHOICE";

  return (
    <div className="space-y-4">
      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/20 p-4 border border-border sm:grid-cols-3">
        <ReadOnlyField label="Year" value={values.year?.toString() ?? null} />
        <ReadOnlyField label="Subject" value={values.subject || null} />
        <ReadOnlyField label="Type" value={values.type || null} />
        <ReadOnlyField label="Source" value={values.source} />
        <ReadOnlyField label="Difficulty" value={values.difficulty} />
        <ReadOnlyField
          label="Explanation"
          value={values.explanation ? "Provided" : null}
        />
      </div>

      {/* Question text */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Question
        </p>
        <p className="text-sm leading-relaxed">
          {values.text || (
            <span className="italic text-muted-foreground">
              No question text
            </span>
          )}
        </p>
      </div>

      {/* Image */}
      {values.hasImage && (
        <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Image
          </p>
          {values.image ? (
            <div className="relative inline-block border border-border rounded-md overflow-hidden max-w-sm">
              <img
                src={values.image}
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
            values.options.map((opt) => {
              const isCorrect = Array.isArray(values.correctAnswer)
                ? values.correctAnswer.includes(opt.key)
                : values.correctAnswer === opt.key;
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
              {Array.isArray(values.correctAnswer)
                ? values.correctAnswer.join(", ")
                : values.correctAnswer || (
                    <span className="italic text-muted-foreground">None</span>
                  )}
            </div>
          )}
        </div>
      </div>

      {/* Explanation full text if provided */}
      {values.explanation && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Explanation
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {values.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function ReadOnlyField({
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

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
      {message}
    </p>
  );
}
