import { Button } from "@/components/ui/button";
import type { PracticeSummaryData } from "@/types/practice";

interface PracticeConfirmationContentProps {
  summary: PracticeSummaryData;
  /** Closes the confirmation and returns to the setup screen. */
  onEdit: () => void;
  onStart: () => void;
}

/**
 * The confirmation itself: what the student is about to start, and the two
 * actions available. Rendered by both the desktop Dialog and the mobile Drawer.
 */
export function PracticeConfirmationContent({
  summary,
  onEdit,
  onStart,
}: PracticeConfirmationContentProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/40 p-4">
        <div className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {summary.totalQuestions}
          </p>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Questions
          </p>
        </div>
        <div aria-hidden="true" className="h-10 w-px bg-border" />
        <div className="space-y-1 text-right">
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {summary.totalTimeMinutes}
          </p>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Minutes
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">
          Subject breakdown
        </h3>
        <dl className="space-y-2">
          {summary.subjects.map((subject) => (
            <div
              key={subject.code}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <dt className="text-muted-foreground">{subject.name}</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {subject.count}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full sm:h-9 sm:w-auto"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          type="button"
          className="h-11 w-full sm:h-9 sm:w-auto"
          onClick={onStart}
        >
          Start Practice
        </Button>
      </div>
    </div>
  );
}