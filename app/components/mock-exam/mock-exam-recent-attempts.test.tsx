import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { listMockExamAttempts, prepareMockExamQuestions } from "@/api/mock-exam";
import type { MockExamAttempt } from "@/types/mock-exam";
import { MockExamRecentAttempts } from "./mock-exam-recent-attempts";

vi.mock("@/api/mock-exam", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/mock-exam")>()),
  listMockExamAttempts: vi.fn(),
  prepareMockExamQuestions: vi.fn(),
}));

const listAttempts = vi.mocked(listMockExamAttempts);
const prepareQuestions = vi.mocked(prepareMockExamQuestions);

const NEWER: MockExamAttempt = {
  id: "attempt-new",
  format: "jamb-utme",
  formatVersion: "2026",
  startedAt: "2026-09-22T09:00:00.000Z",
  completedAt: "2026-09-22T11:00:00.000Z",
  durationSeconds: 7200,
  totalQuestions: 180,
  correctAnswers: 139,
  unansweredQuestions: 4,
  jambScore: 310,
  subjects: [],
};

const OLDER: MockExamAttempt = {
  ...NEWER,
  id: "attempt-old",
  completedAt: "2026-09-15T11:00:00.000Z",
  correctAnswers: 126,
  jambScore: 280,
};

function renderAttempts() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MockExamRecentAttempts />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MockExamRecentAttempts", () => {
  it("requests a small, lightweight history list", async () => {
    listAttempts.mockResolvedValue([]);
    renderAttempts();

    await waitFor(() => expect(listAttempts).toHaveBeenCalledWith(5, expect.anything()));
  });

  it("never triggers the 180-question preparation from the overview", async () => {
    listAttempts.mockResolvedValue([]);
    renderAttempts();

    await waitFor(() => expect(listAttempts).toHaveBeenCalled());
    expect(prepareQuestions).not.toHaveBeenCalled();
  });

  it("renders completed attempts newest first", async () => {
    listAttempts.mockResolvedValue([NEWER, OLDER]);
    renderAttempts();

    await waitFor(() => expect(screen.getByText("310")).toBeInTheDocument());
    expect(screen.getByText("139 / 180 correct")).toBeInTheDocument();
    expect(screen.getByText("280")).toBeInTheDocument();
    expect(screen.getByText("126 / 180 correct")).toBeInTheDocument();
  });

  it("shows a calm empty state for a new student", async () => {
    listAttempts.mockResolvedValue([]);
    renderAttempts();

    await waitFor(() =>
      expect(
        screen.getByText(/You haven't taken a mock exam yet/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows a loading skeleton while fetching", () => {
    listAttempts.mockReturnValue(new Promise(() => {}));
    renderAttempts();

    expect(screen.getByRole("region", { name: "Recent attempts" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("shows a retryable error state without crashing", async () => {
    listAttempts.mockRejectedValue(new Error("Network down"));
    renderAttempts();

    await waitFor(() =>
      expect(
        screen.getByText(/couldn't load your attempt history/i),
      ).toBeInTheDocument(),
    );

    listAttempts.mockResolvedValue([NEWER]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByText("310")).toBeInTheDocument());
  });
});
