import { useUser } from "@/hooks/use-user";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader() {
  const greeting = getGreeting();
  const { user } = useUser();

  const completedTime = user?.onboardingCompletedAt
    ? new Date(user.onboardingCompletedAt).getTime()
    : 0;
  const oneDayInMs = 24 * 60 * 60 * 1000;

  const state = Date.now() - completedTime < oneDayInMs ? "ongoing" : "new";

  return (
    <header className="mb-2">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        {greeting}, {user?.preferredName}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {state === "new" ? (
          <>
            Preparing for{" "}
            <span className="font-medium text-foreground">
              {user?.programme?.name}
            </span>
            . Let&apos;s get started.
          </>
        ) : (
          <>
            Preparing for{" "}
            <span className="font-medium text-foreground">
              {user?.programme?.name}
            </span>
            .
          </>
        )}
      </p>
    </header>
  );
}
