/**
 * Practice Setup domain types.
 *
 * `PracticeConfiguration` is what the setup screen produces. It intentionally
 * contains no routing or mock-exam concerns so the future Practice API can
 * accept the same shape (the local/mock flow extends it where it needs to).
 */

/** How the practice duration was chosen. */
export type TimeMode = "default" | "custom";

/** One of the student's subjects and how many questions they want from it. */
export interface SubjectQuestionConfig {
  code: string;
  name: string;
  /** Number of questions to attempt. `0` means the subject is not selected. */
  count: number;
}

/** Everything the summary and confirmation need, derived from the setup state. */
export interface PracticeSummaryData {
  /** Only the selected subjects (count > 0). */
  subjects: SubjectQuestionConfig[];
  totalQuestions: number;
  /** The duration that will actually be used. */
  totalTimeMinutes: number;
  /** The live question-based suggestion (1 minute per question). */
  suggestedTimeMinutes: number;
  timeMode: TimeMode;
}

/** The practice configuration handed to the start callback. */
export interface PracticeConfiguration {
  subjects: Array<{
    subjectCode: string;
    questionCount: number;
  }>;
  totalTimeMinutes: number;
}

/**
 * State passed from the setup route to the preparation route via React Router
 * location state. Extends the API-ready configuration with display names so
 * the preparation screen can show subjects without needing the full user record.
 */
export interface PracticeSessionStart {
  subjects: Array<{
    subjectCode: string;
    questionCount: number;
    /** Display name, e.g. "Use of English". Resolved from the student's subjects in setup. */
    name: string;
  }>;
  totalTimeMinutes: number;
}