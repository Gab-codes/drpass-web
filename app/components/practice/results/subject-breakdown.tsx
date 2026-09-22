import type { SubjectScore } from "@/lib/practice-results";

/**
 * "By subject" breakdown for the Results summary.
 * Rendered only when the session covers more than one subject.
 *
 * `scoresBySubject` optionally supplies per-subject scaled scores (out of
 * 100, e.g. the Mock Exam's JAMB-style subject scores). When absent
 * (Practice), only the raw result is shown.
 */
export function SubjectBreakdown({
  subjects,
  scoresBySubject,
}: {
  subjects: SubjectScore[];
  scoresBySubject?: Record<string, number | null>;
}) {
  if (subjects.length <= 1) return null;

  return (
    <section aria-labelledby="subjects-heading">
      <h2
        id="subjects-heading"
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3"
      >
        By subject
      </h2>
      <div className="space-y-2">
        {subjects.map((sub) => {
          const score = scoresBySubject?.[sub.subjectCode] ?? null;

          return (
            <div
              key={sub.subjectCode}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {sub.subjectName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sub.correct}/{sub.total} correct
                  {score !== null && <span> · Score {score}/100</span>}
                </p>
              </div>
              {/* Mini progress bar */}
              <div className="w-20 shrink-0">
                <div
                  className="h-1.5 rounded-full bg-muted overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-muted-foreground text-right mt-0.5">
                  {sub.percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
