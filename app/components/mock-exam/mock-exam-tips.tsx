import { MOCK_EXAM } from "@/lib/mock-exam";

/**
 * Mock Exam prepare guidance.
 *
 * Calm, concise examination guidance — no gamification, no integrity
 * claims. The exam follows the fixed JAMB UTME format; students should
 * know the structure, pace themselves, and stay in the exam window once
 * it begins. Never assumes a continuous internet connection.
 */
export function MockExamTips() {
  const hours = MOCK_EXAM.totalTimeMinutes / 60;
  return (
    <div className="border border-border/60 bg-muted/30 rounded-2xl p-6 text-left">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 text-center">
        Exam Simulation
      </h2>
      <p className="mb-4 text-sm text-muted-foreground text-center">
        This mock exam is designed to mirror the JAMB UTME exam format so the
        real examination feels familiar.
      </p>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-2.5">
          <span
            className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
            aria-hidden="true"
          />
          <span>
            <span className="font-medium text-foreground">
              {MOCK_EXAM.totalQuestions} questions in {hours}{" "}
              {hours === 1 ? "hour" : "hours"}
            </span>{" "}
            — Use of English: {MOCK_EXAM.englishQuestions} questions, your
            other three subjects: {MOCK_EXAM.otherSubjectQuestions} each.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span
            className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
            aria-hidden="true"
          />
          <span>
            Keep an eye on your pace. You have {hours}{" "}
            {hours === 1 ? "hour" : "hours"} for{" "}
            {MOCK_EXAM.totalQuestions} questions, so if you're unsure about a
            question, move on and return to it later.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span
            className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60"
            aria-hidden="true"
          />
          <span>
            Stay focused once the exam begins and avoid leaving the exam
            window. The timer starts as soon as you start — just like the
            real exam.
          </span>
        </li>
        <li className="hidden md:flex gap-2.5">
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
    </div>
  );
}
