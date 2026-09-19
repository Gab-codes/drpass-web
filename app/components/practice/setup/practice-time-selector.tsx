import { Button } from "@/components/ui/button";
import { StepperInput } from "@/components/practice/stepper-input";
import { PRACTICE_LIMITS, TIME_PRESETS } from "@/data/mock-exam";
import { cn } from "@/lib/utils";
import type { TimeMode } from "@/types/practice";

interface PracticeTimeSelectorProps {
  timeMode: TimeMode;
  /** The duration that will be used: the suggestion, or the custom time. */
  totalTimeMinutes: number;
  /** The live question-based suggestion the student can reset to. */
  suggestedTimeMinutes: number;
  /** Any explicit minute choice; switches the selector into custom time. */
  onTimeChange: (minutes: number) => void;
  /** Returns to the live question-based suggestion. */
  onResetToSuggested: () => void;
}

/**
 * Duration control: exact minutes through the numeric stepper, or a preset as a
 * shortcut. Both switch the selector into custom time.
 */
export function PracticeTimeSelector({
  timeMode,
  totalTimeMinutes,
  suggestedTimeMinutes,
  onTimeChange,
  onResetToSuggested,
}: PracticeTimeSelectorProps) {
  const isCustom = timeMode === "custom";
  const timeInputId = "practice-time-minutes";

  return (
    <section aria-labelledby="practice-time-heading" className="space-y-4">
      <div className="space-y-1">
        <h2
          id="practice-time-heading"
          className="text-lg font-medium text-foreground"
        >
          Time Limit
        </h2>
        <p className="text-sm text-muted-foreground">
          {isCustom
            ? `Custom time. Your suggested ${suggestedTimeMinutes} min is no longer applied.`
            : "Suggested from your question count — 1 minute per question."}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor={timeInputId}
            className="text-sm font-medium text-foreground"
          >
            Duration in minutes
          </label>
          <div className="shrink-0">
            <StepperInput
              id={timeInputId}
              label="time limit"
              value={totalTimeMinutes}
              onChange={onTimeChange}
              min={PRACTICE_LIMITS.minTotalMinutes}
              max={PRACTICE_LIMITS.maxTotalMinutes}
              variant="compact"
            />
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Duration presets"
        >
          {TIME_PRESETS.map((minutes) => {
            const isActive = minutes === totalTimeMinutes;
            return (
              <button
                key={minutes}
                type="button"
                aria-pressed={isActive}
                onClick={() => onTimeChange(minutes)}
                className={cn(
                  "h-8 cursor-pointer rounded-full border px-3 text-xs font-medium tabular-nums transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {minutes} min
              </button>
            );
          })}
        </div>

        {isCustom && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={onResetToSuggested}
          >
            Reset to suggested ({suggestedTimeMinutes} min)
          </Button>
        )}
      </div>
    </section>
  );
}