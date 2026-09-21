import type { AnswerStatus, PracticeScoreSummary } from "@/lib/practice-results";
import { StatusIcon } from "./status-icon";

/**
 * Correct / Incorrect / Unanswered stat strip for the Results summary.
 */
export function ResultStats({ summary }: { summary: PracticeScoreSummary }) {
  const stats: { label: string; value: number; status: AnswerStatus }[] = [
    { label: "Correct", value: summary.totalCorrect, status: "correct" },
    { label: "Incorrect", value: summary.totalIncorrect, status: "incorrect" },
    { label: "Unanswered", value: summary.totalUnanswered, status: "unanswered" },
  ];

  return (
    <section aria-label="Score breakdown" className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, status }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-4"
        >
          <StatusIcon status={status} className="size-5" />
          <span className="text-xl font-bold tabular-nums text-foreground">
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </section>
  );
}