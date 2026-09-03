import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExamControlsProps {
  currentIndex: number;
  totalQuestions: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function ExamControls({
  currentIndex,
  totalQuestions,
  onPrev,
  onNext,
  onSubmit,
}: ExamControlsProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        onClick={onPrev}
        disabled={isFirst}
        aria-keyshortcuts="p"
        className={cn("gap-1.5", isFirst && "invisible")}
        aria-label="Previous question"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Prev
        <kbd className="ml-1 text-xs text-muted-foreground/70 font-mono">P</kbd>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onSubmit}
        aria-keyshortcuts="s"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        aria-label="Submit practice session"
      >
        Submit
        <kbd className="ml-1 text-xs font-mono opacity-60">S</kbd>
      </Button>

      <Button
        variant={isLast ? "outline" : "default"}
        onClick={isLast ? onSubmit : onNext}
        aria-keyshortcuts={isLast ? "s" : "n"}
        aria-label={isLast ? "Submit practice session" : "Next question"}
        className="gap-1.5"
      >
        {isLast ? (
          "Submit"
        ) : (
          <>
            Next
            <kbd className="ml-1 text-xs text-primary-foreground/60 font-mono">
              N
            </kbd>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </Button>
    </div>
  );
}
