import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

import { preparePracticeQuestions, practiceKeys } from "@/api/practice";
import { ExamShortcutsPanel } from "@/components/exam/keyboard-shortcuts-panel";
import { Button } from "@/components/ui/button";
import { type ExamConfig } from "@/data/mock-exam";
import { useExamStore } from "@/store/exam-store";
import type {
  PracticeConfiguration,
  PracticeSessionStart,
} from "@/types/practice";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRACTICE_EXIT_PATH = "/practice";


// ─── Route ────────────────────────────────────────────────────────────────────

export default function PracticePreparePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Capture location state once on mount — it is stable for the component lifetime.
  const sessionStartRef = useRef(location.state as PracticeSessionStart | null);
  const sessionStart = sessionStartRef.current;

  const setupExam = useExamStore((s) => s.setupExam);
  const startExam = useExamStore((s) => s.startExam);

  // Guard: no session state means the student navigated here directly.
  useEffect(() => {
    if (!sessionStart) {
      navigate(PRACTICE_EXIT_PATH, { replace: true });
    }
    // Intentionally empty deps — only runs on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prepare questions (TanStack Query owns the request lifecycle) ─────────
  const config: PracticeConfiguration | null = sessionStart
    ? {
        subjects: sessionStart.subjects.map((s) => ({
          subjectCode: s.subjectCode,
          questionCount: s.questionCount,
        })),
        totalTimeMinutes: sessionStart.totalTimeMinutes,
      }
    : null;

  const prepareQuery = useQuery({
    queryKey: practiceKeys.prepare(config!),
    queryFn: ({ signal }) => preparePracticeQuestions(config!, undefined, signal),
    // The session config never changes while this screen is mounted, and a
    // prepared set must not be silently re-requested.
    enabled: config !== null,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: questions, isPending, isError, error, refetch } = prepareQuery;

  const isReady = !isPending && !isError && !!questions && questions.length > 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartPractice = () => {
    if (!isReady || !sessionStart) return;

    const examConfig: ExamConfig = {
      subjects: sessionStart.subjects.map((s) => ({
        subjectCode: s.subjectCode,
        questionCount: s.questionCount,
      })),
      totalTimeMinutes: sessionStart.totalTimeMinutes,
      exitPath: PRACTICE_EXIT_PATH,
    };

    setupExam(examConfig, questions!);
    startExam();
    navigate("/practice/exam", { replace: true });
  };

  const handleGoBack = () => navigate(PRACTICE_EXIT_PATH);

  // ── Early return — guard rendered after guards run ─────────────────────────
  if (!sessionStart) return null;

  // Student-facing message for the current preparation error.
  const errorMessage = isError
    ? error instanceof Error && error.message
      ? error.message
      : "Something went wrong while preparing your practice."
    : null;

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
                Preparing your questions...
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                We are selecting your questions from the question bank. This
                usually takes a moment.
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
                Your practice is ready.
              </h1>
              <p className="text-sm text-muted-foreground">
                {questions!.length} questions are prepared. Start whenever
                you're ready.
              </p>
            </>
          )}

          {isError && (
            <>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
              </div>
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                We couldn't prepare your practice.
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground" role="alert">
                {errorMessage}
              </p>
            </>
          )}
        </div>

        {/* Keyboard controls — desktop only, visible while preparing and ready
            so the preflight screen doubles as the controls tutorial. */}
        {!isError && (
          <div className="hidden md:block">
            <ExamShortcutsPanel />
          </div>
        )}

        {/* Call to Action */}
        <div className="flex flex-col gap-3 pt-2">
          {isError ? (
            <>
              <Button size="lg" onClick={() => void refetch()}>
                Retry
              </Button>
              <Button variant="ghost" size="lg" onClick={handleGoBack}>
                Back to Practice
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              className="w-full text-base h-12 rounded-xl"
              disabled={!isReady}
              onClick={handleStartPractice}
            >
              Start Practice
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

