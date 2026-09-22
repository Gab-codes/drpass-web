import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

import {
  listMockExamAttempts,
  mockExamKeys,
} from "@/api/mock-exam";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MockExamAttempt } from "@/types/mock-exam";

// ─── Constants ────────────────────────────────────────────────────────────────

/** How many recent attempts the overview shows. The API clamps server-side. */
const RECENT_ATTEMPTS_LIMIT = 5;

// ─── Row ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AttemptRow({ attempt }: { attempt: MockExamAttempt }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
      <span className="font-medium text-foreground tabular-nums">
        {attempt.jambScore !== null ? (
          <>
            {attempt.jambScore}{" "}
            <span className="font-normal text-muted-foreground">/ 400</span>
          </>
        ) : (
          <span className="font-normal text-muted-foreground">
            {attempt.correctAnswers} correct
          </span>
        )}
      </span>
      <span className="flex-1 text-muted-foreground tabular-nums text-right sm:text-left">
        {attempt.correctAnswers} / {attempt.totalQuestions} correct
      </span>
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDate(attempt.completedAt)}
      </span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

/**
 * Recent completed Mock Exam attempts on the overview page.
 *
 * A calm, useful first version of history: the newest few completed attempts
 * with their raw performance and JAMB-style score. The request is a tiny
 * summary-only fetch — never the 180-question preparation, which only begins
 * after the student explicitly starts the exam.
 */
export function MockExamRecentAttempts() {
  const attemptsQuery = useQuery({
    queryKey: mockExamKeys.attempts(RECENT_ATTEMPTS_LIMIT),
    queryFn: ({ signal }) =>
      listMockExamAttempts(RECENT_ATTEMPTS_LIMIT, signal),
    staleTime: 30_000,
  });

  const { data: attempts, isPending, isError, refetch } = attemptsQuery;

  if (isPending) {
    return (
      <section aria-busy="true" aria-label="Recent attempts">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent attempts
        </h2>
        <div className="mt-3 border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section aria-label="Recent attempts">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent attempts
        </h2>
        <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            aria-hidden="true"
          >
            <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground" role="alert">
            We couldn&apos;t load your attempt history.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  if (attempts.length === 0) {
    return (
      <section aria-label="Recent attempts">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent attempts
        </h2>
        <p className="mt-3 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          You haven&apos;t taken a mock exam yet. Your results will appear here
          after you complete your first one.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Recent attempts">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Recent attempts
      </h2>
      <div className="mt-3 border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {attempts.map((attempt) => (
          <AttemptRow key={attempt.id} attempt={attempt} />
        ))}
      </div>
    </section>
  );
}
