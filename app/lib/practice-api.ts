import { isAxiosError } from "axios";

import { apiClient } from "@/lib/axios";
import type { Question } from "@/data/mock-exam";
import type { PracticeConfiguration, PracticeFilters } from "@/types/practice";

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

// ─── API call ───────────────────────────────────────────────────────────────

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
): Promise<Question[]> {
  try {
    const response = await apiClient.post(
      "/practice/questions",
      {
        subjects: config.subjects,
        totalTimeMinutes: config.totalTimeMinutes,
        ...(filters ? { filters } : {}),
      },
      { signal },
    );

    // The API response DTO is shape-compatible with the exam `Question`
    // contract (id / subject / text / options) — only `label` is widened from
    // a letter union to `string` on the wire, hence the narrowing cast.
    const questions = response.data?.questions as Question[] | undefined;
    if (!Array.isArray(questions)) {
      throw new PracticePrepareError(
        "server",
        "The server returned an unexpected practice response.",
      );
    }
    return questions;
  } catch (error) {
    if (error instanceof PracticePrepareError) throw error;
    if (isAxiosError(error)) {
      if (error.code === "ERR_NETWORK") {
        throw new PracticePrepareError(
          "network",
          "Could not reach the server. Check your connection and try again.",
        );
      }
      const status = error.response?.status;
      const message: string =
        error.response?.data?.message ?? error.message ?? "Request failed.";

      if (status === 400 || status === 422) {
        // Generic structured validation failures: invalid configuration or
        // insufficient eligible questions. The API deliberately does not
        // expose per-subject availability counts.
        if (/not enough eligible questions/i.test(message)) {
          throw new PracticePrepareError(
            "insufficient-questions",
            message,
            status,
          );
        }
        throw new PracticePrepareError("invalid-config", message, status);
      }
      throw new PracticePrepareError("server", message, status);
    }
    throw new PracticePrepareError(
      "unknown",
      "Something went wrong while preparing your practice.",
    );
  }
}
