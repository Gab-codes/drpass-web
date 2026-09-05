import { apiClient } from "@/lib/axios";
import { SUBJECT_CODE_BY_SLUG } from "@/constants/onboarding";
import type {
  ApiSubject,
  OnboardingResponse,
  Programme,
  SubmitOnboardingRequest,
} from "@/types/onboarding";

export const onboardingKeys = {
  all: ["onboarding"] as const,
  state: () => [...onboardingKeys.all, "state"] as const,
  subjects: () => [...onboardingKeys.all, "subjects"] as const,
};

/** Active canonical subjects (id, name, stable code) from the backend. */
export async function getSubjects() {
  const response = await apiClient.get<ApiSubject[]>("/subjects");
  return response.data;
}

/** Canonical persisted onboarding state for the authenticated user. */
export async function getOnboardingState() {
  const response = await apiClient.get<OnboardingResponse>(
    "/users/me/onboarding",
  );
  return response.data;
}

/** Single final onboarding submission (PATCH /users/me/onboarding). */
export async function submitOnboardingApi(input: SubmitOnboardingRequest) {
  const response = await apiClient.patch<OnboardingResponse>(
    "/users/me/onboarding",
    input,
  );
  return response.data;
}

/**
 * Resolves frontend subject slugs to canonical backend subject UUIDs via the
 * stable `code` field. Never invents IDs: slugs that cannot be resolved to a
 * backend subject are reported in `unresolved` so callers can block the
 * submission with a user-facing error.
 */
export function resolveSubjectIds(
  apiSubjects: ApiSubject[],
  subjectSlugs: string[],
): { ids: string[]; unresolved: string[] } {
  const idByCode = new Map(apiSubjects.map((s) => [s.code, s.id]));

  const ids: string[] = [];
  const unresolved: string[] = [];

  for (const slug of subjectSlugs) {
    const id = idByCode.get(SUBJECT_CODE_BY_SLUG[slug] ?? "");
    if (id) {
      ids.push(id);
    } else {
      unresolved.push(slug);
    }
  }

  return { ids, unresolved };
}

/**
 * Maps the local onboarding draft (Zustand) to the canonical
 * PATCH /users/me/onboarding request. Pure — no store or API knowledge leaks
 * into the caller, and no unresolved subject is silently dropped.
 */
export function buildSubmitOnboardingRequest(input: {
  preferredName: string | null;
  programme: Programme | null;
  subjectSlugs: string[];
  apiSubjects: ApiSubject[];
}): SubmitOnboardingRequest & { unresolved: string[] } {
  const { ids, unresolved } = resolveSubjectIds(
    input.apiSubjects,
    input.subjectSlugs,
  );

  return {
    preferredName: input.preferredName ?? "",
    // The local programme dataset id IS the canonical backend programme id
    // (slug-style); the manual path is an explicit null.
    programmeId: input.programme ? input.programme.id : null,
    subjectIds: ids,
    unresolved,
  };
}