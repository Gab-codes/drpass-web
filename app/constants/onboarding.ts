import type { Subject } from "@/types/onboarding";

export const UTME_SUBJECTS: Subject[] = [
  { id: "english", name: "Use of English" }, // Compulsory
  { id: "math", name: "Mathematics" },
  { id: "physics", name: "Physics" },
  { id: "chemistry", name: "Chemistry" },
  { id: "biology", name: "Biology" },
  { id: "agric", name: "Agricultural Science" },
  { id: "econ", name: "Economics" },
  { id: "geography", name: "Geography" },
  { id: "government", name: "Government" },
  { id: "lit-eng", name: "Literature in English" },
  { id: "crk", name: "Christian Religious Knowledge" },
  { id: "irk", name: "Islamic Religious Knowledge" },
  { id: "history", name: "History" },
  { id: "commerce", name: "Commerce" },
  { id: "accounting", name: "Principles of Accounts" },
  { id: "french", name: "French" },
  { id: "igbo", name: "Igbo" },
  { id: "hausa", name: "Hausa" },
  { id: "yoruba", name: "Yoruba" },
  { id: "music", name: "Music" },
  { id: "fine-arts", name: "Fine Arts" },
  { id: "computer", name: "Computer Studies" },
];

export const COMPULSORY_SUBJECT = "english";

/**
 * Stable mapping from the frontend subject slugs (used by the onboarding UI
 * and the Zustand draft) to the backend's canonical subject codes. The
 * canonical subject UUIDs are resolved at runtime from GET /subjects by
 * matching `code` — never hardcoded.
 */
export const SUBJECT_CODE_BY_SLUG: Record<string, string> = {
  english: "ENG",
  math: "MTH",
  physics: "PHY",
  chemistry: "CHM",
  biology: "BIO",
  agric: "AGR",
  econ: "ECO",
  geography: "GEO",
  government: "GOV",
  "lit-eng": "LIT",
  crk: "CRS",
  irk: "IRS",
  history: "HIS",
  commerce: "COM",
  accounting: "ACC",
  french: "FRE",
  igbo: "IGB",
  hausa: "HAU",
  yoruba: "YOR",
  music: "MUS",
  "fine-arts": "ART",
  computer: "CMP",
};

export const SUBJECT_SLUG_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_CODE_BY_SLUG).map(([slug, code]) => [code, slug]),
);
