import * as React from "react";
import { useParams, Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  FileSpreadsheetIcon,
  File01Icon,
  Calendar01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImportSummary } from "@/components/imports/ImportSummary";
import {
  ImportFilters,
  applyFilters,
} from "@/components/imports/ImportFilters";
import { QuestionPreviewTable } from "@/components/imports/QuestionPreviewTable";
import { QuestionReviewDialog } from "@/components/imports/QuestionReviewDialog";
import { DuplicateReviewDialog } from "@/components/imports/DuplicateReviewDialog";
import { getMockImportRecord } from "@/lib/import-mock-data";
import type { ParsedQuestion, ImportRecordStatus } from "@/types/import-types";

// ─── Status badge config ───────────────────────────────────────────────────────

function importStatusBadge(status: ImportRecordStatus) {
  switch (status) {
    case "Processing":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Processing
        </span>
      );
    case "Needs Review":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          Needs Review
        </span>
      );
    case "Submitted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
          Submitted
        </span>
      );
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Approved
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          Rejected
        </span>
      );
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShowImport() {
  const { importId } = useParams<{ importId: string }>();
  const record = getMockImportRecord(importId ?? "");

  // ── Filter state ──────────────────────────────────────────────────────────
  const [yearFilter, setYearFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [reviewQuestion, setReviewQuestion] =
    React.useState<ParsedQuestion | null>(null);
  const [duplicateQuestion, setDuplicateQuestion] =
    React.useState<ParsedQuestion | null>(null);

  const filteredQuestions = React.useMemo(
    () =>
      record
        ? applyFilters(record.questions, yearFilter, statusFilter, search)
        : [],
    [record, yearFilter, statusFilter, search],
  );

  const duplicateMatch = React.useMemo(() => {
    if (!duplicateQuestion?.possibleDuplicateOf || !record) return null;
    return (
      record.questions.find(
        (q) => q._clientId === duplicateQuestion.possibleDuplicateOf,
      ) ?? null
    );
  }, [duplicateQuestion, record]);

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!record) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <p className="text-sm text-muted-foreground">
          Import <span className="font-mono">{importId}</span> not found.
        </p>
        <Button
          variant="outline"
          size="sm"
          render={<Link to="/admin/imports" />}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
          Back to Imports
        </Button>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      {/* Back nav */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          render={<Link to="/admin/imports" />}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
          Imports
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <HugeiconsIcon
              icon={record.format === "xlsx" ? FileSpreadsheetIcon : File01Icon}
              className="h-5 w-5 text-muted-foreground"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold">{record.filename}</h1>
              {importStatusBadge(record.status)}
            </div>
            <p className="text-sm text-muted-foreground">{record.subject}</p>
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5" />
          {formatDate(record.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={UserCircleIcon} className="h-3.5 w-3.5" />
          {record.submittedBy}
        </span>
        <span className="uppercase font-mono">{record.format}</span>
      </div>

      <Separator className="my-3" />

      {/* Summary stats */}
      <ImportSummary
        summary={{
          totalRows: record.questionCount,
          totalQuestions: record.questionCount,
          years: record.years,
          validCount: record.validCount,
          warningCount: record.warningCount,
          errorCount: record.errorCount,
          duplicateCount: record.duplicateCount,
          contextRowCount: 0,
        }}
      />

      <Separator className="my-3" />

      {/* Question list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Questions</h2>

        <ImportFilters
          questions={record.questions}
          yearFilter={yearFilter}
          statusFilter={statusFilter}
          search={search}
          onYearChange={setYearFilter}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearch}
        />

        <QuestionPreviewTable
          questions={filteredQuestions}
          totalCount={record.questions.length}
          onReview={(q) => setReviewQuestion(q)}
          onEdit={() => {}}
          onRemove={() => {}}
          onUndoRemove={() => {}}
          readOnly
        />
      </div>

      {/* Dialogs */}
      <QuestionReviewDialog
        question={reviewQuestion}
        open={reviewQuestion !== null}
        onClose={() => setReviewQuestion(null)}
        onReviewDuplicate={
          reviewQuestion?.status === "duplicate"
            ? () => {
                setDuplicateQuestion(reviewQuestion);
                setReviewQuestion(null);
              }
            : undefined
        }
        readOnly
      />

      <DuplicateReviewDialog
        question={duplicateQuestion}
        matchingQuestion={duplicateMatch}
        open={duplicateQuestion !== null}
        onClose={() => setDuplicateQuestion(null)}
        onKeepBoth={() => setDuplicateQuestion(null)}
        onRemoveThis={() => setDuplicateQuestion(null)}
      />
    </>
  );
}
