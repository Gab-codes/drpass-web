/**
 * Tests for the Topic Classification History landing level.
 *
 * Covers:
 *  - subjects are displayed with their readily-available history summary
 *  - subjects without history are still listed (navigation, not analytics)
 *  - the custom-selections group for jobs recorded without a subject
 *  - client-side navigation into a subject's job list
 *  - loading / empty / error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import TopicClassificationHistory from "./history";
import { listClassificationSubjects } from "@/api/ai-classification";
import { getAdminSubjects } from "@/api/questions";
import type { ClassificationSubjectSummary } from "@/types/questions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/api/questions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/questions")>();
  return {
    ...actual,
    getAdminSubjects: vi.fn(),
  };
});

vi.mock("@/api/ai-classification", () => ({
  aiClassificationKeys: {
    all: ["ai-classification"],
    job: (id: string) => ["ai-classification", "job", id],
    results: (id: string) => ["ai-classification", "results", id],
    exceptions: (id: string, query: object) => [
      "ai-classification",
      "exceptions",
      id,
      query,
    ],
    jobs: (query: object) => ["ai-classification", "jobs", query],
    subjects: () => ["ai-classification", "subjects"],
  },
  listClassificationJobs: vi.fn(),
  listClassificationSubjects: vi.fn(),
  createClassificationJob: vi.fn(),
  getClassificationJob: vi.fn(),
  cancelClassificationJob: vi.fn(),
  getClassificationJobResults: vi.fn(),
  getClassificationJobExceptions: vi.fn(),
  acceptAllClassifications: vi.fn(),
  acceptThresholdClassifications: vi.fn(),
  retryFailedClassification: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeSummary = (
  overrides: Partial<ClassificationSubjectSummary> = {},
): ClassificationSubjectSummary => ({
  subject: "Chemistry",
  jobCount: 3,
  totalQuestions: 1240,
  latestJobAt: "2026-09-15T09:30:00.000Z",
  latestStatus: "completed",
  ...overrides,
});

function renderHistory() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin/questions/classification/history"]}>
        <Routes>
          <Route
            path="/admin/questions/classification/history"
            element={<TopicClassificationHistory />}
          />
          <Route
            path="/admin/questions/classification/history/:subject"
            element={<div>Subject jobs page</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // resetAllMocks (not clearAllMocks): clears queued mockResolvedValueOnce
  // implementations so a failing earlier test can't leak its queue onward.
  vi.resetAllMocks();
  vi.mocked(getAdminSubjects).mockResolvedValue([
    { subject: "Chemistry", total: 50, pending: 5, approved: 40, rejected: 5 },
    { subject: "Physics", total: 100, pending: 10, approved: 80, rejected: 10 },
  ]);
  vi.mocked(listClassificationSubjects).mockResolvedValue([
    makeSummary(),
    makeSummary({
      subject: "Physics",
      jobCount: 1,
      totalQuestions: 500,
      latestJobAt: "2026-09-10T09:30:00.000Z",
      latestStatus: "partial",
    }),
  ]);
});

// ─── Subjects ─────────────────────────────────────────────────────────────────

describe("TopicClassificationHistory (subjects) — rendering", () => {
  it("lists each subject with its history summary", async () => {
    renderHistory();

    expect(
      await screen.findByRole("link", {
        name: /view classification jobs for chemistry/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /view classification jobs for physics/i,
      }),
    ).toBeInTheDocument();

    // Only statistics that were already available are shown.
    expect(screen.getByText(/3 jobs/)).toBeInTheDocument();
    expect(screen.getByText(/1,240 questions/)).toBeInTheDocument();
    expect(screen.getByText(/Last run 15 Sep 2026/)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText(/Last run 10 Sep 2026/)).toBeInTheDocument();
    expect(screen.getByText("Partial")).toBeInTheDocument();
  });

  it("lists subjects that have no classification history yet", async () => {
    vi.mocked(getAdminSubjects).mockResolvedValue([
      { subject: "Mathematics", total: 12, pending: 0, approved: 12, rejected: 0 },
    ]);
    vi.mocked(listClassificationSubjects).mockResolvedValue([]);

    renderHistory();

    expect(
      await screen.findByRole("link", {
        name: /view classification jobs for mathematics/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("No classifications yet")).toBeInTheDocument();
  });

  it("does not claim a subject is empty while its summary is still loading", async () => {
    vi.mocked(listClassificationSubjects).mockReturnValue(new Promise(() => {}));

    renderHistory();

    expect(await screen.findByText("Chemistry")).toBeInTheDocument();
    expect(screen.queryByText("No classifications yet")).not.toBeInTheDocument();
  });

  it("groups jobs recorded without a subject as custom selections", async () => {
    vi.mocked(listClassificationSubjects).mockResolvedValue([
      makeSummary(),
      makeSummary({ subject: null, jobCount: 2, totalQuestions: 12 }),
    ]);

    renderHistory();

    const custom = await screen.findByRole("link", {
      name: /view classification jobs for custom selections/i,
    });
    expect(custom).toHaveAttribute(
      "href",
      "/admin/questions/classification/history/__unassigned__",
    );
  });

  it("omits the custom-selections group when every job has a subject", async () => {
    renderHistory();

    await screen.findByText("Chemistry");
    expect(
      screen.queryByRole("link", {
        name: /view classification jobs for custom selections/i,
      }),
    ).not.toBeInTheDocument();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe("TopicClassificationHistory (subjects) — navigation", () => {
  it("opens the subject's job list when a subject card is chosen", async () => {
    renderHistory();

    fireEvent.click(
      await screen.findByRole("link", {
        name: /view classification jobs for chemistry/i,
      }),
    );

    expect(await screen.findByText("Subject jobs page")).toBeInTheDocument();
  });
});

// ─── Loading / empty / error ──────────────────────────────────────────────────

describe("TopicClassificationHistory (subjects) — states", () => {
  it("shows a loading state while the subjects are being fetched", () => {
    vi.mocked(getAdminSubjects).mockReturnValue(new Promise(() => {}));
    vi.mocked(listClassificationSubjects).mockReturnValue(new Promise(() => {}));

    renderHistory();

    expect(
      screen.getByLabelText(/loading classification history/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Chemistry")).not.toBeInTheDocument();
  });

  it("shows an empty state when no subject has questions yet", async () => {
    vi.mocked(getAdminSubjects).mockResolvedValue([]);
    vi.mocked(listClassificationSubjects).mockResolvedValue([]);

    renderHistory();

    expect(await screen.findByText("No subjects yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to question bank/i }),
    ).toBeInTheDocument();
  });

  it("shows an error state when the subjects fail to load", async () => {
    vi.mocked(getAdminSubjects).mockRejectedValue(new Error("network down"));

    renderHistory();

    // getApiErrorMessage surfaces plain Error messages verbatim.
    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

  it("still lists subjects when only the history summary fails", async () => {
    vi.mocked(listClassificationSubjects).mockRejectedValue(
      new Error("history down"),
    );

    renderHistory();

    expect(await screen.findByText(/history down/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /view classification jobs for chemistry/i,
      }),
    ).toBeInTheDocument();
  });
});
