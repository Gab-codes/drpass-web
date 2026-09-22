import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

import { mockExamKeys, prepareMockExamQuestions } from "@/api/mock-exam";
import { ExamShortcutsPanel } from "@/components/exam/keyboard-shortcuts-panel";
import { MockExamTips } from "@/components/mock-exam/mock-exam-tips";
import { Button } from "@/components/ui/button";
import { type ExamConfig } from "@/data/mock-exam";
import { useUser } from "@/hooks/use-user";
import { isDesktopViewport, requestFullscreen } from "@/lib/fullscreen";
import {
  MOCK_EXAM,
  MOCK_EXAM_ALLOCATION_MESSAGES,
  buildMockExamAllocation,
} from "@/lib/mock-exam";
import { useExamStore } from "@/store/exam-store";
import type { PracticeConfiguration } from "@/types/practice";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Route the student is returned to when they leave the Mock Exam session. */
const MOCK_EXAM_EXIT_PATH = "/mock-exam";

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * Mock Exam prepare route.
 *
 * Thin coordinator: derives the fixed JAMB UTME allocation from the
 * student's canonical subject combination, prepares the complete question
 * set through the real backend flow, and starts the exam only after the
 * student explicitly clicks Start. Preparation never consumes exam time —
 * the timer begins exclusively via `startExam()` on the Start action.
 */
export default function MockExamPreparePage() {
  const navigate = useNavigate();

  const setupExam = useExamStore((s) => s.setupExam);
  const startExam = useExamStore((s) => s.startExam);

  // The authenticated layout resolves the user before rendering this route.
  const { user } = useUser();

  // Explicit fixed-format allocation over the student's canonical subjects.
  const allocation = useMemo(
    () => (user ? buildMockExamAllocation(user.subjects.map((s) => s.code)) : null),
    [user],
  );

  const config: PracticeConfiguration | null = allocation?.ok
    ? {
        subjects: allocation.subjects,
        totalTimeMinutes: MOCK_EXAM.totalTimeMinutes,
      }
    : null;

  // ── Prepare questions (TanStack Query owns the request lifecycle) ─────────
  const prepareQuery = useQuery({
    queryKey: mockExamKeys.prepare(config!),
    queryFn: ({ signal }) => prepareMockExamQuestions(config!, signal),
    // The fixed config never changes while this screen is mounted, and a
    // prepared set must not be silently re-requested.
    enabled: config !== null,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: questions, isPending, isError, error, refetch } = prepareQuery;

  // Ready only when the complete fixed set arrived — the exam must receive
  // the full 180 questions before it starts (self-contained session).
  const isReady =
    !isPending &&
    !isError &&
    !!questions &&
    questions.length === MOCK_EXAM.totalQuestions;

  // Defensive: the backend fails loudly on shortfalls, so this should never
  // render — but an incomplete set must never present a working Start button.
  const isIncompleteSet =
    !isPending && !isError && !!questions && !isReady;

  const isIneligible = allocation !== null && !allocation.ok;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartMockExam = async () => {
    if (!isReady || !config) return;

    // Desktop only, attempted directly from this click gesture. Whatever the
    // outcome — success, rejection, unsupported API — the exam proceeds.
    if (isDesktopViewport()) {
      await requestFullscreen();
    }

    const examConfig: ExamConfig = {
      subjects: config.subjects,
      totalTimeMinutes: MOCK_EXAM.totalTimeMinutes,
      mode: "mock",
      exitPath: MOCK_EXAM_EXIT_PATH,
    };

    setupExam(examConfig, questions!);
    startExam();
    navigate("/mock-exam/exam", { replace: true });
  };

  const handleBackToOverview = () => navigate(MOCK_EXAM_EXIT_PATH);

  // ── Early return — user not resolved yet ───────────────────────────────────
  if (!user || !allocation) return null;

  // Student-facing message for the current preparation error.
  const errorMessage = isError
    ? error instanceof Error && error.message
      ? error.message
      : "Something went wrong while preparing your mock exam."
    : "The prepared question set is incomplete. Retry the preparation.";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto w-full max-w-md space-y-8 md:max-w-2xl">
        {/* Status */}
        <div className="flex flex-col items-center gap-4">
          {isPending && (
            <>
              <div
                className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin"
                aria-hidden="true"
              />
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                Preparing your mock exam...
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                {MOCK_EXAM.totalQuestions} questions are being selected from
                your subject combination. This usually takes a moment.
              </p>
            </>
          )}

          {isReady && (
            <>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-6" />
              </div>
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                Your mock exam is ready.
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                {MOCK_EXAM.totalQuestions} questions ·{" "}
                {MOCK_EXAM.totalTimeMinutes / 60} hours. The timer starts when
                you begin.
              </p>
            </>
          )}

          {(isError || isIncompleteSet) && (
            <>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
              </div>
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                We couldn't prepare your mock exam.
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground" role="alert">
                {errorMessage}
              </p>
            </>
          )}

          {isIneligible && (
            <>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning"
                aria-hidden="true"
              >
                <HugeiconsIcon icon={InformationCircleIcon} className="size-6" />
              </div>
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                Your subjects don't match the Mock Exam format.
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground" role="alert">
                {MOCK_EXAM_ALLOCATION_MESSAGES[allocation.reason]}
              </p>
            </>
          )}
        </div>

        {/* Exam guidance — hidden when there is nothing to prepare. */}
        {!isError && !isIncompleteSet && !isIneligible && <MockExamTips />}

        {/* Keyboard controls — desktop only, shared with the Practice prepare
            screen so the shortcut definitions live in one place. */}
        {!isError && !isIncompleteSet && !isIneligible && (
          <div className="hidden md:block">
            <ExamShortcutsPanel
              title="Keyboard Shortcuts"
              description="During the exam you can answer and navigate entirely from the keyboard:"
            />
          </div>
        )}

        {/* Call to Action */}
        <div className="flex flex-col gap-3 pt-2">
          {isError || isIncompleteSet ? (
            <>
              <Button size="lg" onClick={() => void refetch()}>
                Retry
              </Button>
              <Button variant="ghost" size="lg" onClick={handleBackToOverview}>
                Back to Overview
              </Button>
            </>
          ) : isIneligible ? (
            <Button variant="ghost" size="lg" onClick={handleBackToOverview}>
              Back to Overview
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full text-base h-12 rounded-xl"
              disabled={!isReady}
              onClick={() => void handleStartMockExam()}
            >
              Start Mock Exam
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

