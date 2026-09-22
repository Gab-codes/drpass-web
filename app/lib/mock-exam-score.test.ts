import { describe, expect, test } from "vitest";

import type { ExamConfig } from "@/data/mock-exam";
import {
  MOCK_EXAM,
  MOCK_EXAM_ENGLISH_CODE,
  buildMockExamAllocation,
} from "@/lib/mock-exam";
import { calculateMockExamScore } from "@/lib/mock-exam-score";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CODES = [MOCK_EXAM_ENGLISH_CODE, "MTH", "PHY", "CHM"];
const NAMES: Record<string, string> = {
  [MOCK_EXAM_ENGLISH_CODE]: "Use of English",
  MTH: "Mathematics",
  PHY: "Physics",
  CHM: "Chemistry",
};

/** A fixed 60/40/40/40 exam configuration, built from the shared domain rule. */
const allocation = buildMockExamAllocation(CODES);
const config: ExamConfig = {
  subjects: allocation.ok ? allocation.subjects : [],
  totalTimeMinutes: MOCK_EXAM.totalTimeMinutes,
  mode: "mock",
  exitPath: "/mock-exam",
};

function allocatedFor(code: string): number {
  return code === MOCK_EXAM_ENGLISH_CODE
    ? MOCK_EXAM.englishQuestions
    : MOCK_EXAM.otherSubjectQuestions;
}

let nextId = 0;

/** One delivered question for a subject. */
function question(subjectCode: string) {
  nextId += 1;
  const id = `q-${nextId}`;
  return {
    id,
    subjectCode,
    subject: NAMES[subjectCode] ?? subjectCode,
    text: `Question ${nextId}`,
    options: [
      { id: `${id}-a`, label: "A", text: "A" },
      { id: `${id}-b`, label: "B", text: "B" },
    ],
    correctOptionId: `${id}-a`,
  };
}

/**
 * Builds a full 60/40/40/40 question set where `correctBySubject` questions
 * are answered correctly, `wrongBySubject` incorrectly and the rest are left
 * unanswered. Deterministic — no randomness anywhere.
 */
function buildSession(
  correctBySubject: Record<string, number>,
  wrongBySubject: Record<string, number> = {},
) {
  const questions = CODES.flatMap((code) =>
    Array.from({ length: allocatedFor(code) }, () => question(code)),
  );

  const answers: Record<string, string> = {};
  let cursor = 0;

  for (const code of CODES) {
    const subjectQuestions = questions.slice(cursor, cursor + allocatedFor(code));
    cursor += allocatedFor(code);

    for (let i = 0; i < (correctBySubject[code] ?? 0); i++) {
      answers[subjectQuestions[i].id] = subjectQuestions[i].correctOptionId;
    }
    for (let i = 0; i < (wrongBySubject[code] ?? 0); i++) {
      const q = subjectQuestions[(correctBySubject[code] ?? 0) + i];
      answers[q.id] = q.options[1].id; // deliberately wrong
    }
  }

  return { questions, answers };
}

/** Drops the 40th delivered question of a subject (shortens its session). */
function dropLastQuestionOf(
  questions: ReturnType<typeof buildSession>["questions"],
  subjectCode: string,
) {
  const lastIndexOfSubject = questions.reduce(
    (last, q, index) => (q.subjectCode === subjectCode ? index : last),
    -1,
  );
  return questions.filter((_, index) => index !== lastIndexOfSubject);
}

// ─── Raw score ────────────────────────────────────────────────────────────────

describe("calculateMockExamScore — raw score", () => {
  test("zero correct: raw 0 / 180 and JAMB-style 0 / 400", () => {
    const { questions, answers } = buildSession({});
    const score = calculateMockExamScore(questions, answers, config);

    expect(score.rawCorrect).toBe(0);
    expect(score.totalQuestions).toBe(MOCK_EXAM.totalQuestions);
    expect(score.jambStyleScore).toBe(0);
  });

  test("perfect Mock Exam: raw 180 / 180 and JAMB-style 400 / 400", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 60,
      MTH: 40,
      PHY: 40,
      CHM: 40,
    });
    const score = calculateMockExamScore(questions, answers, config);

    expect(score.rawCorrect).toBe(180);
    expect(score.jambStyleScore).toBe(400);
  });

  test("unanswered questions score zero (no negative marking) and are counted", () => {
    // 30 correct English, 20 correct MTH; everything else unanswered.
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 30,
      MTH: 20,
    });
    const score = calculateMockExamScore(questions, answers, config);

    expect(score.rawCorrect).toBe(50);
    expect(score.totalQuestions).toBe(180);
    const english = score.subjects.find(
      (s) => s.subjectCode === MOCK_EXAM_ENGLISH_CODE,
    );
    const mth = score.subjects.find((s) => s.subjectCode === "MTH");
    expect(english?.unanswered).toBe(30);
    expect(mth?.unanswered).toBe(20);
  });

  test("raw score stays reliable when the JAMB-style score is omitted", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const score = calculateMockExamScore(
      dropLastQuestionOf(questions, "PHY"),
      answers,
      config,
    );

    // The dropped Physics question was unanswered, so the raw result is intact.
    expect(score.rawCorrect).toBe(135);
    expect(score.jambStyleScore).toBeNull();
  });
});

// ─── JAMB-style score ─────────────────────────────────────────────────────────

describe("calculateMockExamScore — JAMB-style score", () => {
  test("representative mixed performance: 135/180 raw → 300/400 (the task's example)", () => {
    // English 45/60 → 75/100 (proportional), each other subject 30/40 → 75/100.
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const score = calculateMockExamScore(questions, answers, config);

    expect(score.rawCorrect).toBe(135);
    expect(score.jambStyleScore).toBe(300);
    expect(score.subjects.map((s) => s.score)).toEqual([75, 75, 75, 75]);
  });

  test("the JAMB-style score is subject-relative, not a global linear scale", () => {
    // Strong English (60/60 → 100) with weak others (10/40 → 25 each) = 175.
    // A naive global scale would give (90/180) × 400 = 200 — deliberately different.
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 60,
      MTH: 10,
      PHY: 10,
      CHM: 10,
    });
    const score = calculateMockExamScore(questions, answers, config);

    expect(score.rawCorrect).toBe(90);
    expect(score.jambStyleScore).toBe(175);
    expect(score.jambStyleScore).not.toBe(200);
  });

  test("all four subjects carry their fixed allocation", () => {
    const { questions, answers } = buildSession({});
    const score = calculateMockExamScore(questions, answers, config);

    expect(score.subjects.map((s) => [s.subjectCode, s.allocated])).toEqual([
      [MOCK_EXAM_ENGLISH_CODE, 60],
      ["MTH", 40],
      ["PHY", 40],
      ["CHM", 40],
    ]);
  });

  test("Use of English is scaled proportionally to 100 (documented approximation, not per-section JAMB weights)", () => {
    // 30/60 English → 50/100 under the proportional model.
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 30,
      MTH: 40,
      PHY: 40,
      CHM: 40,
    });
    const score = calculateMockExamScore(questions, answers, config);

    const english = score.subjects.find(
      (s) => s.subjectCode === MOCK_EXAM_ENGLISH_CODE,
    );
    expect(english?.score).toBe(50);
    expect(score.jambStyleScore).toBe(350);
  });

  test("fractional subject marks are rounded to the nearest integer before summing", () => {
    // 41/60 × 100 = 68.33 → 68; 37/40 × 100 = 92.5 → 93 (round half up).
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 41,
      MTH: 37,
      PHY: 40,
      CHM: 40,
    });
    const score = calculateMockExamScore(questions, answers, config);

    const english = score.subjects.find(
      (s) => s.subjectCode === MOCK_EXAM_ENGLISH_CODE,
    );
    const mth = score.subjects.find((s) => s.subjectCode === "MTH");
    expect(english?.score).toBe(68);
    expect(mth?.score).toBe(93);
    expect(score.jambStyleScore).toBe(68 + 93 + 100 + 100);
  });

  test("is deterministic — the same session always scores identically", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const a = calculateMockExamScore(questions, answers, config);
    const b = calculateMockExamScore(questions, answers, config);
    expect(b).toEqual(a);
  });
});

// ─── Unscorable sessions ──────────────────────────────────────────────────────

describe("calculateMockExamScore — unscorable sessions (raw remains reliable)", () => {
  test("missing configuration: raw score still correct, JAMB-style score omitted", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const score = calculateMockExamScore(questions, answers, null);

    expect(score.rawCorrect).toBe(135);
    expect(score.jambStyleScore).toBeNull();
    expect(score.subjects.every((s) => s.score === null)).toBe(true);
  });

  test("a subject delivered short of its allocation omits the JAMB-style score", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const score = calculateMockExamScore(
      dropLastQuestionOf(questions, "PHY"),
      answers,
      config,
    );

    expect(score.totalQuestions).toBe(179);
    expect(score.rawCorrect).toBe(135);
    expect(score.jambStyleScore).toBeNull();
    const phy = score.subjects.find((s) => s.subjectCode === "PHY");
    expect(phy?.total).toBe(39);
    expect(phy?.score).toBeNull();
  });

  test("an unexpected subject in the session omits the JAMB-style score", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const score = calculateMockExamScore(
      [...questions, question("BIO")],
      answers,
      config,
    );

    expect(score.rawCorrect).toBe(135);
    expect(score.jambStyleScore).toBeNull();
  });

  test("an allocated subject with no delivered questions omits the JAMB-style score", () => {
    const { questions, answers } = buildSession({
      [MOCK_EXAM_ENGLISH_CODE]: 45,
      MTH: 30,
      PHY: 30,
      CHM: 30,
    });
    const score = calculateMockExamScore(
      questions.filter((q) => q.subjectCode !== "CHM"),
      answers,
      config,
    );

    expect(score.rawCorrect).toBe(105);
    expect(score.jambStyleScore).toBeNull();
    expect(score.subjects.some((s) => s.subjectCode === "CHM")).toBe(false);
  });

  test("empty session: nothing scored, nothing fabricated", () => {
    const score = calculateMockExamScore([], {}, config);

    expect(score.rawCorrect).toBe(0);
    expect(score.totalQuestions).toBe(0);
    expect(score.jambStyleScore).toBeNull();
    expect(score.subjects).toEqual([]);
  });
});

