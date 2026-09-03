import { cn } from "@/lib/utils";
import type { Question } from "@/data/mock-exam";

interface ExamNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  onNavigate: (index: number) => void;
}

export function ExamNavigator({
  questions,
  currentIndex,
  answers,
  onNavigate,
}: ExamNavigatorProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Question navigation">
      {questions.map((q, index) => {
        const isAnswered = Boolean(answers[q.id]);
        const isCurrent = index === currentIndex;

        let ariaLabel = `Question ${index + 1}`;
        if (isCurrent) ariaLabel += ", current";
        if (isAnswered) ariaLabel += ", answered";

        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={ariaLabel}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              // Base: min 36px touch target, label-size
              "relative flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-all duration-100 outline-none cursor-pointer",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              // Current
              isCurrent &&
                "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
              // Answered (not current)
              !isCurrent && isAnswered && "bg-accent text-accent-foreground border-2 border-primary/40",
              // Unanswered (not current)
              !isCurrent && !isAnswered && "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {index + 1}
            {/* Answered dot — secondary indicator beyond color */}
            {isAnswered && !isCurrent && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
