import { isAxiosError } from "axios";

import { preparePracticeQuestions } from "@/api/practice";
import { apiClient } from "@/lib/axios";
import type {
  MockExamAttempt,
  MockExamAttemptPayload,
} from "@/types/mock-exam";
import type {
  PracticeConfiguration,
  PracticeQuestion,
} from "@/types/practice";

/**
 * Mock Exam API.
 *
 * The Mock Exam is prepared through the same real backend question flow as
 * Practice (`POST /practice/questions`) — there is deliberately no second
 * question system and no local question generation. This file gives the Mock
 * Exam its own domain query keys and its attempt-history endpoints; the
 * question request, error taxonomy and question types are reused from the
 * Practice API.
 */
export const mockExamKeys = {
  all: ["mock-exam"] as const,
  prepare: (config: PracticeConfiguration) =>
    [...mockExamKeys.all, "prepare", config] as const,
  attempts: (limit: number) => [...mockExamKeys.all, "attempts", limit] as const,
};

/**
 * Prepares the complete fixed Mock Exam question set from the backend. The
 * returned set is self-contained: the exam store is seeded with all 180
 * questions up front, so a running exam never depends on further network
 * requests.
 */
export function prepareMockExamQuestions(
  config: PracticeConfiguration,
  signal?: AbortSignal,
): Promise<PracticeQuestion[]> {
  return preparePracticeQuestions(config, undefined, signal);
}

// ─── Attempt history ─────────────────────────────────────────────────────────

/**
 * Lists the authenticated student's completed Mock Exam attempts, newest
 * first. The payload is deliberately tiny — summary metrics only, never
 * question payloads — so the overview page stays cheap to load.
 */
export async function listMockExamAttempts(
  limit = 5,
  signal?: AbortSignal,
): Promise<MockExamAttempt[]> {
  try {
    const response = await apiClient.get<{ attempts: MockExamAttempt[] }>(
      "/mock-exams/attempts",
      { params: { limit }, signal },
    );
    const attempts = response.data?.attempts;
    if (!Array.isArray(attempts)) {
      throw new Error("The server returned an unexpected attempts response.");
    }
    return attempts;
  } catch (error) {
    throw toMockExamAttemptError(error);
  }
}

/**
 * Persists a completed Mock Exam attempt. Idempotent per attempt id: a
 * duplicated completion request is a no-op and returns the stored record.
 */
export async function saveMockExamAttempt(
  payload: MockExamAttemptPayload,
  signal?: AbortSignal,
): Promise<MockExamAttempt> {
  try {
    const response = await apiClient.post<MockExamAttempt>(
      "/mock-exams/attempts",
      payload,
      { signal },
    );
    return response.data;
  } catch (error) {
    throw toMockExamAttemptError(error);
  }
}

/** Student-facing message for a failed attempt-history request. */
export function toMockExamAttemptError(error: unknown): Error {
  if (error instanceof Error && error.message && !isAxiosError(error)) {
    return error;
  }
  if (isAxiosError(error)) {
    const message: string =
      error.response?.data?.message ?? error.message ?? "Request failed.";
    return new Error(message);
  }
  return new Error("Something went wrong while syncing your mock exam results.");
}

