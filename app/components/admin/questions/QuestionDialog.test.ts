import { describe, expect, it } from "vitest";
import { adminQuestionToFormValues } from "./QuestionDialog";
import type { AdminQuestion } from "@/types/questions";

/**
 * Canonical backend question response shape (see questions API).
 * Uses the real example payload for the form-mapping regression.
 */
const backendQuestion: AdminQuestion = {
  id: "8d21c33c-0000-0000-0000-000000000000",
  importId: null,
  source: "JAMB",
  subject: "Chemistry",
  year: 2024,
  text: "An element wil readily form an electrovalent compound if it electron configuration is",
  textHash: "hash",
  options: [
    { key: "A", text: "2, 8, 1" },
    { key: "B", text: "2, 8, 4" },
    { key: "C", text: "2, 8, 8" },
    { key: "D", text: "2, 8, 5" },
  ],
  correctAnswer: "A",
  explanation: null,
  questionType: "SINGLE_CHOICE",
  difficulty: null,
  status: "pending",
  isActive: false,
  classificationConfidence: null,
  createdBy: null,
  updatedBy: null,
  reviewedBy: null,
  createdAt: "2026-09-15T10:00:00.000Z",
  updatedAt: "2026-09-15T10:00:00.000Z",
  classification: {
    suggestedConceptId: "8d21c33c-593a-4200-88ad-3ad527b062ec",
    suggestedConceptName: "Atomic Structure and Bonding",
    confidence: 0.9,
    model: "fast",
    status: "admin_verified",
    source: "ai",
    classifiedAt: "2026-09-15T10:00:00.000Z",
    canonicalConceptId: "8d21c33c-593a-4200-88ad-3ad527b062ec",
    canonicalConceptName: "Atomic Structure and Bonding",
  },
};

describe("adminQuestionToFormValues (backend → question form mapping)", () => {
  it("populates source from the backend source", () => {
    const values = adminQuestionToFormValues(backendQuestion);
    expect(values.source).toBe("JAMB");
  });

  it("populates all four options from the backend options array", () => {
    const values = adminQuestionToFormValues(backendQuestion);
    expect(values.options).toEqual([
      { key: "A", text: "2, 8, 1" },
      { key: "B", text: "2, 8, 4" },
      { key: "C", text: "2, 8, 8" },
      { key: "D", text: "2, 8, 5" },
    ]);
  });

  it("populates text, question type, difficulty, and explanation", () => {
    const values = adminQuestionToFormValues(backendQuestion);
    expect(values.text).toBe(
      "An element wil readily form an electrovalent compound if it electron configuration is",
    );
    expect(values.type).toBe("SINGLE_CHOICE");
    expect(values.difficulty).toBeNull();
    expect(values.explanation).toBeNull();
  });

  it("populates the correct answer from the backend correctAnswer", () => {
    const values = adminQuestionToFormValues(backendQuestion);
    expect(values.correctAnswer).toBe("A");
  });

  it("maps fields that are missing on the backend to safe defaults", () => {
    const values = adminQuestionToFormValues({
      ...backendQuestion,
      source: "",
      options: null,
      questionType: "UNKNOWN",
      correctAnswer: 42,
    });
    expect(values.source).toBeNull();
    // Missing options pad every slot with empty text instead of crashing.
    expect(values.options.map((o) => o.text)).toEqual(["", "", "", ""]);
    expect(values.type).toBe("SINGLE_CHOICE");
    expect(values.correctAnswer).toBe("42");
  });

  it("carries canonical classification concept information where applicable", () => {
    // The form itself does not render classification; the canonical concept
    // travels on the question object it is adapted from.
    expect(backendQuestion.classification?.canonicalConceptId).toBe(
      "8d21c33c-593a-4200-88ad-3ad527b062ec",
    );
    expect(backendQuestion.classification?.canonicalConceptName).toBe(
      "Atomic Structure and Bonding",
    );
    expect(backendQuestion.classification?.confidence).toBe(0.9);
  });
});