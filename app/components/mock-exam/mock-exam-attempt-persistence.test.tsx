import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { saveMockExamAttempt } from "@/api/mock-exam";
import type { ExamConfig } from "@/data/mock-exam";
import { useExamStore } from "@/store/exam-store";
import type { PracticeQuestion } from "@/types/practice";
import { MockExamAttemptPersistence } from "./mock-exam-attempt-persistence";

vi.mock("@/api/mock-exam", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/mock-exam")>()),
  saveMockExamAttempt: vi.fn(),
}));

const saveAttempt = vi.mocked(saveMockExamAttempt);

const MOCK_CONFIG: ExamConfig = {
  subjects: [
    { subjectCode: "ENG", questionCount: 2 },
    { subjectCode: "MTH", questionCount: 1 },
  ],
  totalTimeMinutes: 120,
  mode: "mock",
  exitPath: "/mock-exam",
};

const STORED_ATTEMPT = {
  id: "stored",
  format: "jamb-utme",
  formatVersion: "2026",
  startedAt: "2026-09-22T09:00:00.000Z",
  completedAt: "2026-09-22T10:00:00.000Z",
  durationSeconds: 3600,
  totalQuestions: 3,
  correctAnswers: 2,
  unansweredQuestions: 1,
  jambScore: 150,
  subjects: [],
};

function seedStore(options?: { mode?: ExamConfig["mode"] }) {
  const questions: PracticeQuestion[] = [
    {
      id: "q1",
      subjectCode: "ENG",
      subject: "Use of English",
      text: "Q1",
      options: [
        { id: "q1-A", label: "A", text: "one" },
        { id: "q1-B", label: "B", text: "two" },
      ],
      correctOptionId: "q1-A",
    },
    {
      id: "q2",
      subjectCode: "ENG",
      subject: "Use of English",
      text: "Q2",
      options: [
        { id: "q2-A", label: "A", text: "one" },
        { id: "q2-B", label: "B", text: "two" },
      ],
      correctOptionId: "q2-B",
    },
    {
      id: "q3",
      subjectCode: "MTH",
      subject: "Mathematics",
      text: "Q3",
      options: [
        { id: "q3-A", label: "A", text: "one" },
        { id: "q3-B", label: "B", text: "two" },
      ],
      correctOptionId: "q3-B",
    },
  ];

  useExamStore.getState().setupExam(
    { ...MOCK_CONFIG, mode: options?.mode ?? "mock" },
    questions,
  );
  useExamStore.setState({
    status: "completed",
    startedAt: "2026-09-22T09:00:00.000Z",
    completedAt: "2026-09-22T10:00:00.000Z",
    answers: { q1: "q1-A", q2: "q2-A", q3: "q3-B" },
  });
}

function renderPersistence() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MockExamAttemptPersistence />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useExamStore.getState().resetExam();
});

describe("MockExamAttemptPersistence", () => {
  it("persists only once even after re-renders", async () => {
    seedStore();
    saveAttempt.mockResolvedValue(STORED_ATTEMPT);

    const { rerender } = renderPersistence();
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MockExamAttemptPersistence />
      </QueryClientProvider>,
    );
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MockExamAttemptPersistence />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(saveAttempt).toHaveBeenCalledTimes(1));
  });

  it("shows a retryable notice when the save fails", async () => {
    seedStore();
    saveAttempt.mockRejectedValueOnce(new Error("Network down"));

    renderPersistence();

    await waitFor(() =>
      expect(
        screen.getByText(/couldn't be saved to your history/i),
      ).toBeInTheDocument(),
    );

    saveAttempt.mockResolvedValue(STORED_ATTEMPT);
    fireEvent.click(
      screen.getByRole("button", { name: "Try saving again" }),
    );

    await waitFor(() =>
      expect(screen.queryByText(/couldn't be saved/i)).not.toBeInTheDocument(),
    );
    // The retry reuses the same attempt id: the backend treats it as the same
    // attempt, never a second history entry.
    expect(saveAttempt).toHaveBeenCalledTimes(2);
    expect(saveAttempt.mock.calls[0][0].attemptId).toBe(
      saveAttempt.mock.calls[1][0].attemptId,
    );
  });

  it("does nothing for a practice session", async () => {
    seedStore({ mode: "practice" });
    renderPersistence();

    // Give any effect a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(saveAttempt).not.toHaveBeenCalled();
    expect(screen.queryByText(/couldn't be saved/i)).not.toBeInTheDocument();
  });

  it("does nothing when the store has no completed session", async () => {
    renderPersistence();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(saveAttempt).not.toHaveBeenCalled();
  });
});
