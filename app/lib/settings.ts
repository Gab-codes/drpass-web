import {
  COMPULSORY_SUBJECT,
  SUBJECT_SLUG_BY_CODE,
} from "@/constants/onboarding";
import { getRecommendedSubjectIds } from "@/data/programmes";
import type { Programme } from "@/types/onboarding";

/** UTME combination: Use of English plus three optional subjects. */
export const OPTIONAL_SUBJECT_SLOTS = 3;

/** The editable slice of a student's profile. */
export interface SettingsFormValues {
  preferredName: string;
  /** Local programme dataset id, or "" when no programme is selected. */
  programmeId: string;
  /** Use of English first, then the optional subjects the student picked. */
  subjectSlugs: string[];
}

/**
 * The persisted profile fields the form hydrates from. Both the canonical
 * `/auth/me` user and a PATCH response satisfy this shape, so the same
 * hydrator serves the initial load and the post-save reset.
 */
export interface SettingsSource {
  preferredName: string | null;
  programme: { id: string } | null;
  subjects: { code: string }[];
}

/**
 * Hydrates the form from persisted state. Subject codes are mapped back to the
 * frontend slugs through the existing code→slug map; codes with no frontend
 * equivalent are dropped rather than guessed, so the student is asked to pick
 * them again instead of saving an invented subject.
 */
export function toSettingsFormValues(
  source: SettingsSource,
): SettingsFormValues {
  const optionalSlugs = source.subjects
    .map((subject) => SUBJECT_SLUG_BY_CODE[subject.code])
    .filter((slug): slug is string => Boolean(slug));

  return {
    preferredName: source.preferredName ?? "",
    programmeId: source.programme?.id ?? "",
    subjectSlugs: [
      COMPULSORY_SUBJECT,
      ...optionalSlugs.filter((slug) => slug !== COMPULSORY_SUBJECT),
    ].slice(0, OPTIONAL_SUBJECT_SLOTS + 1),
  };
}

/** The three optional slots, padded with "" so every slot renders. */
export function getSubjectSlots(subjectSlugs: string[]): string[] {
  const optional = subjectSlugs.filter((slug) => slug !== COMPULSORY_SUBJECT);

  return Array.from(
    { length: OPTIONAL_SUBJECT_SLOTS },
    (_, index) => optional[index] ?? "",
  );
}

/**
 * Replaces one optional slot, keeping Use of English first and compacting any
 * empty slot — the same behaviour the onboarding subject step has.
 */
export function withSubjectSlot(
  values: SettingsFormValues,
  index: number,
  slug: string,
): SettingsFormValues {
  const slots = getSubjectSlots(values.subjectSlugs);
  slots[index] = slug;

  return {
    ...values,
    subjectSlugs: [COMPULSORY_SUBJECT, ...slots.filter(Boolean)],
  };
}

/**
 * Applies a programme selection. Use of English stays compulsory and the
 * optional slots become that programme's recommended subjects, matching the
 * onboarding programme step. Clearing the programme keeps the student's
 * current subjects instead of discarding them.
 */
export function withProgramme(
  values: SettingsFormValues,
  programme: Programme | null,
): SettingsFormValues {
  if (!programme) return { ...values, programmeId: "" };

  const recommended = getRecommendedSubjectIds(programme).filter(
    (slug) => slug !== COMPULSORY_SUBJECT,
  );

  return {
    ...values,
    programmeId: programme.id,
    subjectSlugs: [COMPULSORY_SUBJECT, ...new Set(recommended)].slice(
      0,
      OPTIONAL_SUBJECT_SLOTS + 1,
    ),
  };
}

/**
 * Mirrors the backend DTO rule: a non-blank preferred name of 1–50 characters
 * after trimming.
 */
export function validatePreferredName(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) return "Enter a preferred name.";
  if (trimmed.length > 50) {
    return "Preferred name must be 50 characters or fewer.";
  }
  return null;
}

/**
 * Mirrors the combination rules the student can break from this form: Use of
 * English included, all three optional slots filled and no duplicates.
 */
export function validateSubjectSelection(
  subjectSlugs: string[],
): string | null {
  if (!subjectSlugs.includes(COMPULSORY_SUBJECT)) {
    return "Use of English is a compulsory UTME subject and must be included.";
  }

  const slots = getSubjectSlots(subjectSlugs);

  if (slots.some((slug) => !slug)) {
    return `Select ${OPTIONAL_SUBJECT_SLOTS} subjects in addition to Use of English.`;
  }

  if (new Set(slots).size !== slots.length) {
    return "You cannot select the same subject twice.";
  }

  return null;
}

/** True when the form differs from the last persisted (or hydrating) state. */
export function isSettingsDirty(
  current: SettingsFormValues,
  baseline: SettingsFormValues,
): boolean {
  return (
    current.preferredName.trim() !== baseline.preferredName.trim() ||
    current.programmeId !== baseline.programmeId ||
    current.subjectSlugs.join(",") !== baseline.subjectSlugs.join(",")
  );
}
