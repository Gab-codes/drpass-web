import type { Option } from "@/data/mock-exam";
import { cn } from "@/lib/utils";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

interface AnswerOptionsProps {
  options: Option[];
  selectedOptionId: string | undefined;
  onSelect: (optionId: string) => void;
}

export function AnswerOptions({
  options,
  selectedOptionId,
  onSelect,
}: AnswerOptionsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Answer options"
      className="flex flex-col gap-2.5"
    >
      {options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;
        const label = OPTION_LABELS[index];

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.id)}
            className={cn(
              // Base: min 48px touch target, full accessible button
              "group relative flex items-start gap-4 w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 outline-none cursor-pointer",
              "min-h-[3rem] sm:min-h-[3.25rem]",
              // Focus visible ring
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              // Default state
              !isSelected &&
                "border-border bg-card hover:border-primary/40 hover:bg-accent/30",
              // Selected state — uses border + background, NOT color alone
              isSelected && "border-primary bg-accent"
            )}
          >
            {/* Option label badge */}
            <span
              aria-hidden="true"
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold transition-colors mt-px",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-muted/80"
              )}
            >
              {label}
            </span>

            {/* Option text */}
            <span
              className={cn(
                "flex-1 text-sm leading-relaxed pt-0.5",
                isSelected ? "text-accent-foreground font-medium" : "text-foreground"
              )}
            >
              {option.text}
            </span>

            {/* Selection indicator — not color alone */}
            {isSelected && (
              <span
                aria-hidden="true"
                className="flex-shrink-0 mt-px"
              >
                <svg
                  className="w-4.5 h-4.5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
