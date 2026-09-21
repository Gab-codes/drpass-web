import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

import { useExamStore } from "@/store/exam-store";
import { ResultsSummary } from "@/components/practice/results/results-summary";
import { ReviewView } from "@/components/practice/results/review-view";

/**
 * Practice Results route.
 *
 * Orchestrates the summary/review views, reads the completed exam session
 * from the exam store, and handles navigation/lifecycle (timeout state,
 * direct-navigation guard, exiting the session). All rendering and
 * calculation live in the extracted feature components and utilities.
 */
export default function PracticeResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<"summary" | "review">("summary");

  const { questions, resetExam } = useExamStore();
  const timedOut =
    (location.state as { timedOut?: boolean } | null)?.timedOut ?? false;

  // Guard: if the store has no questions the student navigated here directly
  // (e.g. refreshed). Send them back to Practice setup.
  useEffect(() => {
    if (questions.length === 0) {
      navigate("/practice", { replace: true });
    }
  }, []);

  const handleExit = () => {
    resetExam();
    navigate("/practice");
  };

  if (view === "review") {
    return <ReviewView onBack={() => setView("summary")} />;
  }

  return (
    <ResultsSummary
      timedOut={timedOut}
      onReview={() => setView("review")}
      onExit={handleExit}
    />
  );
}
