import type { SubjectQuestionConfig } from "@/types/practice";
import { SubjectQuestionRow } from "./subject-question-row";

interface SubjectQuestionSelectorProps {
  subjects: SubjectQuestionConfig[];
  /** Maximum number of subjects that may be selected at once. */
  maxSelected: number;
  onToggle: (code: string) => void;
  onCountChange: (code: string, count: number) => void;
}

/** The list of the student's subjects and their question distribution. */
export function SubjectQuestionSelector({
  subjects,
  maxSelected,
  onToggle,
  onCountChange,
}: SubjectQuestionSelectorProps) {
  const selectedCount = subjects.filter((subject) => subject.count > 0).length;
  const limitReached = selectedCount >= maxSelected;
  const hasUnselected = subjects.some((subject) => subject.count === 0);

  return (
    <section aria-labelledby="practice-subjects-heading" className="space-y-4">
      <div className="space-y-1">
        <h2
          id="practice-subjects-heading"
          className="text-lg font-medium text-foreground"
        >
          Question Distribution
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose up to {maxSelected} subjects and how many questions to attempt
          in each.
        </p>
      </div>

      {subjects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
          You have no subjects to practice yet. Add your UTME subjects to set up
          a practice session.
        </p>
      ) : (
        <div className="space-y-3" role="group" aria-label="Subject selection">
          {subjects.map((subject) => (
            <SubjectQuestionRow
              key={subject.code}
              subject={subject}
              selected={subject.count > 0}
              disabled={limitReached && subject.count === 0}
              onToggle={() => onToggle(subject.code)}
              onCountChange={(count) => onCountChange(subject.code, count)}
            />
          ))}
        </div>
      )}

      {limitReached && hasUnselected && (
        <p className="text-xs text-muted-foreground" role="status">
          You can practice {maxSelected} subjects at a time. Deselect one to
          choose another.
        </p>
      )}
    </section>
  );
}