import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { useExamStore } from "@/store/exam-store";
import { Button } from "@/components/ui/button";
import { ReviewQuestionCard } from "./review-question-card";

/**
 * Answer review view: header, per-question review cards, and a back action.
 * Reads the exam session snapshot from the exam store, matching the
 * convention used by other exam feature components (e.g. SubmitDialog).
 */
export function ReviewView({ onBack }: { onBack: () => void }) {
  const { questions, answers } = useExamStore();

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="Back to Results summary"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4"
              aria-hidden="true"
            />
            Results
          </button>
          <span className="text-sm font-medium text-foreground">Review</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {questions.length} questions
          </span>
        </div>
      </header>

      <main
        id="review-content"
        className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4"
      >
        <p className="text-xs text-muted-foreground">
          Showing your answer and the correct answer for each question.
        </p>
        {questions.map((q, i) => (
          <ReviewQuestionCard
            key={q.id}
            question={q}
            index={i}
            answers={answers}
          />
        ))}

        <div className="pt-4 pb-8">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl"
            onClick={onBack}
          >
            Back to Results
          </Button>
        </div>
      </main>
    </div>
  );
}