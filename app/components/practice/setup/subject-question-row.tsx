import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

import { StepperInput } from "@/components/practice/stepper-input";
import { PRACTICE_LIMITS } from "@/data/mock-exam";
import { cn } from "@/lib/utils";
import type { SubjectQuestionConfig } from "@/types/practice";

interface SubjectQuestionRowProps {
  subject: SubjectQuestionConfig;
  /** Derived from the question count: `count > 0` means selected. */
  selected: boolean;
  /** True when the subject cannot be selected because the subject limit is reached. */
  disabled: boolean;
  onToggle: () => void;
  onCountChange: (count: number) => void;
}

/**
 * One subject: the whole card selects/deselects it, while the question stepper
 * stays an independent control that never toggles the subject.
 */
export function SubjectQuestionRow({
  subject,
  selected,
  disabled,
  onToggle,
  onCountChange,
}: SubjectQuestionRowProps) {
  const countId = `practice-questions-${subject.code}`;

  return (
    <div
      onClick={() => {
        if (!disabled) onToggle();
      }}
      className={cn(
        "rounded-2xl border bg-card p-4 transition-colors",
        selected ? "border-primary/50 bg-accent/40" : "border-border/60",
        disabled ? "opacity-60" : "cursor-pointer hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-3">
        {/* The accessible selection control; the card surface mirrors it. */}
        <button
          type="button"
          aria-pressed={selected}
          disabled={disabled}
          onClick={(event) => {
            // The surface click is stopped so a press toggles exactly once.
            event.stopPropagation();
            onToggle();
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed"
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 bg-background",
            )}
          >
            {selected && (
              <HugeiconsIcon
                icon={Tick02Icon}
                strokeWidth={3}
                className="size-3"
              />
            )}
          </span>
          <span
            className={cn(
              "truncate font-medium",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {subject.name}
          </span>
        </button>

        {/* Outside the toggle, so the two controls stay independent. */}
        <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
          <label htmlFor={countId} className="sr-only">
            Questions for {subject.name}
          </label>
          <StepperInput
            id={countId}
            label={`questions for ${subject.name}`}
            value={subject.count}
            onChange={onCountChange}
            min={0}
            max={PRACTICE_LIMITS.maxQuestionsPerSubject}
            variant="compact"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}