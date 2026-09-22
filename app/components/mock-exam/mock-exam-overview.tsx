import { Button } from "@/components/ui/button";
import { MOCK_EXAM } from "@/lib/mock-exam";

interface MockExamSubjectRow {
  /** Display name resolved from the student's canonical subjects. */
  name: string;
  questionCount: number;
}

interface MockExamOverviewProps {
  /** The student's four subjects with their fixed allocation. */
  subjects: MockExamSubjectRow[];
  onStart: () => void;
  onBack: () => void;
}

/**
 * Mock Exam overview.
 *
 * Purely informational: what the exam is, the student's actual subjects with
 * their fixed allocation, and the fixed duration. Performs no requests and
 * has no exam side effects — preparation begins only on the prepare screen
 * after the student chooses to continue.
 */
export function MockExamOverview({
  subjects,
  onStart,
  onBack,
}: MockExamOverviewProps) {
  const hours = MOCK_EXAM.totalTimeMinutes / 60;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header>
        <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">
          Mock Exam
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Test yourself under JAMB UTME-style exam conditions.
        </p>
      </header>

      {/* ── Your exam — the student's actual subjects and allocation ────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your exam
        </h2>
        <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {subjects.map((subject) => (
            <div
              key={subject.name}
              className="flex items-center justify-between px-5 py-3.5 text-sm"
            >
              <span className="text-foreground">{subject.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {subject.questionCount} questions
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3.5 text-sm bg-muted/30">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-medium text-foreground tabular-nums">
              {MOCK_EXAM.totalQuestions} questions
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 text-sm">
            <span className="text-foreground">Duration</span>
            <span className="text-muted-foreground tabular-nums">
              {hours} {hours === 1 ? "hour" : "hours"} — the timer starts once
              the exam begins
            </span>
          </div>
        </div>
      </section>

      {/* ── What to expect ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          What to expect
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          The Mock Exam is designed to mirror the JAMB UTME format so the real
          examination feels familiar. Unlike Quick Practice, it is fixed — the
          question count and duration cannot be customized. You can move
          freely between subjects while you answer.
        </p>
        <ul className="space-y-2.5 max-w-xl text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span
              className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
              aria-hidden="true"
            />
            <span>
              Stay focused once the exam begins and avoid leaving the exam
              window.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span
              className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
              aria-hidden="true"
            />
            <span>
              On desktop, the exam opens in fullscreen when you start. If your
              browser blocks it, the exam starts anyway.
            </span>
          </li>
        </ul>
      </section>

      {/* ── Call to Action ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Button size="lg" className="h-12 text-base rounded-xl" onClick={onStart}>
          Start Mock Exam
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Your questions are prepared on the next step.
        </p>
        <Button variant="ghost" size="lg" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
