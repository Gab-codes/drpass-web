import { describe, expect, test } from "vitest";
import { QUESTION_SOURCES, isKnownSource } from "@/constants/question-sources";
import { questionFormSchema } from "./questions";

describe("QUESTION_SOURCES", () => {
  test("contains AI_GENERATED alongside the exam-board sources", () => {
    expect([...QUESTION_SOURCES]).toEqual([
      "JAMB",
      "WAEC",
      "NECO",
      "GCE",
      "AI_GENERATED",
    ]);
  });

  test("isKnownSource recognizes AI_GENERATED", () => {
    expect(isKnownSource("AI_GENERATED")).toBe(true);
    expect(isKnownSource("jamb")).toBe(false); // exact-match constant only
  });
});

describe("questionFormSchema source", () => {
  const base = {
    year: 2026,
    subject: "Chemistry",
    text: "What is the atomic number of carbon?",
    questionType: "SINGLE_CHOICE",
    options: [{ key: "A", text: "6" }],
    correctAnswer: "A",
  };

  test("accepts AI_GENERATED", () => {
    const parsed = questionFormSchema.safeParse({
      ...base,
      source: "AI_GENERATED",
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects unknown sources", () => {
    const parsed = questionFormSchema.safeParse({
      ...base,
      source: "MADE_UP",
    });
    expect(parsed.success).toBe(false);
  });
});
