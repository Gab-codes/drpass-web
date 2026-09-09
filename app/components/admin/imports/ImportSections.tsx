import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { ImportDropzone } from "@/components/admin/imports/ImportDropzone";
import { QUESTION_SOURCES } from "@/constants/question-sources";
import type { ImportFormat, ParsedQuestion, ParseSummary } from "@/types/import-types";
import type { ImportQuestionsResult } from "@/types/questions";

// ─── Draft banner ─────────────────────────────────────────────────────────────

export function DraftBanner({
  savedAt,
  questionCount,
  onRestore,
  onDiscard,
}: {
  savedAt: string | null;
  questionCount: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const relativeTime = savedAt
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round((new Date(savedAt).getTime() - Date.now()) / 60000),
        "minutes",
      )
    : "recently";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Saved draft available
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {questionCount} question{questionCount === 1 ? "" : "s"} · saved{" "}
          {relativeTime}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onRestore}>
          Restore Draft
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}

// ─── Import source selector ────────────────────────────────────────────────────

export function ImportSourceSelector({
  detectedSource,
  selectedSource,
  onChange,
}: {
  detectedSource: string | null;
  selectedSource: string | null;
  onChange: (source: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold">Import Source</p>
        <p className="text-xs text-muted-foreground">
          {detectedSource
            ? `Detected from file: ${detectedSource}`
            : "Source could not be determined automatically."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          id="import-source-selector"
          value={selectedSource ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={`flex h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm ${
            !selectedSource
              ? "border-destructive text-destructive"
              : "border-input"
          }`}
          aria-label="Import source"
        >
          <option value="">Select source…</option>
          {QUESTION_SOURCES.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
        {!selectedSource && (
          <p className="text-xs font-medium text-destructive">
            Required before submitting
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Upload section ────────────────────────────────────────────────────────────

export function UploadSection({
  format,
  file,
  error,
  onFormatChange,
  onFile,
  onProcess,
  onUseMock,
}: {
  format: ImportFormat;
  file: File | null;
  error: string | null;
  onFormatChange: (f: ImportFormat) => void;
  onFile: (f: File | null) => void;
  onProcess: () => void;
  onUseMock: () => void;
}) {
  return (
    <div className="max-w-2xl space-y-5">
      {/* Format selector */}
      <Tabs
        value={format}
        onValueChange={(v) => onFormatChange(v as ImportFormat)}
      >
        <TabsList>
          <TabsTrigger value="xlsx">XLSX</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <TabsContent value="xlsx" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload an Excel spreadsheet. Each sheet may represent a
                different year. Expected columns:{" "}
                <span className="font-mono text-xs text-foreground">
                  Year, Subject, Question, Option A–D, Answer
                </span>
              </p>
              <ImportDropzone
                format="xlsx"
                file={file}
                onFile={onFile}
                disabled={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="json" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a JSON file. Accepts an array of question objects or{" "}
                <span className="font-mono text-xs text-foreground">
                  {"{ questions: [...] }"}
                </span>
                . Each object should have{" "}
                <span className="font-mono text-xs text-foreground">
                  year, subject, question, options, answer
                </span>
                .
              </p>
              <ImportDropzone
                format="json"
                file={file}
                onFile={onFile}
                disabled={false}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Error feedback */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onProcess} disabled={!file}>
          <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />
          Process File
        </Button>
        <Button variant="outline" onClick={onUseMock}>
          Use Sample Data
        </Button>
      </div>

      {/* What happens next */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-4 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What happens after processing?
        </p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            Questions are parsed and grouped by year
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            Possible duplicates within the file are detected and flagged
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            You can review, edit, and resolve issues before submitting
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            Submitting sends the dataset for review — questions are{" "}
            <strong>not published immediately</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Processing section ────────────────────────────────────────────────────────

export function ProcessingSection({ progress }: { progress: number }) {
  return (
    <div className="flex max-w-md flex-col gap-4 py-8">
      <div className="flex items-center gap-3">
        <HugeiconsIcon
          icon={Clock01Icon}
          className="h-5 w-5 text-muted-foreground animate-spin"
        />
        <span className="text-sm font-medium">Processing questions…</span>
      </div>
      <Progress value={progress}>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      <p className="text-xs text-muted-foreground">
        Parsing rows, detecting duplicates, and validating structure.
      </p>
    </div>
  );
}

// ─── Submission footer ─────────────────────────────────────────────────────────

export function SubmissionFooter({
  summary,
  keptDuplicates,
  removedCount,
  remainingErrors,
  importSource,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  summary: ParseSummary;
  keptDuplicates: number;
  removedCount: number;
  remainingErrors: number;
  importSource: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const activeCount = summary.totalQuestions;
  const canSubmit = remainingErrors === 0 && !isSubmitting && !!importSource;

  return (
    <div className="space-y-3">
      {submitError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {submitError}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Summary line */}
        <div className="space-y-0.5 text-sm">
          <p className="font-medium">
            {activeCount.toLocaleString()} question
            {activeCount === 1 ? "" : "s"} across {summary.years.length} year
            {summary.years.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">
            {keptDuplicates > 0 &&
              `${keptDuplicates} duplicate${keptDuplicates === 1 ? "" : "s"} kept · `}
            {removedCount > 0 && `${removedCount} removed · `}
            {summary.warningCount > 0 &&
              `${summary.warningCount} warning${summary.warningCount === 1 ? "" : "s"}`}
          </p>
          {remainingErrors > 0 && (
            <p className="text-xs font-medium text-destructive">
              {remainingErrors} error{remainingErrors === 1 ? "" : "s"} must be
              fixed or removed before submitting
            </p>
          )}
          {!importSource && (
            <p className="text-xs font-medium text-destructive">
              No source selected. Choose JAMB, WAEC, NECO, or GCE before
              importing.
            </p>
          )}
        </div>

        <Button size="lg" onClick={onSubmit} disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <HugeiconsIcon
                icon={Clock01Icon}
                className="h-4 w-4 animate-spin"
              />
              Submitting…
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />
              Submit for Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Submitted success state ───────────────────────────────────────────────────

export function SubmittedSection({
  onReset,
  questions,
  result,
}: {
  onReset: () => void;
  questions: ParsedQuestion[];
  result: ImportQuestionsResult;
}) {
  const activeCount = questions.filter(
    (q) => q.duplicateResolution !== "remove",
  ).length;

  return (
    <div className="flex max-w-lg flex-col items-start gap-4 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <HugeiconsIcon
          icon={CheckmarkCircle01Icon}
          className="h-6 w-6 text-primary"
        />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Import Submitted for Review</h2>
        <p className="text-sm text-muted-foreground">
          {result.created.toLocaleString()} question
          {result.created === 1 ? "" : "s"} imported from{" "}
          {activeCount.toLocaleString()} submitted. Pending questions remain
          unavailable to students until approved.
        </p>
        <p className="text-xs text-muted-foreground">
          {result.duplicates} duplicate{result.duplicates === 1 ? "" : "s"} ·{" "}
          {result.unsupported} unsupported · {result.failed} failed
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onReset} variant="outline">
          Import Another File
        </Button>
        {result.importId && (
          <Button variant="ghost" render={<Link to="/admin/questions" />}>
            View Import →
          </Button>
        )}
      </div>
    </div>
  );
}
