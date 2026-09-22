import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

import { useExamStore } from "@/store/exam-store";
import { ResultsSummary } from "@/components/practice/results/results-summary";
import { ReviewView } from "@/components/practice/results/review-view";
import { MockExamAttemptPersistence } from "@/components/mock-exam/mock-exam-attempt-persistence";

/**
 * Mock Exam Results route.
 *
 * Thin orchestrator, mirroring the Practice results route: reads the
 * completed session from the shared exam store and renders the shared
 * results views in `"mock"` variant (which adds the JAMB-style score).
 *
 * Also mounts the attempt persistence component: once the result is known,
 * the completed attempt is saved as durable history (idempotent, with an
 * explicit retryable notice if the save fails). Practice results do not
 * mount it, so Practice behavior is unchanged.
 */
export default function MockExamResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<"summary" | "review">("summary");

  const { questions, resetExam } = useExamStore();
  const timedOut =
    (location.state as { timedOut?: boolean } | null)?.timedOut ?? false;

  // Guard: if the store has no questions the student navigated here directly
  // (e.g. refreshed). Send them back to the Mock Exam overview.
  useEffect(() => {
    if (questions.length === 0) {
      navigate("/mock-exam", { replace: true });
    }
  }, []);

  const handleExit = () => {
    resetExam();
    navigate("/mock-exam");
  };

  if (view === "review") {
    return <ReviewView onBack={() => setView("summary")} />;
  }

  return (
    <>
      <MockExamAttemptPersistence />
      <ResultsSummary
        variant="mock"
        timedOut={timedOut}
        onReview={() => setView("review")}
        onExit={handleExit}
      />
    </>
  );
}
