import { cn } from "@/lib/utils";
import type { SubjectStat, DashboardState } from "@/data/student-dashboard-mock";

interface SubjectPerformanceProps {
  subjectStats: SubjectStat[];
  state: DashboardState;
}

function CircularProgress({ percentage, className }: { percentage: number; className?: string }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center w-12 h-12 shrink-0", className)} aria-hidden="true">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
        {/* Background track */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-foreground/10"
        />
        {/* Progress stroke */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums text-foreground">
        {percentage}%
      </span>
    </div>
  );
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
        className="text-base font-semibold tracking-tight text-foreground mb-4"
      >
        Subject performance
      </h2>

      <div className="flex flex-col gap-5">
        {sorted.map((stat) => (
          <div key={stat.subject} className="flex items-center gap-4">
            <CircularProgress 
              percentage={stat.accuracy} 
              className={stat.accuracy >= 70 ? "text-primary" : stat.accuracy >= 55 ? "text-brand-gold" : "text-destructive"} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {stat.subject}
              </span>
            </div>

            {/* Accessible screen-reader text */}
            <span className="sr-only">
              {stat.subject}: {stat.accuracy}% accuracy across {stat.questionsAttempted} questions attempted.
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
