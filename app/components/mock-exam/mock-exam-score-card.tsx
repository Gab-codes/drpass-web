import type { MockExamScore } from "@/lib/mock-exam-score";

/**
 * The two Mock Exam performance metrics. Deliberately independent values:
 * the raw count tells the student exactly what they answered correctly,
 * while the JAMB-style score interprets the same performance on the
 * 400-point UTME scale. When the JAMB-style score cannot be defensibly
 * calculated, only the raw performance is shown — never a fabricated number.
 */
export function MockExamScoreCard({ score }: { score: MockExamScore }) {
  const { jambStyleScore, rawCorrect, totalQuestions } = score;

  if (jambStyleScore === null) {
    return (
      <section
        aria-label="Raw performance"
        className="rounded-xl border border-border bg-card px-4 py-5 text-center"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Raw performance
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
          {rawCorrect}
          <span className="text-base font-medium text-muted-foreground">
            {" "}
            / {totalQuestions} correct
          </span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Questions answered correctly
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Mock Exam scores"
      className="grid grid-cols-2 gap-3"
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          JAMB-style score
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
          {jambStyleScore}
          <span className="text-base font-medium text-muted-foreground">
            {" "}
            / 400
          </span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Approximate translation to the JAMB UTME scale
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Raw performance
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
          {rawCorrect}
          <span className="text-base font-medium text-muted-foreground">
            {" "}
            / {totalQuestions} correct
          </span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Questions answered correctly
        </p>
      </div>
    </section>
  );
}
