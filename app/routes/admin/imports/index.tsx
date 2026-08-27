import * as React from "react";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import { ImportDropzone } from "@/components/imports/ImportDropzone";
import { ImportSummary } from "@/components/imports/ImportSummary";
import {
  ImportFilters,
  applyFilters,
} from "@/components/imports/ImportFilters";
import { QuestionPreviewTable } from "@/components/imports/QuestionPreviewTable";
import { QuestionReviewDialog } from "@/components/imports/QuestionReviewDialog";
import { QuestionEditDialog } from "@/components/imports/QuestionEditDialog";
import { DuplicateReviewDialog } from "@/components/imports/DuplicateReviewDialog";
import {
  buildSummary,
  parseFile,
  revalidateQuestions,
} from "@/lib/import-parser";
import { MOCK_QUESTIONS, MOCK_SUMMARY } from "@/lib/import-mock-data";
import { importQuestions, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  ImportFormat,
  ImportStatus,
  ParsedQuestion,
  ParseSummary,
} from "@/types/import-types";
import type { ImportQuestionsResult } from "@/types/questions";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Imports() {
  const queryClient = useQueryClient();
  // ── Upload state ──────────────────────────────────────────────────────────
  const [format, setFormat] = React.useState<ImportFormat>("xlsx");
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<ImportStatus>("idle");
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [importResult, setImportResult] =
    React.useState<ImportQuestionsResult | null>(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [questions, setQuestions] = React.useState<ParsedQuestion[]>([]);
  const [summary, setSummary] = React.useState<ParseSummary | null>(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [yearFilter, setYearFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [reviewQuestion, setReviewQuestion] =
    React.useState<ParsedQuestion | null>(null);
  const [editQuestion, setEditQuestion] = React.useState<ParsedQuestion | null>(
    null,
  );
  const [duplicateQuestion, setDuplicateQuestion] =
    React.useState<ParsedQuestion | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredQuestions = React.useMemo(
    () => applyFilters(questions, yearFilter, statusFilter, search),
    [questions, yearFilter, statusFilter, search],
  );

  const activeQuestions = React.useMemo(
    () => questions.filter((q) => q.duplicateResolution !== "remove"),
    [questions],
  );

  const liveSummary = React.useMemo(() => {
    if (!summary) return null;
    return buildSummary(activeQuestions, summary.contextRowCount);
  }, [activeQuestions, summary]);

  const duplicateMatch = React.useMemo(() => {
    if (!duplicateQuestion?.possibleDuplicateOf) return null;
    return (
      questions.find(
        (q) => q._clientId === duplicateQuestion.possibleDuplicateOf,
      ) ?? null
    );
  }, [duplicateQuestion, questions]);

  const keptDuplicates = activeQuestions.filter(
    (q) => q.status === "duplicate" && q.duplicateResolution === "keep",
  ).length;
  const removedCount = questions.filter(
    (q) => q.duplicateResolution === "remove",
  ).length;
  const remainingErrors = liveSummary?.errorCount ?? 0;

  const importMutation = useMutation({
    mutationFn: importQuestions,
    onSuccess: (result) => {
      setSubmitError(null);
      setImportResult(result);
      setStatus("submitted");
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    },
    onError: (error) => {
      setSubmitError(
        getApiErrorMessage(error, "Unable to submit questions for import."),
      );
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleFileSelected(f: File | null) {
    setFile(f);
    setParseError(null);
    if (!f) return;
  }

  async function handleProcess() {
    if (!file) return;
    setStatus("processing");
    setParseError(null);
    setProgress(10);

    // Simulate a brief delay so the processing state is visible
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 200);

    try {
      const result = await parseFile(file, format);
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      setQuestions(result.questions);
      setSummary(result.summary);
      setStatus("preview");
    } catch (err) {
      clearInterval(progressInterval);
      setParseError(
        err instanceof Error ? err.message : "Failed to parse file",
      );
      setStatus("error");
    }
  }

  async function handleUseMockData() {
    setStatus("processing");
    setParseError(null);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 20, 85));
    }, 150);

    await new Promise((r) => setTimeout(r, 900));
    clearInterval(progressInterval);
    setProgress(100);
    await new Promise((r) => setTimeout(r, 200));

    setQuestions(MOCK_QUESTIONS);
    setSummary(MOCK_SUMMARY);
    setStatus("preview");
  }

  function handleReset() {
    setFile(null);
    setStatus("idle");
    setParseError(null);
    setSubmitError(null);
    setProgress(0);
    setQuestions([]);
    setSummary(null);
    setImportResult(null);
    setYearFilter("all");
    setStatusFilter("all");
    setSearch("");
  }

  function handleEditQuestion(q: ParsedQuestion) {
    setEditQuestion(q);
  }

  function handleSaveEdit(updated: ParsedQuestion) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) => (q._clientId === updated._clientId ? updated : q)),
      ),
    );
    setEditQuestion(null);
  }

  function handleRemoveQuestion(clientId: string) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) =>
          q._clientId === clientId
            ? { ...q, duplicateResolution: "remove" as const }
            : q,
        ),
      ),
    );
  }

  function handleUndoRemove(clientId: string) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) =>
          q._clientId === clientId
            ? { ...q, duplicateResolution: "keep" as const }
            : q,
        ),
      ),
    );
  }

  function handleKeepDuplicate(clientId: string) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) =>
          q._clientId === clientId
            ? { ...q, duplicateResolution: "keep" as const }
            : q,
        ),
      ),
    );
  }

  async function handleSubmit() {
    const selectedQuestions = activeQuestions.map((q) => ({
        _clientId: q._clientId,
        rowIndex: q.rowIndex,
        year: q.year,
        subject: q.subject,
        text: q.text,
        hasImage: q.hasImage,
        options: q.options,
        answer: q.answer,
        status:
          q.status === "duplicate" && q.duplicateResolution === "keep"
            ? ("warning" as const)
            : q.status,
        statusReason: q.statusReason,
      }));

    setSubmitError(null);
    importMutation.mutate({ questions: selectedQuestions });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Import Questions</h1>
          <p className="text-sm text-muted-foreground">
            Bulk-ingest JAMB past questions from XLSX or JSON files.
          </p>
        </div>
        {status === "preview" && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            Start Over
          </Button>
        )}
      </div>

      <Separator className="my-2" />

      {/* ── IDLE / UPLOAD ── */}
      {(status === "idle" || status === "error") && (
        <UploadSection
          format={format}
          file={file}
          error={parseError}
          onFormatChange={(f) => {
            setFormat(f);
            setFile(null);
          }}
          onFile={handleFileSelected}
          onProcess={handleProcess}
          onUseMock={handleUseMockData}
        />
      )}

      {/* ── PROCESSING ── */}
      {status === "processing" && <ProcessingSection progress={progress} />}

      {/* ── SUBMITTED ── */}
      {status === "submitted" && importResult && (
        <SubmittedSection
          onReset={handleReset}
          questions={questions}
          result={importResult}
        />
      )}

      {/* ── PREVIEW ── */}
      {status === "preview" && liveSummary && (
        <div className="space-y-5">
          {/* Summary stats */}
          <ImportSummary summary={liveSummary} filename={file?.name} />

          <Separator />

          {/* Actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ImportFilters
              questions={questions}
              yearFilter={yearFilter}
              statusFilter={statusFilter}
              search={search}
              onYearChange={setYearFilter}
              onStatusChange={setStatusFilter}
              onSearchChange={setSearch}
            />
          </div>

          {/* Table */}
          <QuestionPreviewTable
            questions={filteredQuestions}
            totalCount={questions.length}
            onReview={(q) => setReviewQuestion(q)}
            onEdit={handleEditQuestion}
            onRemove={handleRemoveQuestion}
            onUndoRemove={handleUndoRemove}
          />

          <Separator />

          {/* Submission */}
          <SubmissionFooter
            summary={liveSummary}
            keptDuplicates={keptDuplicates}
            removedCount={removedCount}
            remainingErrors={remainingErrors}
            isSubmitting={importMutation.isPending}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {/* ── Dialogs ── */}
      <QuestionReviewDialog
        question={reviewQuestion}
        open={reviewQuestion !== null}
        onClose={() => setReviewQuestion(null)}
        onEdit={handleEditQuestion}
        onReviewDuplicate={
          reviewQuestion?.status === "duplicate"
            ? () => {
                setDuplicateQuestion(reviewQuestion);
                setReviewQuestion(null);
              }
            : undefined
        }
      />

      <QuestionEditDialog
        question={editQuestion}
        open={editQuestion !== null}
        onClose={() => setEditQuestion(null)}
        onSave={handleSaveEdit}
      />

      <DuplicateReviewDialog
        question={duplicateQuestion}
        matchingQuestion={duplicateMatch}
        open={duplicateQuestion !== null}
        onClose={() => setDuplicateQuestion(null)}
        onKeepBoth={() => {
          if (duplicateQuestion)
            handleKeepDuplicate(duplicateQuestion._clientId);
          setDuplicateQuestion(null);
        }}
        onRemoveThis={() => {
          if (duplicateQuestion)
            handleRemoveQuestion(duplicateQuestion._clientId);
          setDuplicateQuestion(null);
        }}
      />
    </>
  );
}

// ─── Upload section ────────────────────────────────────────────────────────────

function UploadSection({
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

function ProcessingSection({ progress }: { progress: number }) {
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

function SubmissionFooter({
  summary,
  keptDuplicates,
  removedCount,
  remainingErrors,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  summary: ParseSummary;
  keptDuplicates: number;
  removedCount: number;
  remainingErrors: number;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const activeCount = summary.totalQuestions;

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
          {activeCount.toLocaleString()} question{activeCount === 1 ? "" : "s"}{" "}
          across {summary.years.length} year
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
      </div>

      <Button
        size="lg"
        onClick={onSubmit}
        disabled={remainingErrors > 0 || isSubmitting}
      >
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

function SubmittedSection({
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
          <Button
            variant="ghost"
            render={<Link to={`/admin/imports/${result.importId}`} />}
          >
            View Import →
          </Button>
        )}
      </div>
    </div>
  );
}
