import { isAxiosError } from "axios";

import { apiClient } from "@/lib/axios";
import type {
  PracticeConfiguration,
  PracticeFilters,
  PracticeQuestion,
} from "@/types/practice";

export const practiceKeys = {
  all: ["practice"] as const,
  prepare: (config: PracticeConfiguration) =>
    [...practiceKeys.all, "prepare", config] as const,
};

// ─── Error taxonomy ─────────────────────────────────────────────────────────

export type PracticePrepareErrorCode =
  | "network"
  | "invalid-config"
  | "insufficient-questions"
  | "server"
  | "unknown";

/**
 * Typed failure of the Practice preparation request. The preparation screen
 * uses the code to decide messaging; retry is always offered.
 */
export class PracticePrepareError extends Error {
  constructor(
    readonly code: PracticePrepareErrorCode,
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "PracticePrepareError";
  }
}

/** Maps an API failure to the student-facing preparation error taxonomy. */
export function toPracticePrepareError(error: unknown): PracticePrepareError {
  if (error instanceof PracticePrepareError) return error;
  if (isAxiosError(error)) {
    if (error.code === "ERR_NETWORK") {
      return new PracticePrepareError(
        "network",
        "Could not reach the server. Check your connection and try again.",
      );
    }
    const status = error.response?.status;
    const message: string =
      error.response?.data?.message ?? error.message ?? "Request failed.";

    if (status === 400 || status === 422) {
      // Structured validation failures: invalid configuration or insufficient
      // eligible questions. The API deliberately does not expose per-subject
      // availability counts.
      if (/not enough eligible questions/i.test(message)) {
        return new PracticePrepareError("insufficient-questions", message, status);
      }
      return new PracticePrepareError("invalid-config", message, status);
    }
    return new PracticePrepareError("server", message, status);
  }
  return new PracticePrepareError(
    "unknown",
    "Something went wrong while preparing your practice.",
  );
}

/**
 * Prepares a random practice question set for the authenticated student via
 * `POST /api/v1/practice/questions`.
 *
 * `filters` is intentionally omitted by the current Practice flow (no filter
 * UI yet) but is part of the request contract, so adding filter controls
 * later requires no API redesign.
 *
 * The returned questions are the exact set the exam must use — the caller
 * stores them and hands them to the exam store; no second request happens.
 */
export async function preparePracticeQuestions(
  config: PracticeConfiguration,
  filters?: PracticeFilters,
  signal?: AbortSignal,
): Promise<PracticeQuestion[]> {
  try {
    const response = await apiClient.post<{
      questions: PracticeQuestion[];
    }>("/practice/questions", {
      subjects: config.subjects,
      totalTimeMinutes: config.totalTimeMinutes,
      ...(filters ? { filters } : {}),
    }, { signal });

    const questions = response.data?.questions;
    if (!Array.isArray(questions)) {
      throw new PracticePrepareError(
        "server",
        "The server returned an unexpected practice response.",
      );
    }
    return questions;
  } catch (error) {
    throw toPracticePrepareError(error);
  }
}