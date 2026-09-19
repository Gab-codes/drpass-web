import { cn } from "@/lib/utils";
import type { Question } from "@/data/mock-exam";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SubjectGroup {
  /** Subject display name, e.g. "Use of English". */
  name: string;
  /** Index of the first question in this subject within the flat questions array. */
  startIndex: number;
  /** Number of questions in this subject. */
  count: number;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Derives ordered subject groups from the flat question list produced by
 * `generateMockExam`. Questions must be ordered by subject (which they always
 * are — the generator preserves the config subjects order).
 */
export function computeSubjectGroups(questions: Question[]): SubjectGroup[] {
  const groups: SubjectGroup[] = [];

  for (let i = 0; i < questions.length; i++) {
    const name = questions[i].subject;
    const last = groups[groups.length - 1];

    if (!last || last.name !== name) {
      groups.push({ name, startIndex: i, count: 1 });
    } else {
      last.count++;
    }
  }

  return groups;
}

/**
 * Returns the active group index for the given flat question index.
 * The active group is the one whose range contains `questionIndex`.
 */
export function getActiveGroupIndex(
  groups: SubjectGroup[],
  questionIndex: number,
): number {
  for (let i = groups.length - 1; i >= 0; i--) {
    if (questionIndex >= groups[i].startIndex) return i;
  }
  return 0;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface SubjectNavProps {
  groups: SubjectGroup[];
  activeGroupIndex: number;
  /** Flat answers map used to compute per-subject progress. */
  answers: Record<string, string>;
  /** The full flat question list — needed to extract per-subject question ids. */
  questions: Question[];
  /** Navigate to this flat question index when a subject tab is clicked. */
  onNavigate: (index: number) => void;
}

/**
 * Horizontal subject-tab bar rendered inside the sticky exam header.
 *
 * Renders nothing when there is only one subject (navigation would be
 * meaningless). The same component is used on desktop and mobile — it is
 * horizontally scrollable on small screens.
 *
 * Reusable: does not contain any Practice-specific logic.
 */
export function SubjectNav({
  groups,
  activeGroupIndex,
  answers,
  questions,
  onNavigate,
}: SubjectNavProps) {
  if (groups.length <= 1) return null;

  return (
    <div role="navigation" aria-label="Subject navigation">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
        role="tablist"
        aria-label="Subjects"
      >
        {groups.map((group, index) => {
          const isActive = index === activeGroupIndex;

          // Compute answered count for this subject.
          const groupQuestions = questions.slice(
            group.startIndex,
            group.startIndex + group.count,
          );
          const answeredCount = groupQuestions.filter((q) =>
            Boolean(answers[q.id]),
          ).length;

          const progressLabel = `${answeredCount} of ${group.count} answered`;

          return (
            <button
              key={group.name}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onNavigate(group.startIndex)}
              className={cn(
                // Base
                "relative flex-shrink-0 flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors duration-150",
                "outline-none cursor-pointer whitespace-nowrap",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                // Active: primary underline
                isActive
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-b-2 border-transparent",
              )}
              aria-label={`${group.name}, ${progressLabel}`}
            >
              <span>{group.name}</span>

              {/* Per-subject progress count */}
              <span
                aria-hidden="true"
                className={cn(
                  "text-[10px] font-mono tabular-nums leading-none px-1 py-0.5 rounded",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : answeredCount === group.count
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {answeredCount}/{group.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
