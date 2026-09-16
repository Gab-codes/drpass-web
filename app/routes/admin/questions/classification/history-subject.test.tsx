/**
 * Tests for the subject level of the Topic Classification history.
 *
 * Covers:
 *  - jobs are scoped to the selected subject (server-side filter)
 *  - the custom-selections group is scoped to jobs without a subject
 *  - navigation to the existing job detail route
 *  - pagination
 *  - status filtering
 *  - loading / empty / error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import SubjectClassificationHistory from "./history-subject";
import { listClassificationJobs } from "@/api/ai-classification";
import type {
  ClassificationJobSummary,
  ClassificationJobsResult,
} from "@/types/questions";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/api/ai-classification", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/ai-classification")>();
  return {
    ...actual,
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
  };
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

// Options rendered by the status select (all + six lifecycle statuses) —
// bounds the highlight walk in the filter helper below.
const STATUS_OPTION_COUNT = 7;

const makeJob = (
  overrides: Partial<ClassificationJobSummary> = {},
): ClassificationJobSummary => ({
  id: "job-1",
  subject: "Chemistry",
  status: "completed",
  total: 1240,
  processed: 1240,
  succeeded: 1180,
  failed: 60,
  skipped: 0,
  suggested: 6,
  accepted: 4,
  needsReview: 2,
  model: "auto",
  error: null,
  createdAt: "2026-01-15T09:30:00.000Z",
  startedAt: "2026-01-15T09:31:00.000Z",
  completedAt: "2026-01-15T09:34:00.000Z",
  ...overrides,
});

const makeResult = (
  items: ClassificationJobSummary[],
  overrides: Partial<ClassificationJobsResult> = {},
): ClassificationJobsResult => ({
  items,
  total: items.length,
  page: 1,
  limit: 20,
  ...overrides,
});

function subjectHistoryPath(subject: string) {
  return `/admin/questions/classification/history/${encodeURIComponent(subject)}`;
}

function renderSubjectJobs(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/admin/questions/classification/history/:subject"
            element={<SubjectClassificationHistory />}
          />
          <Route
            path="/admin/questions/classification/:jobId"
            element={<div>Job detail page</div>}
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
});

// ─── Scoping & rendering ──────────────────────────────────────────────────────

describe("SubjectClassificationHistory — scoping", () => {
  it("requests only the selected subject's jobs and renders them", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob()]),
    );
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    expect(await screen.findByText(/1,240 questions/)).toBeInTheDocument();
    expect(listClassificationJobs).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Chemistry", page: 1, limit: 20 }),
    );

    // The subject is the page context; rows are labelled by their run date.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Chemistry",
    );
    expect(screen.getByText(/15 Jan 2026/)).toBeInTheDocument();
    expect(screen.getByText(/1,180 classified/)).toBeInTheDocument();
    expect(screen.getByText(/60 failed/)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("scopes the custom-selections group to jobs without a subject", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob({ subject: null })]),
    );
    renderSubjectJobs([
      "/admin/questions/classification/history/__unassigned__",
    ]);

    expect(
      await screen.findByRole("heading", { level: 1 }),
    ).toHaveTextContent("Custom selections");
    expect(listClassificationJobs).toHaveBeenCalledWith(
      expect.objectContaining({ unassigned: true, page: 1, limit: 20 }),
    );
    expect(listClassificationJobs).not.toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.anything() }),
    );
  });

  it("shows an in-flight job as processed-so-far, not as success/failure", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([
        makeJob({
          id: "job-2",
          status: "processing",
          total: 10,
          processed: 5,
          succeeded: 4,
          failed: 1,
          error: null,
        }),
      ]),
    );
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(screen.getByText(/5 of 10 processed/)).toBeInTheDocument();
    expect(screen.queryByText(/classified/)).not.toBeInTheDocument();
  });
});

// ── Navigation ───────────────────────────────────────────────────────────────

describe("SubjectClassificationHistory — navigation", () => {
  it("navigates to the existing job detail page when a job is opened", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob({ id: "job-9" })]),
    );
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    fireEvent.click(
      await screen.findByRole("link", {
        name: /open classification job from/i,
      }),
    );

    expect(await screen.findByText("Job detail page")).toBeInTheDocument();
  });

  it("offers a way back to the subject list", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(makeResult([]));
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    expect(
      await screen.findByRole("link", { name: /all subjects/i }),
    ).toHaveAttribute("href", "/admin/questions/classification/history");
  });
});

// ─ Pagination ───────────────────────────────────────────────────────────────

describe("SubjectClassificationHistory — pagination", () => {
  it("requests the next page and updates the readout", async () => {
    vi.mocked(listClassificationJobs)
      .mockResolvedValueOnce(
        makeResult([makeJob()], { total: 40, page: 1, limit: 20 }),
      )
      .mockResolvedValueOnce(
        makeResult([makeJob({ id: "job-2" })], {
          total: 40,
          page: 2,
          limit: 20,
        }),
      );
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    expect(
      await screen.findByText(/Page 1 of 2 \(40 total\)/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(listClassificationJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({ subject: "Chemistry", page: 2, limit: 20 }),
      );
    });
    expect(
      await screen.findByText(/Page 2 of 2 \(40 total\)/),
    ).toBeInTheDocument();
  });

  it("hides pagination controls for a single page", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob()], { total: 3 }),
    );
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    expect(await screen.findByText(/1,240 questions/)).toBeInTheDocument();
    expect(screen.queryAllByText(/Page \d+ of/)).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "Next" })).toHaveLength(0);
  });
});

// ─ Status filter ───────────────────────────────────────────────────────────

/**
 * Base UI's Select ignores plain clicks on non-highlighted options in jsdom
 * (it requires real pointer data), so drive the control with the keyboard: open
 * from the trigger, then walk the highlight on the popup list (arrow keys are
 * handled by the list, not the trigger) and click the highlighted option.
 */
async function selectStatusOption(label: string) {
  const trigger = screen.getByRole("combobox", { name: /filter by status/i });
  fireEvent.keyDown(trigger, { key: "ArrowDown" }); // opens the popup
  const target = await screen.findByRole("option", { name: label });

  const listbox = screen.getByRole("listbox");
  for (let i = 0; i < STATUS_OPTION_COUNT; i += 1) {
    if (target.hasAttribute("data-highlighted")) break;
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
  }
  expect(target).toHaveAttribute("data-highlighted");
  fireEvent.click(target);
}

describe("SubjectClassificationHistory — status filter", () => {
  it("keeps the subject scope and resets to page 1 when filtering", async () => {
    vi.mocked(listClassificationJobs)
      .mockResolvedValueOnce(
        makeResult([makeJob()], { total: 40, page: 1, limit: 20 }),
      )
      .mockResolvedValueOnce(makeResult([], { total: 0, page: 1, limit: 20 }));
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);
    await screen.findByText(/1,240 questions/);

    await selectStatusOption("Failed");

    await waitFor(() => {
      expect(listClassificationJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subject: "Chemistry",
          status: "failed",
          page: 1,
        }),
      );
    });
    expect(
      await screen.findByText(/No classification jobs match this status/),
    ).toBeInTheDocument();
  });

  it("clears the status filter from the scoped empty state", async () => {
    vi.mocked(listClassificationJobs)
      .mockResolvedValueOnce(
        makeResult([makeJob()], { total: 40, page: 1, limit: 20 }),
      )
      .mockResolvedValueOnce(makeResult([], { total: 0, page: 1, limit: 20 }))
      .mockResolvedValueOnce(makeResult([makeJob()]));
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);
    await screen.findByText(/1,240 questions/);

    await selectStatusOption("Failed");
    fireEvent.click(
      await screen.findByRole("button", { name: /clear filter/i }),
    );

    await waitFor(() => {
      expect(listClassificationJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({ subject: "Chemistry" }),
      );
    });
    expect(listClassificationJobs.mock.calls.at(-1)?.[0]).not.toHaveProperty(
      "status",
    );
  });
});

// ── Loading / empty / error ──────────────────────────────────────────────────

describe("SubjectClassificationHistory — states", () => {
  it("shows a loading state while the jobs are being fetched", () => {
    vi.mocked(listClassificationJobs).mockReturnValue(new Promise(() => {}));
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    expect(
      screen.getByLabelText(/loading classification jobs/i),
    ).toBeInTheDocument();
  });

  it("shows an empty state for a subject with no history", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([], { total: 0 }),
    );
    renderSubjectJobs([subjectHistoryPath("Mathematics")]);

    expect(
      await screen.findByText("No classification jobs for Mathematics yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start a classification/i }),
    ).toBeInTheDocument();
  });

  it("shows an empty state for the custom-selections group", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([], { total: 0 }),
    );
    renderSubjectJobs([
      "/admin/questions/classification/history/__unassigned__",
    ]);

    expect(
      await screen.findByText("No custom selections yet"),
    ).toBeInTheDocument();
  });

  it("shows an error state when the jobs fail to load", async () => {
    vi.mocked(listClassificationJobs).mockRejectedValue(
      new Error("network down"),
    );
    renderSubjectJobs([subjectHistoryPath("Chemistry")]);

    // getApiErrorMessage surfaces plain Error messages verbatim.
    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });
});