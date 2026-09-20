import { describe, expect, test } from "vitest";
import type { PracticeQuestion } from "@/types/practice";
import { calculatePracticeResults } from "./practice-results";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeQuestion(
  id: string,
  subjectCode: string,
  subjectName: string,
  correctLabel: string,
): PracticeQuestion {
  const options = ["A", "B", "C", "D"].map((label) => ({
    id: `${id}-${label}`,
    label,
    text: `Option ${label}`,
  }));
  return {
    id,
    subjectCode,
    subject: subjectName,
    text: `Question ${id}`,
    options,
    correctOptionId: `${id}-${correctLabel}`,
  };
}

const ENG1 = makeQuestion("e1", "ENG", "Use of English", "A");
const ENG2 = makeQuestion("e2", "ENG", "Use of English", "B");
const MTH1 = makeQuestion("m1", "MTH", "Mathematics", "C");

describe("calculatePracticeResults", () => {
  test("returns all-zero summary for an empty question list", () => {
    const result = calculatePracticeResults([], {});
    expect(result).toEqual({
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalUnanswered: 0,
      overallPercentage: 0,
      subjects: [],
    });
  });

  test("counts an unanswered question correctly", () => {
    const result = calculatePracticeResults([ENG1], {});
    expect(result.totalUnanswered).toBe(1);
    expect(result.totalCorrect).toBe(0);
    expect(result.totalIncorrect).toBe(0);
    expect(result.overallPercentage).toBe(0);
  });

  test("counts a correct answer correctly", () => {
    const result = calculatePracticeResults([ENG1], { e1: "e1-A" });
    expect(result.totalCorrect).toBe(1);
    expect(result.totalIncorrect).toBe(0);
    expect(result.totalUnanswered).toBe(0);
    expect(result.overallPercentage).toBe(100);
  });

  test("counts an incorrect answer correctly", () => {
    const result = calculatePracticeResults([ENG1], { e1: "e1-B" });
    expect(result.totalIncorrect).toBe(1);
    expect(result.totalCorrect).toBe(0);
    expect(result.totalUnanswered).toBe(0);
    expect(result.overallPercentage).toBe(0);
  });

  test("derives per-subject scores across multiple subjects", () => {
    const answers = {
      e1: "e1-A",  // ENG1 correct
      e2: "e2-A",  // ENG2 wrong (correct is B)
      // m1 unanswered
    };
    const result = calculatePracticeResults([ENG1, ENG2, MTH1], answers);

    expect(result.totalQuestions).toBe(3);
    expect(result.totalCorrect).toBe(1);
    expect(result.totalIncorrect).toBe(1);
    expect(result.totalUnanswered).toBe(1);
    expect(result.overallPercentage).toBe(33); // 1/3 rounded

    const eng = result.subjects.find((s) => s.subjectCode === "ENG")!;
    expect(eng.total).toBe(2);
    expect(eng.correct).toBe(1);
    expect(eng.incorrect).toBe(1);
    expect(eng.unanswered).toBe(0);
    expect(eng.percentage).toBe(50);

    const mth = result.subjects.find((s) => s.subjectCode === "MTH")!;
    expect(mth.total).toBe(1);
    expect(mth.correct).toBe(0);
    expect(mth.incorrect).toBe(0);
    expect(mth.unanswered).toBe(1);
    expect(mth.percentage).toBe(0);
  });

  test("handles 100% score across multiple subjects", () => {
    const answers = {
      e1: "e1-A",
      e2: "e2-B",
      m1: "m1-C",
    };
    const result = calculatePracticeResults([ENG1, ENG2, MTH1], answers);
    expect(result.totalCorrect).toBe(3);
    expect(result.totalIncorrect).toBe(0);
    expect(result.totalUnanswered).toBe(0);
    expect(result.overallPercentage).toBe(100);
    for (const sub of result.subjects) {
      expect(sub.percentage).toBe(100);
    }
  });

  test("totals across all subjects sum to totalQuestions", () => {
    const answers = { e1: "e1-A" };
    const result = calculatePracticeResults([ENG1, ENG2, MTH1], answers);
    expect(result.totalCorrect + result.totalIncorrect + result.totalUnanswered).toBe(result.totalQuestions);
    for (const sub of result.subjects) {
      expect(sub.correct + sub.incorrect + sub.unanswered).toBe(sub.total);
    }
  });
});
