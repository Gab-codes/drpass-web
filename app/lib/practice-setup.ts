import { PRACTICE_LIMITS } from "@/data/mock-exam";
import type { ApiSubject } from "@/types/onboarding";
import type {
  PracticeConfiguration,
  PracticeSummaryData,
  SubjectQuestionConfig,
  TimeMode,
} from "@/types/practice";

/** Question count a subject starts with, and returns to when reselected. */
export const DEFAULT_QUESTIONS_PER_SUBJECT = 10;

/**
 * Initial per-subject configuration. The subject limit is respected up front so
 * a student with more subjects than the limit never starts over the maximum.
 */
export function createSubjectQuestionConfigs(
  subjects: ApiSubject[],
): SubjectQuestionConfig[] {
  return subjects.map((subject, index) => ({
    code: subject.code,
    name: subject.name,
    count:
      index < PRACTICE_LIMITS.maxSubjects ? DEFAULT_QUESTIONS_PER_SUBJECT : 0,
  }));
}

/** The subjects the student has given at least one question to. */
export function getSelectedSubjects(
  configs: SubjectQuestionConfig[],
): SubjectQuestionConfig[] {
  return configs.filter((subject) => subject.count > 0);
}

/**
 * Sets a subject's question count. The count is the single source of truth, so
 * setting it to `0` deselects the subject and any value above `0` selects it.
 */
export function updateSubjectCount(
  configs: SubjectQuestionConfig[],
  code: string,
  count: number,
): SubjectQuestionConfig[] {
  return configs.map((subject) =>
    subject.code === code ? { ...subject, count } : subject,
  );
}

/** Toggles a subject: `0` questions deselects it, otherwise it gets the default. */
export function toggleSubjectSelection(
  configs: SubjectQuestionConfig[],
  code: string,
): SubjectQuestionConfig[] {
  return configs.map((subject) =>
    subject.code === code
      ? {
          ...subject,
          count: subject.count > 0 ? 0 : DEFAULT_QUESTIONS_PER_SUBJECT,
        }
      : subject,
  );
}

/**
 * Derives the whole summary. The suggested time always follows the total
 * question count (1 question = 1 minute); a custom time is only used once the
 * student has chosen one explicitly, and stays put while question counts change.
 */
export function getPracticeSummary(
  configs: SubjectQuestionConfig[],
  timeMode: TimeMode,
  customTimeMinutes: number,
): PracticeSummaryData {
  const subjects = getSelectedSubjects(configs);
  const totalQuestions = subjects.reduce(
    (total, subject) => total + subject.count,
    0,
  );
  const suggestedTimeMinutes = totalQuestions;

  return {
    subjects,
    totalQuestions,
    suggestedTimeMinutes,
    totalTimeMinutes:
      timeMode === "default" ? suggestedTimeMinutes : customTimeMinutes,
    timeMode,
  };
}

/**
 * Client-side guard for obviously invalid setups, with a user-facing message.
 * This does not replace the validation the Practice API will perform.
 */
export function validatePracticeSetup(
  summary: PracticeSummaryData,
): string | null {
  const { subjects, totalQuestions, totalTimeMinutes } = summary;

  if (subjects.length === 0) {
    return "Select at least one subject to practice.";
  }

  if (subjects.length > PRACTICE_LIMITS.maxSubjects) {
    return `You can practice up to ${PRACTICE_LIMITS.maxSubjects} subjects at a time.`;
  }

  if (subjects.some((subject) => subject.count > PRACTICE_LIMITS.maxQuestionsPerSubject)) {
    return `A subject can have at most ${PRACTICE_LIMITS.maxQuestionsPerSubject} questions.`;
  }

  if (totalQuestions < PRACTICE_LIMITS.minQuestionsPerSubject) {
    return "Add at least one question to your practice.";
  }

  if (totalTimeMinutes < PRACTICE_LIMITS.minTotalMinutes) {
    return "The time limit must be at least 1 minute.";
  }

  if (totalTimeMinutes > PRACTICE_LIMITS.maxTotalMinutes) {
    return `The time limit must be ${PRACTICE_LIMITS.maxTotalMinutes} minutes or less — set a custom duration.`;
  }

  return null;
}

/** Maps the summary onto the API-ready practice configuration. */
export function buildPracticeConfiguration(
  summary: PracticeSummaryData,
): PracticeConfiguration {
  return {
    subjects: summary.subjects.map((subject) => ({
      subjectCode: subject.code,
      questionCount: subject.count,
    })),
    totalTimeMinutes: summary.totalTimeMinutes,
  };
}