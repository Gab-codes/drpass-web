import programmeDatasetJson from "@/data/drpass-programmes.json";
import { UTME_SUBJECTS } from "@/constants/onboarding";
import type { Programme, Subject } from "@/types/onboarding";

interface ProgrammeDataset {
  version: string;
  programmes: Programme[];
}

const programmeDataset = programmeDatasetJson as ProgrammeDataset;

/** Single source of truth for programme recommendations (116 programmes). */
export const PROGRAMMES: Programme[] = programmeDataset.programmes;

/**
 * The programme dataset references subjects by their canonical UTME names,
 * while the onboarding state works with subject IDs. This maps the dataset
 * names onto the existing subject catalogue. Use of English is intentionally
 * absent — it is compulsory and never recommended.
 */
const SUBJECT_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  UTME_SUBJECTS.map((s: Subject) => [s.name, s.id])
);

const SUBJECT_NAME_ALIASES: Record<string, string> = {
  "Christian Religious Studies": "crk",
  "Islamic Religious Studies": "irk",
};

export function getRecommendedSubjectIds(programme: Programme): string[] {
  return programme.recommendedSubjects
    .map((name) => SUBJECT_NAME_ALIASES[name] ?? SUBJECT_NAME_TO_ID[name])
    .filter((id): id is string => Boolean(id));
}