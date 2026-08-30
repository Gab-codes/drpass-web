import { cn } from "@/lib/utils";
import type { PrepMetrics, DashboardState } from "@/data/student-dashboard-mock";

interface PreparationOverviewProps {
  metrics: PrepMetrics;
  state: DashboardState;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

type Metric = {
  label: string;
  value: string;
  subtext?: string;
};

export function PreparationOverview({ metrics, state }: PreparationOverviewProps) {
  // Don't render inflated zeroes for new students
  if (state === "new") {
    return null;
  }

  const items: Metric[] = [
    {
      label: "Questions",
      value: metrics.questionsAttempted.toLocaleString(),
      subtext: "attempted",
    },
    {
      label: "Accuracy",
      value: metrics.accuracy !== null ? `${metrics.accuracy}%` : "—",
      subtext: "overall",
    },
    {
      label: "Study time",
      value: formatMinutes(metrics.studyMinutes),
      subtext: "total",
    },
    {
      label: "Sessions",
      value: metrics.sessionsCompleted.toLocaleString(),
      subtext: "completed",
    },
  ];

  return (
    <section aria-label="Preparation overview">
      <div
        className={cn(
          "grid gap-px rounded-2xl overflow-hidden ring-1 ring-foreground/10",
          "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "bg-card px-5 py-4",
              // Restore gap on non-last columns via border
              i < items.length - 1 && "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground leading-none">
              {item.value}
            </p>
            {item.subtext && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.subtext}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

