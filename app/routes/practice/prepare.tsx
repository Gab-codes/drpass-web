import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { type ExamConfig, type Question } from "@/data/mock-exam";
import {
  PracticePrepareError,
  preparePracticeQuestions,
} from "@/lib/practice-api";
import { useExamStore } from "@/store/exam-store";
import type { PracticeSessionStart } from "@/types/practice";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRACTICE_EXIT_PATH = "/practice";

const EXAM_SHORTCUTS = [
  { key: "A / B / C / D", desc: "Select answer" },
  { key: "P", desc: "Previous question" },
  { key: "N", desc: "Next question" },
  { key: "S", desc: "Submit" },
  { key: "Y", desc: "Confirm" },
  { key: "R", desc: "Cancel" },
] as const;

// ─── Preparation state ─────────────────────────────────────────────────────

type PrepState = "preparing" | "ready" | "error";

// ─── Route ────────────────────────────────────────────────────────────────────

export default function PracticePreparePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Capture location state once on mount — it is stable for the component lifetime.
  const sessionStartRef = useRef(
    location.state as PracticeSessionStart | null,
  );
  const sessionStart = sessionStartRef.current;

  const setupExam = useExamStore((s) => s.setupExam);
  const startExam = useExamStore((s) => s.startExam);

  const [prepState, setPrepState] = useState<PrepState>("preparing");
  // Incremented by "Retry" to re-run the preparation request.
  const [attempt, setAttempt] = useState(0);

  // Holds the prepared questions — populated once preparation completes.
  const questionsRef = useRef<Question[]>([]);

  // Guard: no session state means the student navigated here directly.
  useEffect(() => {
    if (!sessionStart) {
      navigate(PRACTICE_EXIT_PATH, { replace: true });
    }
    // Intentionally empty deps — only runs on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prepare questions (real API) ───────────────────────────────────────────
  useEffect(() => {
    if (!sessionStart) return;

    let cancelled = false;
    const controller = new AbortController();

    async function prepare() {
      setPrepState("preparing");
      try {
        // ── API BOUNDARY ────────────────────────────────────────────────────
        // No filters are sent yet — the Practice UI does not expose them.
        const questions = await preparePracticeQuestions(
          {
            subjects: sessionStart!.subjects.map((s) => ({
              subjectCode: s.subjectCode,
              questionCount: s.questionCount,
            })),
            totalTimeMinutes: sessionStart!.totalTimeMinutes,
          },
          undefined,
          controller.signal,
        );
        // ────────────────────────────────────────────────────────────────────

        if (cancelled) return;

        if (questions.length === 0) {
          setPrepState("error");
          return;
        }

        // The exact API-returned set is what the exam will use. The exam page
        // never re-requests — it consumes the store populated on Start.
        questionsRef.current = questions;
        setPrepState("ready");
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        if (error instanceof PracticePrepareError && error.code === "network") {
          console.warn("Practice preparation network error:", error.message);
        }
        setPrepState("error");
      }
    }

    void prepare();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-runs only when the student hits Retry (attempt changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // ── Early return — guard rendered after guards run ─────────────────────────
  if (!sessionStart) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartPractice = () => {
    if (prepState !== "ready") return;

    const examConfig: ExamConfig = {
      subjects: sessionStart.subjects.map((s) => ({
        subjectCode: s.subjectCode,
        questionCount: s.questionCount,
      })),
      totalTimeMinutes: sessionStart.totalTimeMinutes,
      exitPath: PRACTICE_EXIT_PATH,
    };

    // Both actions complete before navigation — the exam mounts with
    // status === "in-progress" and the timer already running.
    setupExam(examConfig, questionsRef.current);
    startExam();
    navigate("/practice/exam", { replace: true });
  };

  const handleGoBack = () => navigate(PRACTICE_EXIT_PATH);

  const isReady = prepState === "ready";
  const isError = prepState === "error";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto w-full max-w-md space-y-10">
        
        {/* Status Indicator */}
        <div className="flex flex-col items-center gap-4">
          {prepState === "preparing" && (
            <>
              <div 
                className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" 
                aria-hidden="true" 
              />
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                Preparing your practice...
              </h1>
            </>
          )}

          {prepState === "ready" && (
            <>
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                Your practice is ready.
              </h1>
            </>
          )}

          {prepState === "error" && (
            <>
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-foreground tracking-tight">
                We couldn't prepare your practice.
              </h1>
            </>
          )}
        </div>

        {/* Keyboard Shortcuts (Desktop Only, Ready State Only) */}
        {isReady && (
          <div className="hidden md:block border border-border/60 bg-muted/30 rounded-2xl p-6 text-left">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4 text-center">
              Keyboard Shortcuts
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {EXAM_SHORTCUTS.map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-3">
                  <dt>
                    <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded border border-border bg-background text-xs font-mono font-medium text-foreground shadow-sm">
                      {key}
                    </kbd>
                  </dt>
                  <dd className="text-sm text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Call to Action */}
        <div className="flex flex-col gap-3 pt-4">
          {isError ? (
            <>
              <Button size="lg" onClick={() => setAttempt((n) => n + 1)}>
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
