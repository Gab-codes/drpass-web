import type { PracticeConfiguration } from "@/types/practice";

/**
 * Mock Exam domain configuration.
 *
 * The Mock Exam is deliberately not configurable: every student sits the
 * same fixed-format examination, drawn from their own four-subject UTME
 * combination. The format/version identifies which examination structure
 * these numbers represent so future format changes are never ambiguous
 * (e.g. for attempt history).
 */
export const MOCK_EXAM_FORMAT = "jamb-utme" as const;
export const MOCK_EXAM_FORMAT_VERSION = "2026";

export const MOCK_EXAM = {
  format: MOCK_EXAM_FORMAT,
  formatVersion: MOCK_EXAM_FORMAT_VERSION,
  /** Current JAMB UTME structure. */
  totalQuestions: 180,
  totalTimeMinutes: 120,
  englishQuestions: 60,
  otherSubjectQuestions: 40,
} as const;

/** Canonical code of the compulsory UTME subject. */
export const MOCK_EXAM_ENGLISH_CODE = "ENG";

/** Why a subject combination cannot sit the Mock Exam in its fixed format. */
export type MockExamAllocationError =
  | "invalid-combination"
  | "missing-english"
  | "duplicate-subjects";

/**
 * Student-facing explanation for each allocation failure. Lives beside the
 * rule so the overview and prepare screens render identical guidance.
 */
export const MOCK_EXAM_ALLOCATION_MESSAGES: Record<
  MockExamAllocationError,
  string
> = {
  "invalid-combination":
    "The Mock Exam follows the JAMB UTME format, which needs four subjects — Use of English plus three of your subjects. Your subject combination doesn't match that format yet.",
  "missing-english":
    "The Mock Exam follows the JAMB UTME format, which includes Use of English. Add Use of English to your subject combination to take it.",
  "duplicate-subjects":
    "Your subject combination contains a repeated subject. Update it before taking the Mock Exam.",
};

export type MockExamAllocation =
  | { ok: true; subjects: PracticeConfiguration["subjects"] }
  | { ok: false; reason: MockExamAllocationError };

/**
 * Explicit, deterministic Mock Exam rule: English receives 60 questions and
 * each of the other three combination subjects receives 40.
 *
 * Subject codes are the student's canonical codes (`user.subjects`); the
 * allocation is matched by code, not by array order. An invalid combination
 * is reported explicitly — never silently redistributed.
 */
export function buildMockExamAllocation(
  subjectCodes: string[],
): MockExamAllocation {
  if (new Set(subjectCodes).size !== subjectCodes.length) {
    return { ok: false, reason: "duplicate-subjects" };
  }

  if (subjectCodes.length !== 4) {
    return { ok: false, reason: "invalid-combination" };
  }

  if (!subjectCodes.includes(MOCK_EXAM_ENGLISH_CODE)) {
    return { ok: false, reason: "missing-english" };
  }

  const subjects = subjectCodes.map((subjectCode) => ({
    subjectCode,
    questionCount:
      subjectCode === MOCK_EXAM_ENGLISH_CODE
        ? MOCK_EXAM.englishQuestions
        : MOCK_EXAM.otherSubjectQuestions,
  }));

  return { ok: true, subjects };
}
