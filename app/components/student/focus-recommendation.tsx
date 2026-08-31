import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { FocusArea, DashboardState } from "@/data/student-dashboard-mock";

interface FocusRecommendationProps {
  focusArea: FocusArea | null;
  state: DashboardState;
}

export function FocusRecommendation({ focusArea, state }: FocusRecommendationProps) {
  if (state === "new" || !focusArea) {
    return null;
  }

  return (
    <section aria-labelledby="focus-heading" className="py-2">
      <h2
        id="focus-heading"
        className="text-base font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2"
      >
        <HugeiconsIcon icon={Target01Icon} className="size-5 text-muted-foreground" />
        Focus next
      </h2>

      <div className="flex flex-col items-start gap-4 max-w-sm">
        <p className="text-sm text-foreground leading-relaxed">
          Your <span className="font-medium">{focusArea.subject}</span> performance needs attention. 
          Practice <span className="font-medium">{focusArea.suggestedTopic}</span> next.
        </p>
        
        <Button size="sm" variant="outline" className="gap-2 rounded-full h-9" disabled>
          Practice {focusArea.suggestedTopic}
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
        </Button>
      </div>
    </section>
  );
}
