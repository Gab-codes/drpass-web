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
};

export function PreparationOverview({ metrics, state }: PreparationOverviewProps) {
  // Don't render inflated zeroes for new students
  if (state === "new") {
    return null;
  }

  const items: Metric[] = [
    {
      label: "Questions attempted",
      value: metrics.questionsAttempted.toLocaleString(),
    },
    {
      label: "Overall accuracy",
      value: metrics.accuracy !== null ? `${metrics.accuracy}%` : "—",
    },
    {
      label: "Total study time",
      value: formatMinutes(metrics.studyMinutes),
    },
    {
      label: "Sessions completed",
      value: metrics.sessionsCompleted.toLocaleString(),
    },
  ];

  return (
    <section aria-label="Preparation overview" className="py-6 border-y border-border">
      <div className="flex flex-wrap gap-x-12 gap-y-8">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">
              {item.label}
            </span>
            <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
