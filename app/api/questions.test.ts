import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  activateQuestion,
  approveQuestion,
  createQuestion,
  deactivateQuestion,
  getAdminQuestions,
  importQuestions,
  rejectQuestion,
  updateQuestion,
} from "@/api/questions";
import { apiClient } from "@/lib/axios";
import type { AdminQuestion, ImportQuestionsResult } from "@/types/questions";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

const question: AdminQuestion = {
  id: "question-1",
  importId: null,
  subject: "Chemistry",
  year: 2020,
  text: "What is water?",
  textHash: "hash",
  optionA: "H2O",
  optionB: "CO2",
  optionC: "NaCl",
  optionD: "O2",
  correctAnswer: "A",
  status: "pending",
  isActive: false,
  createdBy: "admin-1",
  updatedBy: null,
  reviewedBy: null,
  createdAt: "2026-08-27T10:00:00.000Z",
  updatedAt: "2026-08-27T10:00:00.000Z",
};

describe("question API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the admin question list with filters", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [question] });

    await expect(
      getAdminQuestions({ status: "approved", isActive: true }),
    ).resolves.toEqual([question]);

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      "/api/v1/questions/admin",
      { params: { status: "approved", isActive: true } },
    );
  });

  it("creates a manual question without backend-owned fields", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: question });

    const input = {
      year: 2020,
      subject: "Chemistry",
      text: "What is water?",
      optionA: "H2O",
      optionB: "CO2",
      optionC: "NaCl",
      optionD: "O2",
      correctAnswer: "A" as const,
    };

    await expect(createQuestion(input)).resolves.toEqual(question);
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/v1/questions/admin",
      input,
    );
  });

  it("submits parsed questions and returns full import success counts", async () => {
    const result: ImportQuestionsResult = {
      received: 2,
      created: 2,
      duplicates: 0,
      unsupported: 0,
      failed: 0,
      importId: "import-1",
    };
    mockedApiClient.post.mockResolvedValueOnce({ data: result });

    await expect(
      importQuestions({
        questions: [
          {
            _clientId: "row-1",
            rowIndex: 1,
            year: 2020,
            subject: "Chemistry",
            text: "What is water?",
            hasImage: false,
            options: [
              { key: "A", text: "H2O" },
              { key: "B", text: "CO2" },
              { key: "C", text: "NaCl" },
              { key: "D", text: "O2" },
            ],
            answer: "A",
            status: "valid",
          },
        ],
      }),
    ).resolves.toEqual(result);
  });

  it("returns partial import counts including duplicates, unsupported, and failed", async () => {
    const result: ImportQuestionsResult = {
      received: 4,
      created: 1,
      duplicates: 1,
      unsupported: 1,
      failed: 1,
      importId: "import-2",
    };
    mockedApiClient.post.mockResolvedValueOnce({ data: result });

    await expect(importQuestions({ questions: [] })).resolves.toEqual(result);
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      "/api/v1/questions/admin/import",
      { questions: [] },
    );
  });

  it("updates editable question fields by id", async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      data: { ...question, text: "Updated text" },
    });

    await expect(
      updateQuestion({ id: question.id, input: { text: "Updated text" } }),
    ).resolves.toMatchObject({ text: "Updated text" });

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/api/v1/questions/admin/question-1",
      { text: "Updated text" },
    );
  });

  it("connects review and activation lifecycle endpoints", async () => {
    mockedApiClient.post.mockResolvedValue({ data: question });

    await approveQuestion(question.id);
    await rejectQuestion(question.id);
    await activateQuestion(question.id);
    await deactivateQuestion(question.id);

    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/questions/admin/question-1/approve",
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/questions/admin/question-1/reject",
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      3,
      "/api/v1/questions/admin/question-1/activate",
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      4,
      "/api/v1/questions/admin/question-1/deactivate",
    );
  });
});
