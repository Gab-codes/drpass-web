/**
 * AI Classification API client.
 *
 * All functions target the `/api/v1/ai-classification` backend controller.
 * Responsibility: HTTP transport only. No business logic.
 */

import { apiClient } from "@/lib/axios";
import type {
  AiClassificationJob,
  AiClassificationJobResults,
  AiJobExceptionsResult,
  AcceptClassificationResult,
  ExceptionQuery,
  ClassificationJobsQuery,
  ClassificationJobsResult,
} from "@/types/questions";

const BASE = "/ai-classification";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const aiClassificationKeys = {
  all: ["ai-classification"] as const,
  job: (id: string) => [...aiClassificationKeys.all, "job", id] as const,
  results: (id: string) =>
    [...aiClassificationKeys.all, "results", id] as const,
  exceptions: (id: string, query: ExceptionQuery) =>
    [...aiClassificationKeys.all, "exceptions", id, query] as const,
  jobs: (query: ClassificationJobsQuery) =>
    [...aiClassificationKeys.all, "jobs", query] as const,
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface CreateClassificationJobInput {
  subject?: string;
  questionIds?: string[];
  force?: boolean;
}

/**
 * Paginated Topic Classification history. `ai_classification_jobs` is the
 * history; this only reads it. Each item carries the persisted job counters
 * plus the per-job suggestion aggregates.
 */
export async function listClassificationJobs(
  query: ClassificationJobsQuery = {},
): Promise<ClassificationJobsResult> {
  const { data } = await apiClient.get<ClassificationJobsResult>(
    `${BASE}/jobs`,
    { params: query },
  );
  return data;
}

export async function createClassificationJob(
  input: CreateClassificationJobInput,
): Promise<AiClassificationJob> {
  const { data } = await apiClient.post<AiClassificationJob>(
    `${BASE}/jobs`,
    input,
  );
  return data;
}

export async function getClassificationJob(
  id: string,
): Promise<AiClassificationJob> {
  const { data } = await apiClient.get<AiClassificationJob>(
    `${BASE}/jobs/${id}`,
  );
  return data;
}

export async function cancelClassificationJob(
  id: string,
): Promise<AiClassificationJob> {
  const { data } = await apiClient.post<AiClassificationJob>(
    `${BASE}/jobs/${id}/cancel`,
  );
  return data;
}

export async function retryFailedClassification(
  id: string,
): Promise<AiClassificationJob> {
  const { data } = await apiClient.post<AiClassificationJob>(
    `${BASE}/jobs/${id}/retry-failed`,
  );
  return data;
}

// ─── Results ──────────────────────────────────────────────────────────────────

export async function getClassificationJobResults(
  id: string,
): Promise<AiClassificationJobResults> {
  const { data } = await apiClient.get<AiClassificationJobResults>(
    `${BASE}/jobs/${id}/results`,
  );
  return data;
}

// ─── Acceptance ───────────────────────────────────────────────────────────────

export async function acceptAllClassifications(
  id: string,
): Promise<AcceptClassificationResult> {
  const { data } = await apiClient.post<AcceptClassificationResult>(
    `${BASE}/jobs/${id}/accept`,
  );
  return data;
}

/**
 * Accept only suggestions with confidence >= minConfidence.
 * @param minConfidence — float 0..1 (e.g. 0.8 for 80%)
 */
export async function acceptThresholdClassifications(
  id: string,
  minConfidence: number,
): Promise<AcceptClassificationResult> {
  const { data } = await apiClient.post<AcceptClassificationResult>(
    `${BASE}/jobs/${id}/accept-threshold`,
    { minConfidence },
  );
  return data;
}

// ─── Exceptions (lazy) ────────────────────────────────────────────────────────

export async function getClassificationJobExceptions(
  id: string,
  query: ExceptionQuery = {},
): Promise<AiJobExceptionsResult> {
  const { data } = await apiClient.get<AiJobExceptionsResult>(
    `${BASE}/jobs/${id}/exceptions`,
    { params: query },
  );
  return data;
}
