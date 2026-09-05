import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "@/api/auth";
import type { UserResponse } from "@/types/auth";

/**
 * Single stable query key for the authenticated user (`GET /auth/me`).
 * Shared across the app so every `useUser()` consumer reads from the
 * same TanStack Query cache entry. `login`/`register` invalidate this
 * exact key after a successful session.
 */
export const USER_QUERY_KEY = ["auth", "me"] as const;

interface UseUserResult {
  /** The authenticated user, or null while pending/unauthenticated. */
  user: UserResponse | null;
  /** True while the initial `/me` request is in flight. */
  isLoading: boolean;
  /** True when `/me` failed (e.g. no valid session). */
  isError: boolean;
}

/**
 * Application-level access to the current authenticated user.
 *
 * Wraps the existing `/me` TanStack Query behind meaningful names so
 * routes and components never need to know how the user is fetched.
 * This is the single user state mechanism — do not add another.
 */
export function useUser(): UseUserResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    // The session does not go stale while the app is open; `login` and
    // `register` explicitly invalidate this key after sign-in.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    // Fail fast on 401 so AuthenticatedLayout can redirect without
    // waiting out retries.
    retry: false,
  });

  return { user: data ?? null, isLoading, isError };
}
