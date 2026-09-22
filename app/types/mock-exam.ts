import type { MockExamSubjectScore } from "@/lib/mock-exam-score";
import { MOCK_EXAM_FORMAT, MOCK_EXAM_FORMAT_VERSION } from "@/lib/mock-exam";

/**
 * Mock Exam attempt history types.
 *
 * An attempt is the durable record of one completed Mock Exam. Subject
 * names, allocations and scores are snapshotted at completion time, so the
 * record stays accurate even after the student changes their subject
 * combination or the question bank changes.
 */

/** Per-subject performance frozen at completion time. */
export interface MockExamAttemptSubject {
  subjectCode: string;
  subjectName: string;
  allocated: number | null;
  total: number;
  correct: number;
  unanswered: number;
  score: number | null;
}

/** A completed Mock Exam attempt as returned by the backend. */
export interface MockExamAttempt {
  id: string;
  format: string;
  formatVersion: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number | null;
  totalQuestions: number;
  correctAnswers: number;
  unansweredQuestions: number;
  jambScore: number | null;
  subjects: MockExamAttemptSubject[];
}

/** Payload for persisting a completed attempt (`POST /mock-exams/attempts`). */
export interface MockExamAttemptPayload {
  attemptId: string;
  format: string;
  formatVersion: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number | null;
  totalQuestions: number;
  correctAnswers: number;
  unansweredQuestions: number;
  jambScore: number | null;
  subjects: MockExamAttemptSubject[];
}

export function toMockExamAttemptPayload(
  attemptId: string,
  score: {
    rawCorrect: number;
    totalQuestions: number;
    jambStyleScore: number | null;
    subjects: MockExamSubjectScore[];
  },
  timing: {
    startedAt: string | null;
    completedAt: string | null;
  },
): MockExamAttemptPayload {
  const durationSeconds =
    timing.startedAt && timing.completedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(timing.completedAt).getTime() -
              new Date(timing.startedAt).getTime()) /
              1000,
          ),
        )
      : null;

  return {
    attemptId,
    format: MOCK_EXAM_FORMAT,
    formatVersion: MOCK_EXAM_FORMAT_VERSION,
    startedAt: timing.startedAt ?? timing.completedAt ?? new Date().toISOString(),
    completedAt: timing.completedAt ?? new Date().toISOString(),
    durationSeconds,
    totalQuestions: score.totalQuestions,
    correctAnswers: score.rawCorrect,
    unansweredQuestions: score.subjects.reduce(
      (sum, subject) => sum + subject.unanswered,
      0,
    ),
    jambScore: score.jambStyleScore,
    subjects: score.subjects.map((subject) => ({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      allocated: subject.allocated,
      total: subject.total,
      correct: subject.correct,
      unanswered: subject.unanswered,
      score: subject.score,
    })),
  };
}
