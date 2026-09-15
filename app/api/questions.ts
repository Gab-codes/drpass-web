import { apiClient } from "@/lib/axios";
import type {
  AdminQuestion,
  AdminQuestionFilters,
  AdminQuestionInput,
  AdminQuestionUpdateInput,
  ImportQuestionsInput,
  ImportQuestionsResult,
  AdminSubjectSummary,
  ApproveAllPendingResult,
} from "@/types/questions";
const ADMIN_QUESTIONS_PATH = "/questions/admin";
export const questionKeys = {
  all: ["questions"] as const,
  admin: () => [...questionKeys.all, "admin"] as const,
  adminList: (filters?: AdminQuestionFilters) =>
    [...questionKeys.admin(), "list", filters ?? {}] as const,
  adminDetail: (id: string) => [...questionKeys.admin(), "detail", id] as const,
  adminSubjects: () => [...questionKeys.admin(), "subjects"] as const,
};

export const questionClassificationKeys = {
  options: (subject: string) => ["classification", "options", subject] as const,
};

export async function importQuestions(input: ImportQuestionsInput) {
  const response = await apiClient.post<ImportQuestionsResult>(
    `${ADMIN_QUESTIONS_PATH}/import`,
    input,
  );
  return response.data;
}

export async function createQuestion(input: AdminQuestionInput) {
  const response = await apiClient.post<AdminQuestion>(
    ADMIN_QUESTIONS_PATH,
    input,
  );
  return response.data;
}

export async function getAdminSubjects() {
  const response = await apiClient.get<AdminSubjectSummary[]>(
    `${ADMIN_QUESTIONS_PATH}/subjects`,
  );
  return response.data;
}

export async function getAdminQuestions(filters: AdminQuestionFilters = {}) {
  const response = await apiClient.get<{
    data: AdminQuestion[];
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  }>(ADMIN_QUESTIONS_PATH, {
    params: filters,
  });
  return response.data;
}

/**
 * Resolve the ids of every question matching `filters`, in a SINGLE request.
 *
 * Used by the Topic Classification setup screen to materialise an explicit
 * "select all eligible" selection. The list endpoint orders by `createdAt`
 * (non-unique for bulk imports), so walking offset pages could duplicate or
 * skip rows; `total` — from the caller's list-query meta — is passed as
 * `pageSize` instead. The backend applies no pageSize ceiling. Only ids are
 * retained; the full records are discarded.
 */
export async function getAdminQuestionIds(
  filters: Omit<AdminQuestionFilters, "page" | "pageSize">,
  total: number,
) {
  if (total <= 0) return [];
  const response = await apiClient.get<{ data: Array<{ id: string }> }>(
    ADMIN_QUESTIONS_PATH,
    { params: { ...filters, page: 1, pageSize: total } },
  );
  return [...new Set(response.data.data.map((q) => q.id))];
}

export async function getAdminQuestion(id: string) {
  const response = await apiClient.get<AdminQuestion>(
    `${ADMIN_QUESTIONS_PATH}/${id}`,
  );
  return response.data;
}

export async function bulkAdminQuestionsAction(input: {
  questionIds: string[];
  action: "approve" | "reject" | "activate" | "deactivate";
}) {
  const response = await apiClient.post(`${ADMIN_QUESTIONS_PATH}/bulk`, input);
  return response.data;
}

export async function updateQuestion({
  id,
  input,
}: {
  id: string;
  input: AdminQuestionUpdateInput;
}) {
  const response = await apiClient.patch<AdminQuestion>(
    `${ADMIN_QUESTIONS_PATH}/${id}`,
    input,
  );
  return response.data;
}

export async function approveQuestion(id: string) {
  const response = await apiClient.post<AdminQuestion>(
    `${ADMIN_QUESTIONS_PATH}/${id}/approve`,
  );
  return response.data;
}

export async function rejectQuestion(id: string) {
  const response = await apiClient.post<AdminQuestion>(
    `${ADMIN_QUESTIONS_PATH}/${id}/reject`,
  );
  return response.data;
}

export async function activateQuestion(id: string) {
  const response = await apiClient.post<AdminQuestion>(
    `${ADMIN_QUESTIONS_PATH}/${id}/activate`,
  );
  return response.data;
}

export async function deactivateQuestion(id: string) {
  const response = await apiClient.post<AdminQuestion>(
    `${ADMIN_QUESTIONS_PATH}/${id}/deactivate`,
  );
  return response.data;
}

export async function approveAllPendingInSubject(subject: string) {
  const response = await apiClient.post<ApproveAllPendingResult>(
    `${ADMIN_QUESTIONS_PATH}/approve-all-pending`,
    { subject },
  );
  return response.data;
}

type AiClassificationResponse = {
  concept: {
    id: string;
    name: string;
  }[];
};

export async function getAiClassificationOptions(subject: string) {
  const response = await apiClient.get<AiClassificationResponse>(
    `/ai-classification/options`,
    { params: { subject } },
  );
  return response.data;
}

export async function setAdminClassification({
  questionId,
  conceptId,
}: {
  questionId: string;
  conceptId: string | null;
}) {
  const response = await apiClient.post(
    `/ai-classification/questions/${questionId}/classification`,
    { conceptId },
  );
  return response.data;
}
