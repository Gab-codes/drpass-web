import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

import { useUser } from "@/hooks/use-user";

/**
 * Account/access boundary for authenticated routes.
 *
 * Resolves the current user via `useUser()`, owns the initial `/me`
 * loading experience globally, and redirects unauthenticated visitors
 * to `/login`. Contains no application-shell styling — visual layout
 * belongs to child layouts (e.g. `StudentLayout`).
 *
 * Future account-level checks (suspension/disabled accounts) belong
 * here once the backend exposes them.
 */
export default function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user, isLoading, isError } = useUser();

  useEffect(() => {
    if (!isLoading && isError) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isError, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}
