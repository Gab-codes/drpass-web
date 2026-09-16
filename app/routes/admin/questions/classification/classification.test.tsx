/**
 * Tests for the Topic Classification workflow.
 *
 * Covers:
 *  - TopicClassificationSetup: subject selection, job creation, navigation
 *  - ClassificationJobPage: status rendering, polling behaviour, threshold logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import TopicClassificationSetup from "./index";
import ClassificationJobPage from "./job";
import {
  getAdminQuestions,
  getAdminQuestionIds,
  getAdminSubjects,
} from "@/api/questions";
import {
  createClassificationJob,
  getClassificationJob,
  getClassificationJobResults,
  acceptThresholdClassifications,
  acceptAllClassifications,
} from "@/api/ai-classification";
import type {
  AdminQuestion,
  AiClassificationJob,
  AiClassificationJobResults,
} from "@/types/questions";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/api/questions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/questions")>();
  return {
    ...actual,
    getAdminSubjects: vi.fn(),
    getAdminQuestions: vi.fn(),
    getAdminQuestionIds: vi.fn(),
  };
});

vi.mock("@/api/ai-classification", () => ({
  aiClassificationKeys: {
    all: ["ai-classification"],
    job: (id: string) => ["ai-classification", "job", id],
    results: (id: string) => ["ai-classification", "results", id],
    exceptions: (id: string, query: object) => ["ai-classification", "exceptions", id, query],
  },
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

const makeJob = (overrides: Partial<AiClassificationJob> = {}): AiClassificationJob => ({
  id: "job-1",
  subject: "Physics",
  total: 100,
  processed: 0,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  status: "queued",
  error: null,
  createdAt: new Date().toISOString(),
  completedAt: null,
  ...overrides,
});

const makeResults = (overrides: Partial<AiClassificationJobResults> = {}): AiClassificationJobResults => ({
  jobId: "job-1",
  status: "completed",
  total: 100,
  processed: 100,
  suggested: 80,
  accepted: 0,
  needsReview: 5,
  failed: 15,
  skipped: 0,
  confidence: { high: 50, medium: 20, low: 10 },
  ...overrides,
});

// ─── Question fixtures ────────────────────────────────────────────────────────

const makeQuestion = (
  overrides: Partial<AdminQuestion> = {},
): AdminQuestion => ({
  id: "q-1",
  importId: null,
  source: "JAMB",
  subject: "Chemistry",
  year: 2024,
  text: "What is the atomic number of carbon?",
  textHash: "hash-1",
  options: [
    { key: "A", text: "6" },
    { key: "B", text: "12" },
    { key: "C", text: "14" },
    { key: "D", text: "8" },
  ],
  correctAnswer: "A",
  questionType: "SINGLE_CHOICE",
  difficulty: null,
  explanation: null,
  status: "approved",
  isActive: true,
  classificationConfidence: null,
  createdBy: null,
  updatedBy: null,
  reviewedBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  classification: null,
  ...overrides,
});

function listResponse(
  questions: AdminQuestion[],
  total = questions.length,
  page = 1,
  pageSize = 50,
) {
  return {
    data: questions,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderSetup() {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/questions/classification"]}>
        <Routes>
          <Route path="/admin/questions/classification" element={<TopicClassificationSetup />} />
          <Route path="/admin/questions/classification/:jobId" element={<div>Job Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function selectSubject(name = "Chemistry") {
  await screen.findByRole("combobox");
  fireEvent.change(screen.getByRole("combobox"), { target: { value: name } });
  // Wait for the eligible list to finish loading: the count text and the row
  // checkboxes (including the page header checkbox) only settle once data
  // arrives, and the header checkbox is disabled while loading.
  await screen.findByText(/eligible question/);
  await waitFor(() =>
    expect(
      screen.getByRole("checkbox", {
        name: "Select all questions on this page",
      }),
    ).toBeEnabled(),
  );
}

function renderJobPage(jobId = "job-1") {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/admin/questions/classification/${jobId}`]}>
        <Routes>
          <Route path="/admin/questions/classification/:jobId" element={<ClassificationJobPage />} />
          <Route path="/admin/questions/classification" element={<div>Setup Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── Setup Page Tests ─────────────────────────────────────────────────────────

describe("TopicClassificationSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminSubjects).mockResolvedValue([
      { subject: "Physics", total: 100, pending: 10, approved: 80, rejected: 10 },
      { subject: "Chemistry", total: 50, pending: 5, approved: 40, rejected: 5 },
    ]);
    vi.mocked(getAdminQuestions).mockResolvedValue(
      listResponse([makeQuestion()]),
    );
    vi.mocked(getAdminQuestionIds).mockResolvedValue(["q-1"]);
  });

  it("renders the page heading and description", async () => {
    renderSetup();
    expect(await screen.findByText("Topic Classification")).toBeInTheDocument();
  });

  it("lists available subjects from the API", async () => {
    renderSetup();
    const select = await screen.findByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: /Physics/ })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: /Chemistry/ })).toBeInTheDocument();
  });

  it("shows subject stats when a subject is selected", async () => {
    renderSetup();
    await screen.findByRole("combobox");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Physics" } });
    expect(await screen.findByText("80")).toBeInTheDocument(); // approved count
  });

  it("disables the CTA and makes no request when nothing is selected", async () => {
    renderSetup();
    await screen.findByRole("combobox");
    expect(
      screen.getByRole("button", { name: "Classify 0 Questions" }),
    ).toBeDisabled();

    await selectSubject();
    expect(
      screen.getByRole("button", { name: "Classify 0 Questions" }),
    ).toBeDisabled();
    expect(createClassificationJob).not.toHaveBeenCalled();
  });

  it("creates the job with the explicitly selected question ids", async () => {
    vi.mocked(createClassificationJob).mockResolvedValue(makeJob({ id: "new-job" }));
    renderSetup();
    await selectSubject();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: /atomic number of carbon/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Classify 1 Question" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Classification" }),
    );

    await waitFor(() => {
      expect(vi.mocked(createClassificationJob).mock.calls[0][0]).toEqual({
        questionIds: ["q-1"],
        force: false,
      });
    });
    expect(await screen.findByText("Job Page")).toBeInTheDocument();
  });

  it("passes force=true when the toggle is enabled", async () => {
    vi.mocked(createClassificationJob).mockResolvedValue(makeJob());
    renderSetup();
    await selectSubject();

    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: /atomic number of carbon/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Classify 1 Question" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Classification" }),
    );

    await waitFor(() => {
      expect(vi.mocked(createClassificationJob).mock.calls[0][0]).toEqual({
        questionIds: ["q-1"],
        force: true,
      });
    });
  });

  // ─── Question selection ─────────────────────────────────────────────────────

  it("shows the eligible question count and the selected count", async () => {
    vi.mocked(getAdminQuestions).mockResolvedValue(
      listResponse([makeQuestion()], 762, 1, 50),
    );
    renderSetup();
    await selectSubject();

    expect(
      await screen.findByText("762 eligible questions"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });

  it("adds a question id to the selection and enables the CTA", async () => {
    renderSetup();
    await selectSubject();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: /atomic number of carbon/i }),
    );

    expect(await screen.findByText("1 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /atomic number of carbon/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Classify 1 Question" }),
    ).toBeEnabled();
  });

  it("removes a question id from the selection when unchecked", async () => {
    renderSetup();
    await selectSubject();

    const row = await screen.findByRole("checkbox", {
      name: /atomic number of carbon/i,
    });
    fireEvent.click(row);
    expect(await screen.findByText("1 selected")).toBeInTheDocument();

    fireEvent.click(row);
    expect(await screen.findByText("0 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Classify 0 Questions" }),
    ).toBeDisabled();
  });

  it("pluralises the CTA label for the number of selected questions", async () => {
    const questions = Array.from({ length: 12 }, (_, i) =>
      makeQuestion({ id: `q-${i + 1}`, text: `Question number ${i + 1}` }),
    );
    vi.mocked(getAdminQuestions).mockResolvedValue(listResponse(questions, 12));
    renderSetup();
    await selectSubject();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select all questions on this page",
      }),
    );

    expect(await screen.findByText("12 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Classify 12 Questions" }),
    ).toBeInTheDocument();
  });

  it("keeps selections when paging away and back", async () => {
    vi.mocked(getAdminQuestions).mockImplementation(async (filters = {}) => {
      if ((filters.page ?? 1) === 1) {
        return listResponse(
          [makeQuestion({ id: "q-1", text: "Page one question" })],
          2,
          1,
          1,
        );
      }
      return listResponse(
        [makeQuestion({ id: "q-2", text: "Page two question" })],
        2,
        2,
        1,
      );
    });
    renderSetup();
    await selectSubject();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: /Page one question/i }),
    );
    expect(await screen.findByText("1 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: /Page two question/i }),
    );
    expect(await screen.findByText("2 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    expect(
      await screen.findByRole("checkbox", { name: /Page one question/i }),
    ).toBeChecked();
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("selects every question on the current page and clears only that page", async () => {
    vi.mocked(getAdminQuestions).mockImplementation(async (filters = {}) => {
      if ((filters.page ?? 1) === 1) {
        return listResponse(
          [makeQuestion({ id: "q-1", text: "Page one question" })],
          2,
          1,
          1,
        );
      }
      return listResponse(
        [makeQuestion({ id: "q-2", text: "Page two question" })],
        2,
        2,
        1,
      );
    });
    const headerCheckbox = () =>
      screen.getByRole("checkbox", {
        name: "Select all questions on this page",
      });
    renderSetup();
    await selectSubject();

    // Page 1: the header checkbox selects every visible question.
    fireEvent.click(headerCheckbox());
    expect(await screen.findByText("1 selected")).toBeInTheDocument();

    // Page 2: same action, on the other page.
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("checkbox", { name: /Page two question/i });
    fireEvent.click(headerCheckbox());
    expect(await screen.findByText("2 selected")).toBeInTheDocument();

    // Back on page 1: unchecking clears the visible page only.
    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByRole("checkbox", { name: /Page one question/i });
    fireEvent.click(headerCheckbox());
    expect(await screen.findByText("1 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Page one question/i }),
    ).not.toBeChecked();
  });

  it("selects all eligible questions across the result set in one request", async () => {
    const allIds = Array.from({ length: 762 }, (_, i) => `q-${i + 1}`);
    vi.mocked(getAdminQuestions).mockResolvedValue(
      listResponse([makeQuestion({ id: "q-1" })], 762, 1, 50),
    );
    vi.mocked(getAdminQuestionIds).mockResolvedValue(allIds);
    renderSetup();
    await selectSubject();

    // The whole-result-set action is offered once the visible page is selected.
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select all questions on this page",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Select all 762 eligible questions",
      }),
    );

    expect(await screen.findByText("762 selected")).toBeInTheDocument();
    // One request materialises the ids — no page-by-page fetching.
    expect(getAdminQuestionIds).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/All 762 eligible questions are selected/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Classify 762 Questions" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Classification" }),
    );

    await waitFor(() => {
      expect(vi.mocked(createClassificationJob).mock.calls[0][0]).toEqual({
        questionIds: allIds,
        force: false,
      });
    });
  });

  it("preserves the selection when job creation fails", async () => {
    vi.mocked(createClassificationJob).mockRejectedValue(new Error("boom"));
    renderSetup();
    await selectSubject();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: /atomic number of carbon/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Classify 1 Question" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Start Classification" }),
    );

    expect(await screen.findByText("boom")).toBeInTheDocument();
    // Selection survives so the admin can retry without re-selecting.
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /atomic number of carbon/i }),
    ).toBeChecked();
    expect(screen.queryByText("Job Page")).not.toBeInTheDocument();
  });
});

// ─── Job Page Tests ───────────────────────────────────────────────────────────

describe("ClassificationJobPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows progress when job is processing", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "processing", processed: 40, total: 100 })
    );
    renderJobPage();
    expect(await screen.findByText(/AI is classifying questions/i)).toBeInTheDocument();
    expect(await screen.findByText("40 of 100 processed")).toBeInTheDocument();
  });

  it("shows results panel when job is completed", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(makeResults());
    renderJobPage();
    expect(await screen.findByText("Classification Summary")).toBeInTheDocument();
    expect(await screen.findByText("Confidence Distribution")).toBeInTheDocument();
    expect(await screen.findByText("Accept Suggestions")).toBeInTheDocument();
  });

  it("shows failed state when job fails", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "failed", error: "AI provider unavailable" })
    );
    renderJobPage();
    expect(await screen.findByText("Classification job failed")).toBeInTheDocument();
    expect(await screen.findByText("AI provider unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Failed Questions/i })).toBeInTheDocument();
  });

  it("shows cancelled state without retry button", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "cancelled" })
    );
    renderJobPage();
    expect(await screen.findByText("Classification job was cancelled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
  });

  it("retries failures via client-side navigation to the new job (no page reload)", async () => {
    const { retryFailedClassification } = await import("@/api/ai-classification");

    // A hard navigation is impossible to observe directly in jsdom, so replace
    // window.location with a plain, inspectable object: the previous
    // implementation assigned `window.location.href`, which would change href
    // here (and reload the whole browser page in a real browser).
    const originalLocation = window.location;
    const fakeLocation = {
      href: "http://localhost/",
      assign: vi.fn(),
      replace: vi.fn(),
    };
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: fakeLocation,
    });

    try {
      // job-1 is the failed job; job-2 is the retry job the mutation creates.
      vi.mocked(getClassificationJob).mockImplementation(async (id: string) =>
        id === "job-2"
          ? makeJob({
              id: "job-2",
              subject: "Retry Subject",
              status: "processing",
            })
          : makeJob({
              id: "job-1",
              status: "failed",
              error: "AI provider unavailable",
            })
      );
      vi.mocked(retryFailedClassification).mockResolvedValue(
        makeJob({ id: "job-2", status: "queued" })
      );

      renderJobPage();
      fireEvent.click(
        await screen.findByRole("button", { name: /Retry Failed Questions/i })
      );

      // The retry mutation is called with the CURRENT job id.
      await waitFor(() => {
        expect(retryFailedClassification).toHaveBeenCalledWith("job-1");
      });

      // The newly created job renders in place — client-side router navigation.
      expect(
        await screen.findByText("Retry Subject — Classification Job")
      ).toBeInTheDocument();
      expect(vi.mocked(getClassificationJob)).toHaveBeenCalledWith("job-2");

      // ...and no hard navigation / browser reload was performed.
      expect(fakeLocation.href).toBe("http://localhost/");
      expect(fakeLocation.assign).not.toHaveBeenCalled();
      expect(fakeLocation.replace).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: originalLocation,
      });
    }
  });

  it("keeps the existing error handling when retry fails", async () => {
    const { retryFailedClassification } = await import("@/api/ai-classification");
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "failed", error: "AI provider unavailable" })
    );
    vi.mocked(retryFailedClassification).mockRejectedValue(
      new Error("All questions in this job are already classified")
    );

    renderJobPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Retry Failed Questions/i })
    );

    await waitFor(() => {
      expect(retryFailedClassification).toHaveBeenCalledWith("job-1");
    });
    // Still on the same failed job: a failed retry must not navigate away.
    expect(
      screen.getByText("Classification job failed")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Retry Failed Questions/i })
    ).toBeEnabled();
  });

  it("does NOT fetch exceptions on load — only after clicking Review Exceptions", async () => {
    const { getClassificationJobExceptions } = await import("@/api/ai-classification");
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(
      makeResults({ failed: 5, needsReview: 3 })
    );
    renderJobPage();
    await screen.findByRole("button", { name: /Review Exceptions/i });
    expect(getClassificationJobExceptions).not.toHaveBeenCalled();
  });

  it("calls acceptThresholdClassifications with correct minConfidence", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(makeResults());
    vi.mocked(acceptThresholdClassifications).mockResolvedValue({
      jobId: "job-1",
      accepted: 70,
      skippedExistingCanonical: 0,
      skippedInvalidConcept: 0,
    });
    renderJobPage();
    await screen.findByText("Accept Suggestions");
    // Default threshold is 80%
    fireEvent.click(screen.getByRole("button", { name: /Accept ≥ 80%/i }));
    await waitFor(() => {
      expect(acceptThresholdClassifications).toHaveBeenCalledWith("job-1", 0.8);
    });
  });

  it("calls acceptAllClassifications when Accept All is clicked", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(makeResults());
    vi.mocked(acceptAllClassifications).mockResolvedValue({
      jobId: "job-1",
      accepted: 80,
      skippedExistingCanonical: 0,
      skippedInvalidConcept: 0,
    });
    renderJobPage();
    await screen.findByText("Accept Suggestions");
    fireEvent.click(screen.getByRole("button", { name: /Accept All Suggestions/i }));
    await waitFor(() => {
      expect(acceptAllClassifications).toHaveBeenCalledWith("job-1");
    });
  });
});

// ─── Terminal states & failure diagnostics ────────────────────────────────────

describe("ClassificationJobPage — terminal states & failure diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a partial job with its own status and a retry action, not as generic success", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({
        status: "partial",
        processed: 100,
        succeeded: 85,
        failed: 15,
        error: "Provider error: rate limited",
      })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(
      makeResults({
        status: "partial",
        failed: 15,
        suggested: 70,
        confidence: { high: 50, medium: 20, low: 0 },
      })
    );
    renderJobPage();
    expect(await screen.findByText("Classification Summary")).toBeInTheDocument();
    expect(await screen.findByText("Partial")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accept All Suggestions/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Retry Failed Questions/i })).toBeInTheDocument();
  });

  it("shows job-level error and counters for a failed job", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({
        status: "failed",
        total: 40,
        processed: 40,
        succeeded: 0,
        failed: 40,
        error: "Credential error: 402: Insufficient Balance (model=deepseek-v4-flash)",
      })
    );
    renderJobPage();
    expect(await screen.findByText("Classification job failed")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Credential error: 402: Insufficient Balance (model=deepseek-v4-flash)"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Processed")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Failed Questions/i })).toBeInTheDocument();
  });

  it("preserves counts for a cancelled job without presenting it as failed", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({
        status: "cancelled",
        total: 40,
        processed: 25,
        succeeded: 20,
        failed: 5,
      })
    );
    renderJobPage();
    expect(await screen.findByText("Classification job was cancelled")).toBeInTheDocument();
    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Succeeded")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows failures during processing without treating the job as finished", async () => {
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({
        status: "processing",
        total: 100,
        processed: 50,
        succeeded: 40,
        failed: 10,
      })
    );
    renderJobPage();
    expect(await screen.findByText(/AI is classifying questions/i)).toBeInTheDocument();
    expect(await screen.findByText("10")).toBeInTheDocument();
    expect(screen.getByText(/failed so far/i)).toBeInTheDocument();
    expect(getClassificationJobResults).not.toHaveBeenCalled();
  });

  it("renders failureCategory/failureReason for failed exceptions", async () => {
    const { getClassificationJobExceptions } = await import("@/api/ai-classification");
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(
      makeResults({ failed: 1, needsReview: 0 })
    );
    vi.mocked(getClassificationJobExceptions).mockResolvedValue({
      items: [
        {
          questionId: "q-1",
          subject: "Physics",
          questionText: "What is the unit of force?",
          suggestedConceptId: null,
          confidence: null,
          status: "unclassified",
          reason: "failed",
          failureCategory: "provider_credential",
          failureReason: "Credential error: 402: Insufficient Balance",
        },
      ],
      total: 1,
      page: 1,
      limit: 25,
    });
    renderJobPage();
    fireEvent.click(await screen.findByRole("button", { name: /Review Exceptions/i }));
    expect(await screen.findByText("Provider credential error")).toBeInTheDocument();
    expect(screen.getByText(/Credential error: 402: Insufficient Balance/)).toBeInTheDocument();
    // Both the summary note and the row confirm there is no usable suggestion
    expect(screen.getAllByText(/no AI suggestion/i).length).toBeGreaterThan(0);
  });

  it("keeps a low-confidence suggestion visually and semantically distinct from a failed classification", async () => {
    const { getClassificationJobExceptions } = await import("@/api/ai-classification");
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(
      makeResults({ failed: 0, needsReview: 0, confidence: { high: 0, medium: 0, low: 1 } })
    );
    vi.mocked(getClassificationJobExceptions).mockResolvedValue({
      items: [
        {
          questionId: "q-2",
          subject: "Physics",
          questionText: "What is the SI unit of power?",
          suggestedConceptId: "c-1",
          confidence: 0.55,
          status: "ai_classified",
          reason: "low_confidence",
          failureCategory: null,
          failureReason: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 25,
    });
    renderJobPage();
    fireEvent.click(await screen.findByRole("button", { name: /Review Exceptions/i }));
    // Badge inside the table (filter tab shares the label, so use getAllBy)
    expect((await screen.findAllByText("Low Confidence")).length).toBeGreaterThan(0);
    expect(await screen.findByText(/AI suggestion — not yet the canonical/i)).toBeInTheDocument();
    expect(await screen.findByText("55%")).toBeInTheDocument();
  });
});
