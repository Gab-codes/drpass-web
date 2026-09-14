/**
 * Topic Classification Setup Page
 * Route: /admin/questions/classification
 *
 * Admin selects a subject, optionally enables force-reclassify,
 * then starts a bulk AI classification job. On success, navigates to the
 * job progress/results page.
 *
 * Scope: this page is independent of any specific subject URL — subject is
 * selected here as the job's scope parameter.
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
import { getAdminSubjects, questionKeys } from "@/api/questions";
import { createClassificationJob } from "@/api/ai-classification";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AdminSubjectSummary } from "@/types/questions";

export default function TopicClassificationSetup() {
  const navigate = useNavigate();
  const [subject, setSubject] = React.useState("");
  const [force, setForce] = React.useState(false);

  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    isError: subjectsError,
    error: subjectsErr,
  } = useQuery({
    queryKey: questionKeys.adminSubjects(),
    queryFn: getAdminSubjects,
  });

  const createJob = useMutation({
    mutationFn: createClassificationJob,
    onSuccess: (job) => {
      navigate(`/admin/questions/classification/${job.id}`);
    },
  });

  const selectedSubject: AdminSubjectSummary | undefined = subjects.find(
    (s) => s.subject === subject,
  );

  function handleStart() {
    if (!subject) return;
    createJob.mutate({ subject, force });
  }

  return (
    <div className="max-w-2xl">
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
            AI classifies approved questions into curriculum topics in bulk.
            You review and accept the suggestions — no canonical classification
            is created until you explicitly approve it.
          </p>
        </div>
      </div>

      <Separator className="my-5" />

      {/* ── Subject Select ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="classification-subject" className="text-sm font-medium">
            Subject
          </Label>
          <p className="text-xs text-muted-foreground">
            All approved, unclassified questions in this subject will be
            included in the batch.
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
            <Label htmlFor="force-reclassify" className="text-sm font-medium cursor-pointer">
              Re-classify already classified questions
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              When enabled, questions that already have a canonical
              classification will be re-processed. Results will go to manual
              review rather than auto-accepted.
            </p>
          </div>
        </div>

        {/* ── Error from mutation ───────────────────────────────────── */}
        {createJob.isError && (
          <Alert variant="destructive" className="text-sm">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
            {getApiErrorMessage(createJob.error, "Failed to start classification job")}
          </Alert>
        )}

        {/* ── Action ────────────────────────────────────────────────── */}
        <div className="flex justify-end pt-1">
          <Button
            onClick={handleStart}
            disabled={!subject || createJob.isPending}
            className="gap-2"
          >
            <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4" />
            {createJob.isPending ? "Starting…" : "Start AI Classification"}
          </Button>
        </div>

        {/* ── Informational note ────────────────────────────────────── */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Only one classification job can run at a time. Starting a new job
          while another is active will be rejected by the server.
        </p>
      </div>
    </div>
  );
}
