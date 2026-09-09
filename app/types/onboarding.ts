export interface Programme {
  id: string;
  name: string;
  recommendedSubjects: string[];
}

export interface Subject {
  id: string;
  name: string;
}

/** Canonical backend subject record (GET /subjects, onboarding responses). */
export interface ApiSubject {
  id: string;
  name: string;
  code: string;
}

/** Canonical backend programme summary. */
export interface ApiProgrammeSummary {
  id: string;
  slug: string;
  name: string;
}

/** Request body for PATCH /users/me/onboarding. */
export interface SubmitOnboardingRequest {
  preferredName: string;
  /** Canonical programme id (slug-style), or null for the manual path. */
  programmeId: string | null;
  /** Exactly 4 canonical subject IDs (Use of English included). */
  subjectIds: string[];
}

/** Canonical persisted onboarding state (PATCH and GET /users/me/onboarding). */
export interface OnboardingResponse {
  preferredName: string | null;
  programme: ApiProgrammeSummary | null;
  /** Use of English first. */
  subjects: ApiSubject[];
  onboardingCompleted: boolean;
}
