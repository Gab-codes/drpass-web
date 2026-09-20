import type { PracticeQuestion } from "@/types/practice";

export interface SubjectScore {
  subjectCode: string;
  subjectName: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  /** 0–100, rounded to the nearest integer. */
  percentage: number;
}

export interface PracticeScoreSummary {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  /** 0–100, rounded to the nearest integer. */
  overallPercentage: number;
  subjects: SubjectScore[];
}

/**
 * Pure, stateless calculation of a completed Practice session result.
 *
 * All values are derived from the API-returned questions and the student's
 * recorded answer map. No Zustand state is read here; call this function
 * from the Results page with the store snapshot instead.
 */
export function calculatePracticeResults(
  questions: PracticeQuestion[],
  answers: Record<string, string>,
): PracticeScoreSummary {
  if (questions.length === 0) {
    return {
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalUnanswered: 0,
      overallPercentage: 0,
      subjects: [],
    };
  }

  const subjectMap = new Map<string, SubjectScore>();

  for (const q of questions) {
    if (!subjectMap.has(q.subjectCode)) {
      subjectMap.set(q.subjectCode, {
        subjectCode: q.subjectCode,
        subjectName: q.subject,
        total: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        percentage: 0,
      });
    }

    const sub = subjectMap.get(q.subjectCode)!;
    sub.total += 1;

    const selected = answers[q.id];

    if (!selected) {
      sub.unanswered += 1;
    } else if (selected === q.correctOptionId) {
      sub.correct += 1;
    } else {
      sub.incorrect += 1;
    }
  }

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnanswered = 0;

  const subjects = Array.from(subjectMap.values()).map((sub) => {
    totalCorrect += sub.correct;
    totalIncorrect += sub.incorrect;
    totalUnanswered += sub.unanswered;
    return {
      ...sub,
      percentage: Math.round((sub.correct / sub.total) * 100),
    };
  });

  return {
    totalQuestions: questions.length,
    totalCorrect,
    totalIncorrect,
    totalUnanswered,
    overallPercentage: Math.round((totalCorrect / questions.length) * 100),
    subjects,
  };
}
