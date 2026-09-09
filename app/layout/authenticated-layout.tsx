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
    // Only redirect once the request has settled; `!user` alone also covers
    // a 200 response without a user payload.
    if (!isLoading && (isError || !user)) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isError, user, navigate]);

  // Only the actual loading state shows the spinner.
  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Settled with a user — render the matched child route. While a redirect
  // is pending (error/no user), render nothing rather than a stuck spinner.
  if (!user) return null;

  return <Outlet />;
}
