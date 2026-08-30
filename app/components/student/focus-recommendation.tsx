import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { FocusArea, DashboardState } from "@/data/student-dashboard-mock";

interface FocusRecommendationProps {
  focusArea: FocusArea;
  state: DashboardState;
}

export function FocusRecommendation({ focusArea, state }: FocusRecommendationProps) {
  if (state === "new" || !focusArea) {
    return null;
  }

  return (
    <section aria-labelledby="focus-heading">
      <h2
        id="focus-heading"
        className="text-sm font-medium text-foreground mb-3"
      >
        Recommended practice
      </h2>

      <div className="rounded-2xl bg-warning-muted ring-1 ring-foreground/10 p-5">
        <div className="flex gap-4">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm">
            <HugeiconsIcon icon={Target01Icon} className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {focusArea.suggestedTopic}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your accuracy in this {focusArea.subject} topic is{" "}
              {focusArea.accuracy}%. Reviewing this area could improve your
              overall score.
            </p>
            <div className="mt-4">
              <Button size="sm" variant="outline" className="gap-1.5" disabled>
                Practice this topic
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

