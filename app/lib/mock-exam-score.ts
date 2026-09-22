import type { ExamConfig } from "@/data/mock-exam";
import { getAnswerStatus } from "@/lib/practice-results";
import type { PracticeQuestion } from "@/types/practice";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockExamSubjectScore {
  subjectCode: string;
  subjectName: string;
  /** Questions actually delivered for this subject in the session. */
  total: number;
  correct: number;
  unanswered: number;
  /** The subject's fixed allocation (60/40) from the Mock Exam configuration. */
  allocated: number | null;
  /**
   * JAMB-style subject score out of 100. `null` when the session cannot be
   * defensibly scored (missing allocation, or the delivered count does not
   * match the fixed allocation).
   */
  score: number | null;
}

export interface MockExamScore {
  /** Raw performance: questions answered correctly out of everything delivered. */
  rawCorrect: number;
  totalQuestions: number;
  /**
   * JAMB-style score out of 400 — the sum of the four subject scores.
   * `null` when any part of the session cannot be defensibly scored; the raw
   * score is always available.
   */
  jambStyleScore: number | null;
  subjects: MockExamSubjectScore[];
}

// ─── Scoring model ────────────────────────────────────────────────────────────
//
// JAMB UTME facts the model is built on:
// - Four subjects: Use of English (60 questions) + three others (40 each).
// - Every subject is scored out of 100; the total is out of 400.
// - No negative marking: an unanswered question scores zero.
// - The three 40-question subjects are widely documented at 2.5 marks per
//   question (40 × 2.5 = 100) — mathematically identical to proportional
//   scaling of the raw correct count to 100.
// - Use of English's 60 questions map to 100 marks, but JAMB does not
//   officially publish its per-question mark values (secondary sources cite
//   section-based weights that are mutually inconsistent and do not reliably
//   sum to 100). DrPass questions carry no English section metadata, so the
//   section weights cannot be applied.
//
// Therefore every subject is scored proportionally: round(correct ÷ allocated
// × 100), and the four subject scores sum to the /400 total. This is exact
// for the three 40-question subjects and a documented approximation for Use
// of English — presented in the UI as a "JAMB-style score", never an
// official JAMB result.

/**
 * Pure, deterministic calculation of a completed Mock Exam session's result.
 *
 * Derives everything from the delivered questions, the recorded answer map
 * and the fixed Mock Exam allocation — no additional requests, no stored
 * score state. Correctness reuses `getAnswerStatus` (the same single source
 * of truth Practice results use).
 */
export function calculateMockExamScore(
  questions: PracticeQuestion[],
  answers: Record<string, string>,
  config: ExamConfig | null,
): MockExamScore {
  const allocationByCode = new Map(
    config?.subjects.map((s) => [s.subjectCode, s.questionCount]),
  );

  // ── Raw counts per subject (insertion order = delivery order) ────────────
  interface RawSubject {
    subjectName: string;
    total: number;
    correct: number;
    unanswered: number;
  }
  const rawByCode = new Map<string, RawSubject>();
  let rawCorrect = 0;

  for (const question of questions) {
    let raw = rawByCode.get(question.subjectCode);
    if (!raw) {
      raw = {
        subjectName: question.subject,
        total: 0,
        correct: 0,
        unanswered: 0,
      };
      rawByCode.set(question.subjectCode, raw);
    }

    raw.total += 1;
    const status = getAnswerStatus(question, answers);
    if (status === "correct") {
      raw.correct += 1;
      rawCorrect += 1;
    } else if (status === "unanswered") {
      raw.unanswered += 1;
    }
  }

  // ── Subject scores — scorable only when the delivered count matches the
  //    fixed allocation exactly (unexpected counts make the /400 translation
  //    indefensible, so that metric is omitted rather than fabricated) ──────
  let allScorable = allocationByCode.size > 0;

  const subjects: MockExamSubjectScore[] = Array.from(
    rawByCode,
    ([subjectCode, raw]) => {
      const allocated = allocationByCode.get(subjectCode) ?? null;
      const scorable = allocated !== null && allocated === raw.total;
      if (!scorable) allScorable = false;

      return {
        subjectCode,
        subjectName: raw.subjectName,
        total: raw.total,
        correct: raw.correct,
        unanswered: raw.unanswered,
        allocated,
        score: scorable ? Math.round((raw.correct / allocated!) * 100) : null,
      };
    },
  );

  // Every allocated subject must be present with its exact allocation too —
  // a missing or short subject makes the session unscorable.
  for (const [code, count] of allocationByCode) {
    const raw = rawByCode.get(code);
    if (!raw || raw.total !== count) allScorable = false;
  }

  const jambStyleScore = allScorable
    ? subjects.reduce((sum, subject) => sum + (subject.score ?? 0), 0)
    : null;

  return {
    rawCorrect,
    totalQuestions: questions.length,
    jambStyleScore,
    subjects,
  };
}
