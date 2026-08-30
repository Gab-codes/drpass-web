import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { FireIcon } from "@hugeicons/core-free-icons";
import type { ActivityDay, DashboardState } from "@/data/student-dashboard-mock";

interface StudyStreakProps {
  streakDays: number;
  recentActivity: ActivityDay[];
  state: DashboardState;
}

export function StudyStreak({
  streakDays,
  recentActivity,
  state,
}: StudyStreakProps) {
  if (state === "new" || recentActivity.length === 0) {
    return null;
  }

  // Abbreviated day names for the past 7 days (e.g., M T W T F S S)
  const formatDay = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(d);
  };

  return (
    <section aria-labelledby="streak-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="streak-heading" className="text-sm font-medium text-foreground">
          Study consistency
        </h2>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <HugeiconsIcon icon={FireIcon} className="size-4 text-brand-gold" />
          <span>{streakDays} {streakDays === 1 ? "day" : "days"}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-foreground/10 p-5">
        <div className="flex justify-between max-w-[240px]">
          {recentActivity.map((day, i) => (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                {formatDay(day.date)}
              </span>
              <div
                className={cn(
                  "size-6 rounded-md ring-1 ring-inset",
                  day.active
                    ? "bg-primary ring-transparent text-primary-foreground"
                    : "bg-muted ring-foreground/10",
                )}
                aria-label={`${day.date}: ${
                  day.active ? "Studied" : "Did not study"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

