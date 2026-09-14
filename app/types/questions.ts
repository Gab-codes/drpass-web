import type { AnswerOption, ParsedQuestion } from "@/types/import-types";

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
  subject: string;
  year: number;
  text: string;
  textHash: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  status: AdminQuestionStatus;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  classification?: ClassificationSummary | null;
}

export interface AdminQuestionInput {
  year: number;
  subject: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
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
  skipped: number;
  status: AiJobStatus;
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
}
