const EXAM_SHORTCUTS = [
  {
    key: "A / B / C / D",
    desc: "Press the letter of the answer you want — it is selected immediately, no clicking needed.",
  },
  {
    key: "P",
    desc: "Move back to the previous question to review or change an answer.",
  },
  {
    key: "N",
    desc: "Move forward to the next question without using the mouse.",
  },
  {
    key: "S",
    desc: "Open the submit confirmation to review before you finish.",
  },
  {
    key: "Y",
    desc: "In the confirmation, submit your answers and finish the exam.",
  },
  {
    key: "R",
    desc: "In the confirmation, cancel and go back to answering questions.",
  },
] as const;

interface ExamShortcutsPanelProps {
  title?: string;
  description?: string;
}

/**
 * Exam keyboard controls, explained in plain language. Rendered on desktop
 * only (wrap in `hidden md:block`); mobile uses touch controls. Shared by
 * the Practice and Mock Exam prepare screens so the shortcut definitions
 * live in exactly one place.
 */
export function ExamShortcutsPanel({
  title = "How the exam controls work",
  description = "During the practice you can control everything from the keyboard — no mouse needed. Here is what each key does:",
}: ExamShortcutsPanelProps) {
  return (
    <div className="border border-border/60 bg-muted/30 rounded-2xl p-6 text-left">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4 text-center">
        {title}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground text-center">
        {description}
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {EXAM_SHORTCUTS.map(({ key, desc }) => (
          <div key={key} className="flex items-start gap-3">
            <dt className="shrink-0">
              <kbd className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded border border-border bg-background text-xs font-mono font-medium text-foreground shadow-sm">
                {key}
              </kbd>
            </dt>
            <dd className="text-sm text-muted-foreground">{desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
