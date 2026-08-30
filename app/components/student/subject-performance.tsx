import { cn } from "@/lib/utils";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import type { SubjectStat, DashboardState } from "@/data/student-dashboard-mock";

interface SubjectPerformanceProps {
  subjectStats: SubjectStat[];
  state: DashboardState;
}

/** Returns a colour modifier class based on accuracy tier. */
function getAccuracyClass(accuracy: number): string {
  if (accuracy >= 70) return "text-primary";
  if (accuracy >= 55) return "text-foreground";
  return "text-destructive";
}

/** Returns a progress bar colour class based on accuracy tier. */
function getBarClass(accuracy: number): string {
  if (accuracy >= 70) return "bg-primary";
  if (accuracy >= 55) return "bg-brand-gold";
  return "bg-destructive";
}

export function SubjectPerformance({
  subjectStats,
  state,
}: SubjectPerformanceProps) {
  if (state === "new" || subjectStats.length === 0) {
    return null;
  }

  // Sort strongest to weakest for a clear visual hierarchy
  const sorted = [...subjectStats].sort((a, b) => b.accuracy - a.accuracy);

  return (
    <section aria-labelledby="subject-perf-heading">
      <h2
        id="subject-perf-heading"
        className="text-sm font-medium text-foreground mb-3"
      >
        Subject performance
      </h2>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10 divide-y divide-border">
        {sorted.map((stat) => (
          <div key={stat.subject} className="px-5 py-3.5">
            <div className="flex items-center gap-3">
              {/* Subject label */}
              <span className="text-sm text-foreground w-36 shrink-0 truncate">
                {stat.subject}
              </span>

              {/* Bar */}
              <div className="flex-1 min-w-0">
                <Progress
                  value={stat.accuracy}
                  aria-label={`${stat.subject}: ${stat.accuracy}% accuracy`}
                  className="gap-0"
                >
                  <ProgressTrack className="h-1.5">
                    <ProgressIndicator
                      className={cn("h-full transition-all", getBarClass(stat.accuracy))}
                    />
                  </ProgressTrack>
                </Progress>
              </div>

              {/* Percentage */}
              <span
                className={cn(
                  "text-sm font-medium tabular-nums w-10 text-right shrink-0",
                  getAccuracyClass(stat.accuracy),
                )}
                aria-hidden="true"
              >
                {stat.accuracy}%
              </span>
            </div>

            {/* Screen-reader text for context */}
            <span className="sr-only">
              {stat.subject}: {stat.accuracy}% accuracy across{" "}
              {stat.questionsAttempted} questions attempted.
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

