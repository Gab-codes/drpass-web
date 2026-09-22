import { preparePracticeQuestions } from "@/api/practice";
import type {
  PracticeConfiguration,
  PracticeQuestion,
} from "@/types/practice";

/**
 * Mock Exam API.
 *
 * The Mock Exam is prepared through the same real backend question flow as
 * Practice (`POST /practice/questions`) — there is deliberately no second
 * question system and no local question generation. This file only gives
 * the Mock Exam its own domain query keys; the request, error taxonomy and
 * question types are reused from the Practice API.
 */
export const mockExamKeys = {
  all: ["mock-exam"] as const,
  prepare: (config: PracticeConfiguration) =>
    [...mockExamKeys.all, "prepare", config] as const,
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
