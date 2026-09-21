import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

import type { PracticeQuestion } from "@/types/practice";
import type { AnswerStatus } from "@/lib/practice-results";
import { cn } from "@/lib/utils";
import { StatusIcon } from "./status-icon";

export function ReviewOption({
  option,
  status,
  isSelected,
  isCorrect,
}: {
  option: PracticeQuestion["options"][number];
  status: AnswerStatus;
  isSelected: boolean;
  isCorrect: boolean;
}) {
  const isHighlighted = isSelected || isCorrect;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-colors",
        isSelected && status === "correct" && "border-success/50 bg-success/5",
        isSelected &&
          status === "incorrect" &&
          "border-destructive/50 bg-destructive/5",
        isCorrect && !isSelected && "border-success/50 bg-success/5",
        !isHighlighted && "border-border bg-card",
      )}
    >
      {/* Label badge */}
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold mt-px",
          isSelected && status === "correct" && "bg-success text-white",
          isSelected && status === "incorrect" && "bg-destructive text-white",
          isCorrect && !isSelected && "bg-success text-white",
          !isHighlighted && "bg-muted text-muted-foreground",
        )}
      >
        {option.label}
      </span>

      {/* Text */}
      <span
        className={cn(
          "flex-1 leading-relaxed",
          isHighlighted
            ? "text-foreground font-medium"
            : "text-muted-foreground",
        )}
      >
        {option.text}
      </span>

      {/* Icon */}
      {isSelected && (
        <StatusIcon status={status} className="size-4 mt-0.5 shrink-0" />
      )}
      {isCorrect && !isSelected && (
        <HugeiconsIcon
          icon={CheckmarkCircle01Icon}
          className="size-4 mt-0.5 shrink-0 text-success"
          aria-hidden="true"
        />
      )}
    </div>
  );
}