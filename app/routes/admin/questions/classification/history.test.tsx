/**
 * Tests for the Topic Classification History page.
 *
 * Covers:
 *  - history rendering (subject, status, compact metrics, outcome chips)
 *  - in-flight vs. finished job semantics
 *  - navigation to the existing job detail page (React Router link)
 *  - pagination
 *  - filtering by status
 *  - loading / empty / error states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import TopicClassificationHistory from "./history";
import { listClassificationJobs } from "@/api/ai-classification";
import { getAdminSubjects } from "@/api/questions";
import type {
  ClassificationJobSummary,
  ClassificationJobsResult,
} from "@/types/questions";

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
  },
  listClassificationJobs: vi.fn(),
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

// Options rendered by the status select (all + six lifecycle statuses) —
// bounds the highlight walk in the filter helper below.
const STATUS_OPTION_COUNT = 7;

const makeJob = (
  overrides: Partial<ClassificationJobSummary> = {},
): ClassificationJobSummary => ({
  id: "job-1",
  subject: "Chemistry",
  status: "completed",
  total: 10,
  processed: 10,
  succeeded: 8,
  failed: 2,
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

function renderHistory(initialEntries?: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={initialEntries ?? ["/admin/questions/classification/history"]}
      >
        <Routes>
          <Route
            path="/admin/questions/classification/history"
            element={<TopicClassificationHistory />}
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
  vi.mocked(getAdminSubjects).mockResolvedValue([
    { subject: "Chemistry", total: 50, pending: 5, approved: 40, rejected: 5 },
    { subject: "Physics", total: 100, pending: 10, approved: 80, rejected: 10 },
  ]);
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("TopicClassificationHistory — rendering", () => {
  it("renders job rows with subject, status badge, date and compact metrics", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob()]),
    );
    renderHistory();

    expect(await screen.findByText("Chemistry")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText(/8\/10 succeeded/)).toBeInTheDocument();
    expect(screen.getByText("2 failed")).toBeInTheDocument();
    expect(screen.getByText("4 accepted")).toBeInTheDocument();
    expect(screen.getByText(/2 need review/)).toBeInTheDocument();
    expect(screen.getByText(/15 Jan 2026/)).toBeInTheDocument();
  });

  it("shows an in-flight job as processed-so-far, not as success/failure", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([
        makeJob({
          id: "job-2",
          status: "processing",
          processed: 5,
          succeeded: 4,
          failed: 1,
          error: null,
        }),
      ]),
    );
    renderHistory();

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(screen.getByText(/5 of 10 processed/)).toBeInTheDocument();
    expect(screen.queryByText(/succeeded/)).not.toBeInTheDocument();
  });

  it("hides the failure summary line for jobs without failures", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([
        makeJob({ failed: 0, needsReview: 0, suggested: 8, accepted: 0 }),
      ]),
    );
    renderHistory();

    expect(await screen.findByText(/8\/10 succeeded/)).toBeInTheDocument();
    expect(screen.queryByText("0 failed")).not.toBeInTheDocument();
    expect(screen.getByText("8 suggested")).toBeInTheDocument();
  });

  it("labels a job without a subject as a custom selection", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob({ subject: null })]),
    );
    renderHistory();

    expect(await screen.findByText("Custom selection")).toBeInTheDocument();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

describe("TopicClassificationHistory — navigation", () => {
  it("navigates to the existing job detail page when a row is opened", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob({ id: "job-9" })]),
    );
    renderHistory();

    fireEvent.click(await screen.findByText("Chemistry"));

    expect(await screen.findByText("Job detail page")).toBeInTheDocument();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe("TopicClassificationHistory — pagination", () => {
  it("requests the next page and shows the page readout", async () => {
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
    renderHistory();

    // The readout appears in the filter bar and (for long lists) in the
    // page footer — assert on the collection, not a single node.
    const readouts = await screen.findAllByText(/Page 1 of 2 \(40 total\)/);
    expect(readouts.length).toBeGreaterThan(0);
    expect(listClassificationJobs).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Next" })[0]);

    await waitFor(() => {
      expect(listClassificationJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 20 }),
      );
    });
    expect(
      (await screen.findAllByText(/Page 2 of 2 \(40 total\)/)).length,
    ).toBeGreaterThan(0);
  });

  it("hides pagination controls for a single page", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([makeJob()], { total: 3 }),
    );
    renderHistory();

    expect(await screen.findByText("Chemistry")).toBeInTheDocument();
    expect(screen.queryAllByText(/Page \d+ of/)).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "Next" })).toHaveLength(0);
  });
});

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * Base UI's Select ignores plain click events on non-highlighted options in
 * jsdom (it requires real pointer data or keyboard highlight), so drive the
 * control with the keyboard: open, walk the highlight onto the target
 * option, commit with Enter.
 */
async function selectStatusOption(label: string) {
  const trigger = screen.getByRole("combobox", { name: /filter by status/i });
  fireEvent.keyDown(trigger, { key: "ArrowDown" }); // opens the popup
  await screen.findByRole("option", { name: label });

  for (let i = 0; i < STATUS_OPTION_COUNT; i += 1) {
    if (
      screen.getByRole("option", { name: label }).hasAttribute("data-highlighted")
    ) {
      break;
    }
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
  }
  const target = screen.getByRole("option", { name: label });
  expect(target).toHaveAttribute("data-highlighted");
  fireEvent.keyDown(target, { key: "Enter" });
}

describe("TopicClassificationHistory — filtering", () => {
  it("requests jobs filtered by status and resets to page 1", async () => {
    vi.mocked(listClassificationJobs)
      .mockResolvedValueOnce(makeResult([makeJob()], { total: 40, page: 1 }))
      .mockResolvedValueOnce(makeResult([], { total: 0, page: 1 }));
    renderHistory();
    await screen.findByText("Chemistry");

    await selectStatusOption("Queued");

    await waitFor(() => {
      expect(listClassificationJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "queued", page: 1 }),
      );
    });
  });

  it("shows a filter-scoped empty state with a clear-filters action", async () => {
    vi.mocked(listClassificationJobs)
      .mockResolvedValueOnce(makeResult([makeJob()]))
      .mockResolvedValueOnce(makeResult([], { total: 0 }));
    renderHistory();
    await screen.findByText("Chemistry");

    await selectStatusOption("Queued");

    expect(
      await screen.findByText(/No classification jobs match these filters/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() => {
      expect(listClassificationJobs).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ status: expect.anything() }),
      );
    });
    expect(
      await screen.findByText("No classification jobs yet"),
    ).toBeInTheDocument();
  });
});

// ─── Loading / empty / error ──────────────────────────────────────────────────

describe("TopicClassificationHistory — states", () => {
  it("shows a loading state while the history is being fetched", () => {
    vi.mocked(listClassificationJobs).mockReturnValue(new Promise(() => {}));
    renderHistory();

    expect(
      screen.getByLabelText(/loading classification history/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Chemistry")).not.toBeInTheDocument();
  });

  it("shows a first-run empty state with a path to start a classification", async () => {
    vi.mocked(listClassificationJobs).mockResolvedValue(
      makeResult([], { total: 0 }),
    );
    renderHistory();

    expect(
      await screen.findByText("No classification jobs yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start a classification/i }),
    ).toBeInTheDocument();
  });

  it("shows an error state when the history fails to load", async () => {
    vi.mocked(listClassificationJobs).mockRejectedValue(
      new Error("network down"),
    );
    renderHistory();

    // getApiErrorMessage surfaces plain Error messages verbatim.
    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });
});



