import { cn } from "@/lib/utils";
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

  const formatDay = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(d);
  };

  return (
    <section aria-labelledby="streak-heading" className="py-2">
      <h2 id="streak-heading" className="text-base font-semibold tracking-tight text-foreground mb-4">
        Consistency
      </h2>
      
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          You&apos;ve studied {streakDays} {streakDays === 1 ? "day" : "days"} in a row.
        </p>

        <div className="flex gap-2.5">
          {recentActivity.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-medium text-muted-foreground" aria-hidden="true">
                {formatDay(day.date)}
              </span>
              <div
                className={cn(
                  "size-5 rounded-full ring-1 ring-inset",
                  day.active
                    ? "bg-foreground ring-foreground"
                    : "bg-transparent ring-border",
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
