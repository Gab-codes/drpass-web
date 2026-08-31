import type { StudentProfile, DashboardState } from "@/data/student-dashboard-mock";

interface DashboardHeaderProps {
  profile: StudentProfile;
  state: DashboardState;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ profile, state }: DashboardHeaderProps) {
  const greeting = getGreeting();

  return (
    <header className="mb-2">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        {greeting}, {profile.preferredName}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {state === "new" ? (
          <>
            Preparing for{" "}
            <span className="font-medium text-foreground">
              {profile.programme}
            </span>
            . Let&apos;s get started.
          </>
        ) : (
          <>
            Preparing for{" "}
            <span className="font-medium text-foreground">
              {profile.programme}
            </span>
            .
          </>
        )}
      </p>
    </header>
  );
}
