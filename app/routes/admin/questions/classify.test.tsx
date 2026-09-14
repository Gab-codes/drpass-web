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
import TopicClassificationSetup from "./classification/index";
import ClassificationJobPage from "./classification/job";
import { getAdminSubjects } from "@/api/questions";
import {
  createClassificationJob,
  getClassificationJob,
  getClassificationJobResults,
  acceptThresholdClassifications,
  acceptAllClassifications,
} from "@/api/ai-classification";
import type { AiClassificationJob, AiClassificationJobResults } from "@/types/questions";

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

  it("disables start button when no subject is selected", async () => {
    renderSetup();
    await screen.findByRole("combobox");
    const btn = screen.getByRole("button", { name: /Start AI Classification/i });
    expect(btn).toBeDisabled();
  });

  it("calls createClassificationJob and navigates on success", async () => {
    vi.mocked(createClassificationJob).mockResolvedValue(makeJob({ id: "new-job" }));
    renderSetup();
    await screen.findByRole("combobox");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Physics" } });
    fireEvent.click(screen.getByRole("button", { name: /Start AI Classification/i }));
    await waitFor(() => {
      expect(createClassificationJob).toHaveBeenCalledWith({
        subject: "Physics",
        force: false,
      });
    });
    expect(await screen.findByText("Job Page")).toBeInTheDocument();
  });

  it("passes force=true when the toggle is enabled", async () => {
    vi.mocked(createClassificationJob).mockResolvedValue(makeJob());
    renderSetup();
    await screen.findByRole("combobox");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Chemistry" } });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: /Start AI Classification/i }));
    await waitFor(() => {
      expect(createClassificationJob).toHaveBeenCalledWith({
        subject: "Chemistry",
        force: true,
      });
    });
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

  it("does NOT fetch exceptions on load — only after clicking Review Exceptions", async () => {
    const { getClassificationJobExceptions } = await import("@/api/ai-classification");
    vi.mocked(getClassificationJob).mockResolvedValue(
      makeJob({ status: "completed", processed: 100 })
    );
    vi.mocked(getClassificationJobResults).mockResolvedValue(
      makeResults({ failed: 5, needsReview: 3 })
    );
    renderJobPage();
    await screen.findByText("Review Exceptions");
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
