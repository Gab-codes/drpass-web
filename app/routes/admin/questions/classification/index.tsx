/**
 * Topic Classification Setup Page
 * Route: /admin/questions/classification
 *
 * Admin picks a subject, selects exactly which eligible questions to classify
 * (individually, per page, or all eligible), then starts a bulk AI job for
 * those explicit question ids. On success, navigates to the job page.
 *
 * The selection made here is the source of truth: the job is ALWAYS created
 * with explicit `questionIds`, never a subject-wide scope. Pagination, search
 * and filter changes never drop selected ids.
 */

import * as React from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tag01Icon,
  AlertCircleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminQuestions,
  getAdminQuestionIds,
  getAdminSubjects,
  questionKeys,
} from "@/api/admin-questions";
import { QuestionFilters } from "@/components/admin/questions/QuestionFilters";
import { QuestionSelectionList } from "@/components/admin/classification/QuestionSelectionList";
import { useQuestionSelection } from "@/hooks/use-question-selection";
import { createClassificationJob } from "@/api/ai-classification";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AdminSubjectSummary } from "@/types/questions";

const PAGE_SIZE = 50;

export default function TopicClassificationSetup() {
  const navigate = useNavigate();
  const [subject, setSubject] = React.useState("");
  const [force, setForce] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const selection = useQuestionSelection();
  const { clear: clearSelection, selectAllEligible } = selection;

  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    isError: subjectsError,
    error: subjectsErr,
  } = useQuery({
    queryKey: questionKeys.adminSubjects(),
    queryFn: getAdminSubjects,
  });

  // Eligibility: approved questions, and — unless the admin opts to force —
  // questions that have not been classified yet.
  const eligibleFilters = React.useMemo(
    () => ({
      subject,
      status: "approved" as const,
      ...(force ? {} : { classification: "unclassified" as const }),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [subject, force, search],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: questionKeys.adminList({
      ...eligibleFilters,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      getAdminQuestions({ ...eligibleFilters, page, pageSize: PAGE_SIZE }),
    enabled: Boolean(subject),
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;
  const eligibleTotal = meta?.total ?? 0;
  const pageIds = React.useMemo(() => questions.map((q) => q.id), [questions]);

  // "Select all eligible" materialises every eligible id explicitly, in one
  // request, so no question record is loaded into state for the selection.
  const selectAllMutation = useMutation({
    mutationFn: () => getAdminQuestionIds(eligibleFilters, eligibleTotal),
    onSuccess: selectAllEligible,
  });

  const createJob = useMutation({
    mutationFn: createClassificationJob,
    onSuccess: (job) => {
      clearSelection();
      navigate(`/admin/questions/classification/${job.id}`);
    },
    // No onError handler on purpose: a failed creation must preserve the
    // admin's selection so they can retry without re-selecting.
  });

  // A different subject is a different eligible set: reset paging + selection.
  // Pagination/search/filter changes deliberately do NOT clear the selection.
  React.useEffect(() => {
    setSearch("");
    setPage(1);
    clearSelection();
  }, [subject, clearSelection]);

  React.useEffect(() => {
    setPage(1);
  }, [search, force]);

  const selectedSubject: AdminSubjectSummary | undefined = subjects.find(
    (s) => s.subject === subject,
  );

  const selectedCount = selection.selectedCount;
  const ctaLabel = createJob.isPending
    ? "Starting…"
    : `Classify ${selectedCount} Question${selectedCount === 1 ? "" : "s"}`;

  function handleStart() {
    if (selectedCount === 0) return;
    setConfirmOpen(false);
    // Explicit ids — the admin's selection is the source of truth.
    createJob.mutate({
      questionIds: Array.from(selection.selectedIds),
      force,
    });
  }

  return (
    <div className="max-w-5xl">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
          <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            Topic Classification
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI classifies approved questions into curriculum topics. Choose
            exactly which questions to submit, then review and accept the
            suggestions — no canonical classification is created until you
            explicitly approve it.
          </p>
        </div>
      </div>

      <Separator className="my-5" />

      {/* ── Subject Select ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="classification-subject"
            className="text-sm font-medium"
          >
            Subject
          </Label>
          <p className="text-xs text-muted-foreground">
            Only approved questions are eligible for classification. Pick the
            exact questions to submit below.
          </p>

          {subjectsLoading ? (
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          ) : subjectsError ? (
            <Alert variant="destructive" className="text-sm">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
              {getApiErrorMessage(subjectsErr, "Could not load subjects")}
            </Alert>
          ) : (
            <select
              id="classification-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="">Select a subject…</option>
              {subjects.map((s) => (
                <option key={s.subject} value={s.subject}>
                  {s.subject}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── Subject Stats ─────────────────────────────────────────── */}
        {selectedSubject && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{selectedSubject.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-lg font-semibold text-success">
                {selectedSubject.approved}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold text-warning">
                {selectedSubject.pending}
              </p>
            </div>
          </div>
        )}

        {/* ── Force Reclassify Toggle ────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <Switch
            id="force-reclassify"
            checked={force}
            onCheckedChange={setForce}
            className="mt-0.5"
          />
          <div>
            <Label
              htmlFor="force-reclassify"
              className="text-sm font-medium cursor-pointer"
            >
              Re-classify already classified questions
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              When enabled, already-classified questions become selectable
              again. Results go to manual review rather than being
              auto-accepted.
            </p>
          </div>
        </div>

        {/* ── Selection workspace ───────────────────────────────────── */}
        {subject && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {isLoading && !data
                  ? "Loading…"
                  : `${eligibleTotal} eligible question${eligibleTotal === 1 ? "" : "s"}`}
              </p>
              <p className="text-sm font-medium">{selectedCount} selected</p>
            </div>

            <QuestionFilters
              search={search}
              onSearchChange={setSearch}
              page={meta?.page ?? page}
              totalPages={meta?.totalPages ?? 1}
              total={eligibleTotal}
              isLoading={isLoading}
              onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
              onNextPage={() =>
                setPage((p) => Math.min(meta?.totalPages ?? 1, p + 1))
              }
            />

            {isError && (
              <Alert variant="destructive" className="text-sm">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
                {getApiErrorMessage(error, "Failed to load eligible questions")}
              </Alert>
            )}

            <QuestionSelectionList
              questions={questions}
              isLoading={isLoading}
              isSelectingAll={selectAllMutation.isPending}
              eligibleTotal={eligibleTotal}
              isSelected={selection.isSelected}
              allEligibleSelected={selection.allEligibleSelected}
              onToggle={selection.toggle}
              onTogglePage={(checked) => selection.togglePage(pageIds, checked)}
              onSelectAllEligible={() => selectAllMutation.mutate()}
              onClearSelection={clearSelection}
            />

            {selectAllMutation.isError && (
              <Alert variant="destructive" className="text-sm">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
                {getApiErrorMessage(
                  selectAllMutation.error,
                  "Failed to select all eligible questions",
                )}
              </Alert>
            )}
          </>
        )}

        {/* ── Error from mutation ───────────────────────────────────── */}
        {createJob.isError && (
          <Alert variant="destructive" className="text-sm">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
            {getApiErrorMessage(
              createJob.error,
              "Failed to start classification job",
            )}
          </Alert>
        )}

        {/* ── Action ────────────────────────────────────────────────── */}
        <div className="flex justify-end pt-1">
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={selectedCount === 0 || createJob.isPending}
            className="gap-2"
          >
            <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4" />
            {ctaLabel}
          </Button>
        </div>

        {/* ── Informational note ────────────────────────────────────── */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Only one classification job can run at a time. Starting a new job
          while another is active will be rejected by the server.
        </p>
      </div>

      {/* ── Confirmation ───────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Classify {selectedCount} question
              {selectedCount === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              This will send {selectedCount} eligible question
              {selectedCount === 1 ? "" : "s"} to the AI classification
              pipeline. Nothing becomes a canonical classification until you
              accept it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStart}>Start Classification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
