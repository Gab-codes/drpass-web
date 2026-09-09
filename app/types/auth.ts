import type { ApiProgrammeSummary, ApiSubject } from "@/types/onboarding";

/**
 * Canonical current-user context returned by GET /api/v1/auth/me.
 * Mirrors the backend CurrentUserResponseDto, including the application-level
 * profile state (preferred name, onboarding completion, programme, subjects).
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "admin" | "user";
  /** Preferred name captured during onboarding. Null before onboarding. */
  preferredName: string | null;
  /** Backend-authoritative onboarding completion flag. */
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  /** The user's selected programme, or null when none was selected. */
  programme: ApiProgrammeSummary | null;
  /** The user's selected UTME subject combination. Empty before onboarding. */
  subjects: ApiSubject[];
}
