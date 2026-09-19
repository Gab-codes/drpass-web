import * as React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  AlertCircleIcon,
  Tag01Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  aiClassificationKeys,
  listClassificationSubjects,
} from "@/api/ai-classification";
import { getAdminSubjects, questionKeys } from "@/api/admin-questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { ClassificationHistoryGroupCard } from "@/components/admin/classification/ClassificationHistoryGroupCard";
import type { ClassificationSubjectSummary } from "@/types/questions";

/**
 * Topic Classification History — the landing level of the subject-first
 * history. It lists the subjects classification history is relevant for and
 * links into each subject's jobs; the existing job page stays the detailed
 * inspection surface.
 *
 * Subjects come from the Question Bank subjects summary (the same list the
 * classification setup page offers). Their history summaries come from one
 * aggregated read of `ai_classification_jobs`; the two are merged by name.
 */
export default function TopicClassificationHistory() {
  const {
    data: subjectSummaries = [],
    isLoading: subjectsLoading,
    isError: subjectsError,
    error: subjectsErr,
  } = useQuery({
    queryKey: questionKeys.adminSubjects(),
    queryFn: getAdminSubjects,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: historySummaries = [],
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
  } = useQuery({
    queryKey: aiClassificationKeys.subjects(),
    queryFn: listClassificationSubjects,
  });

  // Subjects are matched case-insensitively (the history groups them that way)
  // while the Question Bank casing is what gets displayed.
  const historyBySubject = React.useMemo(() => {
    const map = new Map<string, ClassificationSubjectSummary>();
    for (const row of historySummaries) {
      if (row.subject) map.set(row.subject.toLowerCase(), row);
    }
    return map;
  }, [historySummaries]);

  // Jobs recorded without a subject are grouped as custom selections rather
  // than dropped from the history.
  const customSelections = historySummaries.find((row) => row.subject === null);

  const isError = subjectsError || historyError;
  const error = subjectsError ? subjectsErr : historyErr;
  const subjects = subjectSummaries.map((s) => s.subject);

  return (
    <div className="max-w-full">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
            <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Topic Classification History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Past AI classification jobs by subject — pick a subject to see its
              runs and their outcomes.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link to="/admin/questions/classification" />}
        >
          <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
          New Classification
        </Button>
      </div>

      <Separator className="my-5" />

      {isError && (
        <Alert variant="destructive" className="mb-4 text-sm">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(error, "Failed to load classification history")}
        </Alert>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {subjectsLoading && (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading classification history"
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {/* ── Empty (no subjects to classify) ────────────────────────── */}
      {!subjectsLoading && !isError && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <HugeiconsIcon icon={InboxIcon} className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium">No subjects yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Classification runs over approved questions. Add or import questions
            in the Question Bank to start building classification history.
          </p>
          <Button
            size="sm"
            className="mt-3"
            render={<Link to="/admin/questions" />}
          >
            Go to Question Bank
          </Button>
        </div>
      )}

      {/* ── Subject cards ───────────────────────────────────────────── */}
      {!subjectsLoading && subjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <ClassificationHistoryGroupCard
              key={subject}
              subject={subject}
              summary={historyBySubject.get(subject.toLowerCase())}
              isSummaryPending={historyLoading}
            />
          ))}
          {customSelections && (
            <ClassificationHistoryGroupCard
              subject={null}
              summary={customSelections}
              isSummaryPending={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
