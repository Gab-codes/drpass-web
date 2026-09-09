import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FloppyDiskIcon,
  Rotate01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImportSummary } from "@/components/admin/imports/ImportSummary";
import { ImportFilters } from "@/components/admin/imports/ImportFilters";
import { QuestionPreviewTable } from "@/components/admin/imports/QuestionPreviewTable";
import { QuestionReviewDialog } from "@/components/admin/imports/QuestionReviewDialog";
import { QuestionEditDialog } from "@/components/admin/imports/QuestionEditDialog";
import { DuplicateReviewDialog } from "@/components/admin/imports/DuplicateReviewDialog";
import { useImportWorkflow } from "@/hooks/use-import-workflow";
import {
  DraftBanner,
  ImportSourceSelector,
  UploadSection,
  ProcessingSection,
  SubmissionFooter,
  SubmittedSection,
} from "@/components/admin/imports/ImportSections";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Imports() {
  const { state, actions } = useImportWorkflow();

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Import Questions</h1>
          <p className="text-sm text-muted-foreground">
            Bulk-ingest past questions from XLSX or JSON files.
          </p>
        </div>
        {state.status === "preview" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={actions.handleSaveDraft}>
              <HugeiconsIcon icon={FloppyDiskIcon} className="h-3.5 w-3.5" />
              Save Draft
            </Button>
            <Button variant="outline" size="sm" onClick={actions.handleReset}>
              Start Over
            </Button>
          </div>
        )}
      </div>

      <Separator className="my-2" />

      {/* ── Draft banner (idle only, before any action this session) ── */}
      {(state.status === "idle" || state.status === "error") &&
        state.draftExists &&
        !state.draftHandled && (
          <DraftBanner
            savedAt={state.draft.savedAt ?? null}
            questionCount={state.draft.questions?.length ?? 0}
            onRestore={actions.handleRestoreDraft}
            onDiscard={actions.handleDiscardDraft}
          />
        )}

      {/* ── IDLE / UPLOAD ── */}
      {(state.status === "idle" || state.status === "error") && (
        <UploadSection
          format={state.format}
          file={state.file}
          error={state.parseError}
          onFormatChange={(f) => {
            actions.setFormat(f);
            actions.setFile(null);
          }}
          onFile={actions.handleFileSelected}
          onProcess={actions.handleProcess}
          onUseMock={actions.handleUseMockData}
        />
      )}

      {/* ── PROCESSING ── */}
      {state.status === "processing" && <ProcessingSection progress={state.progress} />}

      {/* ── SUBMITTED ── */}
      {state.status === "submitted" && state.importResult && (
        <SubmittedSection
          onReset={actions.handleReset}
          questions={state.questions}
          result={state.importResult}
        />
      )}

      {/* ── PREVIEW ── */}
      {state.status === "preview" && state.liveSummary && (
        <div className="space-y-5">
          {/* Summary stats */}
          <ImportSummary summary={state.liveSummary} filename={state.file?.name} />

          <Separator />

          {/* Source selector */}
          <ImportSourceSelector
            detectedSource={state.detectedSource}
            selectedSource={state.importSource}
            onChange={(src) => {
              actions.setImportSource(src);
              actions.setQuestions((prev) => prev.map((q) => ({ ...q, source: src })));
            }}
          />

          <Separator />

          {/* Actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ImportFilters
              questions={state.questions}
              yearFilter={state.yearFilter}
              statusFilter={state.statusFilter}
              search={state.search}
              onYearChange={actions.setYearFilter}
              onStatusChange={actions.setStatusFilter}
              onSearchChange={actions.setSearch}
            />
          </div>

          {/* Table */}
          <QuestionPreviewTable
            questions={state.filteredQuestions}
            totalCount={state.questions.length}
            onReview={(q) => actions.setReviewQuestion(q)}
            onEdit={actions.handleEditQuestion}
            onRemove={actions.handleRemoveQuestion}
            onUndoRemove={actions.handleUndoRemove}
          />

          <Separator />

          {/* Submission */}
          <SubmissionFooter
            summary={state.liveSummary}
            keptDuplicates={state.keptDuplicates}
            removedCount={state.removedCount}
            remainingErrors={state.remainingErrors}
            importSource={state.importSource}
            isSubmitting={state.isSubmitting}
            submitError={state.submitError}
            onSubmit={actions.handleSubmit}
          />
        </div>
      )}

      {/* ── New-upload guard dialog ── */}
      <Dialog
        open={state.showUploadGuard}
        onOpenChange={(v) => !v && actions.setShowUploadGuard(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You have a saved draft</DialogTitle>
            <DialogDescription>
              You have a draft with {state.draft.questions?.length ?? 0} question
              {(state.draft.questions?.length ?? 0) === 1 ? "" : "s"} saved from a previous
              session. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                actions.setShowUploadGuard(false);
                actions.handleRestoreDraft();
              }}
            >
              <HugeiconsIcon icon={Rotate01Icon} className="h-3.5 w-3.5" />
              Restore Draft
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                actions.setShowUploadGuard(false);
                actions.handleGuardDiscardAndProcess();
              }}
            >
              Discard & Process New File
            </Button>
            <Button variant="ghost" onClick={() => actions.setShowUploadGuard(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialogs ── */}

      <QuestionReviewDialog
        question={state.reviewQuestion}
        open={state.reviewQuestion !== null}
        onClose={() => actions.setReviewQuestion(null)}
        onEdit={actions.handleEditQuestion}
        onReviewDuplicate={
          state.reviewQuestion?.status === "duplicate"
            ? () => {
                actions.setDuplicateQuestion(state.reviewQuestion);
                actions.setReviewQuestion(null);
              }
            : undefined
        }
      />

      <QuestionEditDialog
        question={state.editQuestion}
        open={state.editQuestion !== null}
        onClose={() => actions.setEditQuestion(null)}
        onSave={actions.handleSaveEdit}
      />

      <DuplicateReviewDialog
        question={state.duplicateQuestion}
        matchingQuestion={state.duplicateMatch}
        open={state.duplicateQuestion !== null}
        onClose={() => actions.setDuplicateQuestion(null)}
        onKeepBoth={() => {
          if (state.duplicateQuestion)
            actions.handleKeepDuplicate(state.duplicateQuestion._clientId);
          actions.setDuplicateQuestion(null);
        }}
        onRemoveThis={() => {
          if (state.duplicateQuestion)
            actions.handleRemoveQuestion(state.duplicateQuestion._clientId);
          actions.setDuplicateQuestion(null);
        }}
      />
    </>
  );
}
