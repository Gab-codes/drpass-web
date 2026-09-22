import { describe, expect, test } from "vitest";

import {
  MOCK_EXAM,
  MOCK_EXAM_ENGLISH_CODE,
  buildMockExamAllocation,
} from "@/lib/mock-exam";

describe("MOCK_EXAM", () => {
  test("represents the current JAMB UTME structure", () => {
    expect(MOCK_EXAM.format).toBe("jamb-utme");
    expect(MOCK_EXAM.formatVersion).toBe("2026");
    expect(MOCK_EXAM.englishQuestions).toBe(60);
    expect(MOCK_EXAM.otherSubjectQuestions).toBe(40);
    expect(MOCK_EXAM.totalQuestions).toBe(180);
    expect(MOCK_EXAM.totalTimeMinutes).toBe(120);
  });
});

describe("buildMockExamAllocation", () => {
  const COMBINATION = [MOCK_EXAM_ENGLISH_CODE, "MTH", "PHY", "CHM"];

  test("allocates 60 to English and 40 to each other subject", () => {
    const result = buildMockExamAllocation(COMBINATION);

    expect(result).toEqual({
      ok: true,
      subjects: [
        { subjectCode: "ENG", questionCount: 60 },
        { subjectCode: "MTH", questionCount: 40 },
        { subjectCode: "PHY", questionCount: 40 },
        { subjectCode: "CHM", questionCount: 40 },
      ],
    });
  });

  test("matches English by code regardless of array order", () => {
    const result = buildMockExamAllocation(["MTH", "CHM", "ENG", "PHY"]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const english = result.subjects.find(
        (s) => s.subjectCode === MOCK_EXAM_ENGLISH_CODE,
      );
      expect(english?.questionCount).toBe(60);
      expect(
        result.subjects
          .filter((s) => s.subjectCode !== MOCK_EXAM_ENGLISH_CODE)
          .every((s) => s.questionCount === 40),
      ).toBe(true);
    }
  });

  test("always requests exactly the fixed 180 questions", () => {
    const result = buildMockExamAllocation(COMBINATION);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.subjects.reduce((sum, s) => sum + s.questionCount, 0),
      ).toBe(MOCK_EXAM.totalQuestions);
    }
  });

  test("rejects a combination without Use of English", () => {
    const result = buildMockExamAllocation(["MTH", "PHY", "CHM", "BIO"]);
    expect(result).toEqual({ ok: false, reason: "missing-english" });
  });

  test("rejects combinations with fewer or more than four subjects", () => {
    expect(buildMockExamAllocation(["ENG", "MTH", "PHY"])).toEqual({
      ok: false,
      reason: "invalid-combination",
    });
    expect(buildMockExamAllocation(["ENG", "MTH", "PHY", "CHM", "BIO"])).toEqual(
      { ok: false, reason: "invalid-combination" },
    );
  });

  test("rejects duplicate subject codes", () => {
    expect(buildMockExamAllocation(["ENG", "MTH", "MTH", "PHY"])).toEqual({
      ok: false,
      reason: "duplicate-subjects",
    });
  });

  test("rejects an empty combination", () => {
    expect(buildMockExamAllocation([])).toEqual({
      ok: false,
      reason: "invalid-combination",
    });
  });
});
