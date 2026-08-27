import type { AnswerOption, ParsedQuestion } from "@/types/import-types";

export type AdminQuestionStatus = "pending" | "approved" | "rejected";

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
      | "answer"
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
