import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

import type { AnswerStatus } from "@/lib/practice-results";
import { cn } from "@/lib/utils";

export function StatusIcon({
  status,
  className,
}: {
  status: AnswerStatus;
  className?: string;
}) {
  if (status === "correct") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        className={cn("text-success", className)}
        aria-hidden="true"
      />
    );
  }
  if (status === "incorrect") {
    return (
      <HugeiconsIcon
        icon={Cancel01Icon}
        className={cn("text-destructive", className)}
        aria-hidden="true"
      />
    );
  }
  return (
    <HugeiconsIcon
      icon={InformationCircleIcon}
      className={cn("text-muted-foreground", className)}
      aria-hidden="true"
    />
  );
}