import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

import { saveMockExamAttempt } from "@/api/mock-exam";
import { Button } from "@/components/ui/button";
import { calculateMockExamScore } from "@/lib/mock-exam-score";
import { useExamStore } from "@/store/exam-store";
import {
  toMockExamAttemptPayload,
  type MockExamAttemptPayload,
} from "@/types/mock-exam";

/**
 * Persists the completed Mock Exam attempt once, at the authoritative point
 * where the final result is known (the results screen).
 *
 * - Runs only for Mock Exam sessions (`config.mode === "mock"`); Practice is
 *   untouched.
 * - The attempt id is generated once per completion and acts as the backend
 *   idempotency key, so a retry or double render can never create a second
 *   history entry.
 * - A failed save is never silent: a small retryable notice is rendered —
 *   the result page itself is unaffected.
 */
export function MockExamAttemptPersistence() {
  const { questions, answers, config, startedAt, completedAt } = useExamStore();

  const saveAttempt = useMutation({
    mutationFn: (payload: MockExamAttemptPayload) =>
      saveMockExamAttempt(payload),
    // A failed save should not retry behind the student's back; the notice
    // offers an explicit retry instead.
    retry: false,
  });

  const payload = useMemo(() => {
    if (!config || config.mode !== "mock" || questions.length === 0) return null;
    const score = calculateMockExamScore(questions, answers, config);
    return toMockExamAttemptPayload("", score, { startedAt, completedAt });
  }, [config, questions, answers, startedAt, completedAt]);

  // One stable id per completed session, generated lazily in the browser.
  const attemptIdRef = useRef<string | null>(null);
  const requestedRef = useRef(false);

  const ensureAttemptId = () => {
    if (!attemptIdRef.current) {
      attemptIdRef.current =
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    }
    return attemptIdRef.current;
  };

  useEffect(() => {
    if (!payload || requestedRef.current) return;
    requestedRef.current = true;
    saveAttempt.mutate({ ...payload, attemptId: ensureAttemptId() });
    // Persist exactly once per completed session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  if (!payload) return null;

  if (saveAttempt.isError) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
      >
        <HugeiconsIcon
          icon={AlertCircleIcon}
          className="size-4 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p>
            Your result couldn&apos;t be saved to your history. You can still
            review this exam, and it won&apos;t appear under Recent attempts
            until it saves.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() =>
              saveAttempt.mutate({ ...payload, attemptId: ensureAttemptId() })
            }
          >
            Try saving again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
