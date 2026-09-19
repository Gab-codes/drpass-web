import { describe, expect, test } from "vitest";

import { PRACTICE_LIMITS } from "@/data/mock-exam";
import type { ApiSubject } from "@/types/onboarding";
import {
  DEFAULT_QUESTIONS_PER_SUBJECT,
  buildPracticeConfiguration,
  createSubjectQuestionConfigs,
  getPracticeSummary,
  getSelectedSubjects,
  toggleSubjectSelection,
  updateSubjectCount,
  validatePracticeSetup,
} from "./practice-setup";

const SUBJECTS: ApiSubject[] = [
  { id: "uuid-eng", code: "ENG", name: "Use of English" },
  { id: "uuid-mth", code: "MTH", name: "Mathematics" },
  { id: "uuid-phy", code: "PHY", name: "Physics" },
  { id: "uuid-chm", code: "CHM", name: "Chemistry" },
];

const initialConfigs = () => createSubjectQuestionConfigs(SUBJECTS);

describe("createSubjectQuestionConfigs", () => {
  test("preselects the student's subjects with the default question count", () => {
    const configs = initialConfigs();

    expect(configs.map((subject) => subject.code)).toEqual([
      "ENG",
      "MTH",
      "PHY",
      "CHM",
    ]);
    expect(
      configs.every(
        (subject) => subject.count === DEFAULT_QUESTIONS_PER_SUBJECT,
      ),
    ).toBe(true);
  });

  test("never preselects more subjects than the subject limit", () => {
    const configs = createSubjectQuestionConfigs([
      ...SUBJECTS,
      { id: "uuid-bio", code: "BIO", name: "Biology" },
    ]);

    expect(getSelectedSubjects(configs)).toHaveLength(
      PRACTICE_LIMITS.maxSubjects,
    );
  });
});

describe("question count is the source of truth for selection", () => {
  test("increasing a count from 0 selects the subject", () => {
    const deselected = updateSubjectCount(initialConfigs(), "PHY", 0);
    const reselected = updateSubjectCount(deselected, "PHY", 3);

    expect(getSelectedSubjects(deselected).map((s) => s.code)).not.toContain(
      "PHY",
    );
    expect(getSelectedSubjects(reselected).map((s) => s.code)).toContain("PHY");
  });

  test("setting a count to 0 deselects the subject", () => {
    const configs = updateSubjectCount(initialConfigs(), "MTH", 0);

    expect(getSelectedSubjects(configs).map((s) => s.code)).toEqual([
      "ENG",
      "PHY",
      "CHM",
    ]);
  });

  test("toggling an unselected subject reselects it with the default count", () => {
    const deselected = toggleSubjectSelection(initialConfigs(), "CHM");
    expect(deselected.find((s) => s.code === "CHM")?.count).toBe(0);

    const reselected = toggleSubjectSelection(deselected, "CHM");
    expect(reselected.find((s) => s.code === "CHM")?.count).toBe(
      DEFAULT_QUESTIONS_PER_SUBJECT,
    );
  });

  test("changing one subject's count leaves the others untouched", () => {
    const configs = updateSubjectCount(initialConfigs(), "ENG", 25);

    expect(configs.map((subject) => subject.count)).toEqual([
      25,
      DEFAULT_QUESTIONS_PER_SUBJECT,
      DEFAULT_QUESTIONS_PER_SUBJECT,
      DEFAULT_QUESTIONS_PER_SUBJECT,
    ]);
  });
});

describe("time behaviour", () => {
  test("the suggested and effective time follow the total question count", () => {
    const configs = updateSubjectCount(initialConfigs(), "PHY", 5);
    const summary = getPracticeSummary(configs, "default", 99);

    expect(summary.totalQuestions).toBe(35);
    expect(summary.suggestedTimeMinutes).toBe(35);
    // The stored custom value is unused while the suggested time is in effect.
    expect(summary.totalTimeMinutes).toBe(35);
  });

  test("a custom time survives later question changes", () => {
    expect(getPracticeSummary(initialConfigs(), "custom", 15).totalTimeMinutes).toBe(
      15,
    );

    const grown = getPracticeSummary(
      updateSubjectCount(initialConfigs(), "ENG", 50),
      "custom",
      15,
    );

    expect(grown.totalQuestions).toBe(80);
    expect(grown.suggestedTimeMinutes).toBe(80);
    expect(grown.totalTimeMinutes).toBe(15);
  });

  test("returning to the suggested time uses the live question count", () => {
    const suggested = getPracticeSummary(initialConfigs(), "default", 15);

    expect(suggested.timeMode).toBe("default");
    expect(suggested.totalTimeMinutes).toBe(suggested.totalQuestions);
  });
});

describe("validatePracticeSetup", () => {
  test("rejects a setup with no selected subjects", () => {
    let configs = initialConfigs();
    for (const subject of configs) {
      configs = updateSubjectCount(configs, subject.code, 0);
    }

    expect(validatePracticeSetup(getPracticeSummary(configs, "default", 0))).toBe(
      "Select at least one subject to practice.",
    );
  });

  test("rejects more subjects than the limit", () => {
    const summary = getPracticeSummary(
      [...initialConfigs(), { code: "BIO", name: "Biology", count: 10 }],
      "default",
      0,
    );

    expect(validatePracticeSetup(summary)).toBe(
      `You can practice up to ${PRACTICE_LIMITS.maxSubjects} subjects at a time.`,
    );
  });

  test("rejects a custom time above the maximum", () => {
    const summary = getPracticeSummary(
      initialConfigs(),
      "custom",
      PRACTICE_LIMITS.maxTotalMinutes + 1,
    );

    expect(validatePracticeSetup(summary)).toBe(
      `The time limit must be ${PRACTICE_LIMITS.maxTotalMinutes} minutes or less — set a custom duration.`,
    );
  });

  test("rejects a custom time below the minimum", () => {
    const summary = getPracticeSummary(initialConfigs(), "custom", 0);

    expect(validatePracticeSetup(summary)).toBe(
      "The time limit must be at least 1 minute.",
    );
  });

  test("accepts a selected subject with a working time limit", () => {
    const summary = getPracticeSummary(
      updateSubjectCount(initialConfigs(), "MTH", 5),
      "default",
      0,
    );

    expect(validatePracticeSetup(summary)).toBeNull();
  });
});

describe("buildPracticeConfiguration", () => {
  test("maps selected subjects onto API-ready codes, counts and time", () => {
    const summary = getPracticeSummary(
      updateSubjectCount(initialConfigs(), "MTH", 5),
      "custom",
      30,
    );

    expect(buildPracticeConfiguration(summary)).toEqual({
      subjects: [
        { subjectCode: "ENG", questionCount: 10 },
        { subjectCode: "MTH", questionCount: 5 },
        { subjectCode: "PHY", questionCount: 10 },
        { subjectCode: "CHM", questionCount: 10 },
      ],
      totalTimeMinutes: 30,
    });
  });
});