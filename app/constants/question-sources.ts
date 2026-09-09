/**
 * Canonical list of known question sources across the entire application.
 * Used by the import workflow and the admin question form.
 * Do not scatter this definition across components.
 */
export const QUESTION_SOURCES = ["JAMB", "WAEC", "NECO", "GCE"] as const;

export type QuestionSource = (typeof QUESTION_SOURCES)[number];

export function isKnownSource(value: string | null): value is QuestionSource {
  return QUESTION_SOURCES.includes(value as QuestionSource);
}
