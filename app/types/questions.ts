import type { ParsedQuestion } from "@/types/import-types";

export type AdminQuestionStatus = "pending" | "approved" | "rejected";

export type ClassificationStatus =
  | "unclassified"
  | "ai_classified"
  | "needs_review"
  | "admin_verified";

export type ClassificationSource = "ai" | "admin";

export interface ClassificationSummary {
  suggestedConceptId: string | null;
  suggestedConceptName: string | null;
  confidence: number | null;
  model: string | null;
  status: ClassificationStatus;
  source: ClassificationSource;
  classifiedAt: string | null;
  canonicalConceptId: string | null;
  canonicalConceptName: string | null;
}

export interface AdminQuestion {
  id: string;
  importId: string | null;
  source: string;
  subject: string;
  year: number | null;
  text: string;
  textHash: string;
  options: QuestionOptionPair[] | null;
  correctAnswer: string | number | string[];
  questionType: string;
  difficulty: string | null;
  explanation: string | null;
  status: AdminQuestionStatus;
  isActive: boolean;
  classificationConfidence: number | null;
  createdBy: string | null;
  updatedBy: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  classification?: ClassificationSummary | null;
}

/** Backend option shape: { key, text } */
export interface QuestionOptionPair {
  key: string;
  text: string;
}

export interface AdminQuestionInput {
  year: number;
  subject: string;
  text: string;
  source: string;
  questionType: string;
  options: QuestionOptionPair[] | null;
  correctAnswer: string | number | string[];
  difficulty?: string | null;
  explanation?: string | null;
}

export type AdminQuestionUpdateInput = Partial<AdminQuestionInput>;

export interface ImportQuestionsInput {
  questions: Array<
    Pick<
      ParsedQuestion,
      | "_clientId"
      | "rowIndex"
      | "year"
      | "subject"
      | "text"
      | "options"
      | "correctAnswer"
      | "source"
      | "type"
      | "difficulty"
      | "explanation"
      | "status"
      | "statusReason"
      | "hasImage"
    >
  >;
}

export interface ImportQuestionsResult {
  received: number;
  created: number;
  duplicates: number;
  unsupported: number;
  failed: number;
  importId: string | null;
}

export interface AdminQuestionFilters {
  status?: AdminQuestionStatus;
  importId?: string;
  subject?: string;
  isActive?: boolean;
  search?: string;
  classification?: ClassificationStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminSubjectSummary {
  subject: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ApproveAllPendingResult {
  affected: number;
}

// ─── AI Classification Job Types ──────────────────────────────────────────────

export type AiJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";

export interface AiClassificationJob {
  id: string;
  subject: string | null;
  total: number;
  processed: number;
  /** Outcome counters — reliable, backend-maintained. */
  succeeded: number;
  failed: number;
  skipped: number;
  status: AiJobStatus;
  /**
   * Representative failure reason. Present whenever `failed > 0`
   * (including `partial` jobs), not only for `failed` jobs.
   */
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AiClassificationJobResults {
  jobId: string;
  status: AiJobStatus;
  total: number;
  processed: number;
  suggested: number;
  accepted: number;
  needsReview: number;
  failed: number;
  skipped: number;
  confidence: { high: number; medium: number; low: number };
}

export interface AiJobExceptionItem {
  questionId: string;
  subject: string;
  questionText: string;
  suggestedConceptId: string | null;
  confidence: number | null;
  status: string;
  reason: "failed" | "needs_review" | "low_confidence";
  /**
   * Backend-provided diagnostic category (e.g. provider_credential,
   * provider_rate_limit, timeout_network, …). Present for failed
   * classifications; treated as an open set, not a closed enum.
   */
  failureCategory: string | null;
  /** Sanitized human-readable failure reason from the backend. */
  failureReason: string | null;
}

export interface AiJobExceptionsResult {
  items: AiJobExceptionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AcceptClassificationResult {
  jobId: string;
  accepted: number;
  skippedExistingCanonical: number;
  skippedInvalidConcept: number;
}

export type ExceptionFilter = "all" | "failed" | "needs_review" | "low_confidence";

export interface ExceptionQuery {
  filter?: ExceptionFilter;
  page?: number;
  limit?: number;
  /** Confidence range (0..1), optional backend filtering. */
  minConfidence?: number;
  maxConfidence?: number;
}

// ─── Topic Classification History ─────────────────────────────────────────────

export interface ClassificationJobsQuery {
  subject?: string;
  status?: AiJobStatus;
  page?: number;
  limit?: number;
}

/**
 * One history row: the persisted job state plus the per-job suggestion
 * aggregates (suggested / accepted / needs review) computed by the backend.
 */
export interface ClassificationJobSummary {
  id: string;
  subject: string | null;
  status: AiJobStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  /** Suggestions still awaiting review (ai_classified). */
  suggested: number;
  /** Suggestions accepted into canonical classifications (admin_verified). */
  accepted: number;
  needsReview: number;
  model: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ClassificationJobsResult {
  items: ClassificationJobSummary[];
  total: number;
  page: number;
  limit: number;
}
