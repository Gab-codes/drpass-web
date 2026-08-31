import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { StudentProfile, DashboardState, NextAction } from "@/data/student-dashboard-mock";

interface PrimaryActionProps {
  nextAction: NextAction | null;
  state: DashboardState;
  profile: StudentProfile;
}

export function PrimaryAction({ nextAction, state, profile }: PrimaryActionProps) {
  if (!nextAction) return null;

  return (
    <section aria-label="Primary action" className="py-2 md:py-4">
      <div className="flex flex-col items-start gap-4 max-w-2xl">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {nextAction.title}
          </h2>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">
            {nextAction.description}
          </p>
        </div>
        <Button size="lg" className="rounded-full h-12 px-6 gap-2 text-base font-medium shadow-sm mt-2">
          {nextAction.actionLabel}
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
        </Button>
      </div>
    </section>
  );
}
