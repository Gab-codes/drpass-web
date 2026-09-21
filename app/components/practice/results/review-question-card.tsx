import { cn } from "@/lib/utils";
import type { PracticeQuestion } from "@/types/practice";
import type { AnswerStatus } from "@/lib/practice-results";
import { getAnswerStatus } from "@/lib/practice-results";
import { StatusIcon } from "./status-icon";
import { ReviewOption } from "./review-option";

export function ReviewQuestionCard({
  question,
  index,
  answers,
}: {
  question: PracticeQuestion;
  index: number;
  answers: Record<string, string>;
}) {
  const status: AnswerStatus = getAnswerStatus(question, answers);
  const selectedOptionId = answers[question.id];

  const statusLabel =
    status === "correct"
      ? "Correct"
      : status === "incorrect"
        ? "Incorrect"
        : "Unanswered";

  return (
    <article
      aria-label={`Question ${index + 1}: ${statusLabel}`}
      className="border border-border rounded-2xl overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground mt-0.5 tabular-nums shrink-0">
          Q{index + 1}
        </span>
        <span className="flex-1 text-xs text-muted-foreground">
          {question.subject}
        </span>
        <span
          className={cn(
            "shrink-0 flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
            status === "correct" && "text-success bg-success/10",
            status === "incorrect" && "text-destructive bg-destructive/10",
            status === "unanswered" && "text-muted-foreground bg-muted",
          )}
        >
          <StatusIcon status={status} className="size-3" />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Question text */}
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-foreground">
          {question.text}
        </p>
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === question.correctOptionId;

          // Show only relevant options:
          // - The student's selected answer (if any)
          // - The correct answer (always)
          // - All options when both match (correct selection)
          const shouldShow =
            status === "correct"
              ? isSelected // only show selected (which is correct)
              : isSelected || isCorrect;

          if (!shouldShow) return null;

          return (
            <ReviewOption
              key={option.id}
              option={option}
              status={status}
              isSelected={isSelected}
              isCorrect={isCorrect}
            />
          );
        })}

        {/* Unanswered: show the correct answer with an explanation label */}
        {status === "unanswered" && (
          <p className="text-xs text-muted-foreground mt-2">
            No answer was selected.
          </p>
        )}
      </div>
    </article>
  );
}