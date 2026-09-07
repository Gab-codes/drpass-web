import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

import { useUser } from "@/hooks/use-user";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/student-sidebar";

/**
 * Visual application shell for authenticated student routes.
 *
 * Renders the sidebar, header and main content container. Does not
 * perform its own authentication query — routes here always sit
 * inside `AuthenticatedLayout`, which guarantees the user is
 * resolved; the user is read from the shared query cache via
 * `useUser()`.
 *
 * Also owns the onboarding guard for direct navigation: an
 * authenticated student who has not completed onboarding cannot reach
 * any student route by typing a protected URL. The completion state
 * comes solely from the canonical `/auth/me` user.
 */
export default function StudentLayout() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, navigate]);

  // While redirecting an incomplete user, render nothing rather than
  // flashing the application shell.
  if (!user || !user.onboardingCompleted) return null;

  return (
    <SidebarProvider>
      <StudentSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
