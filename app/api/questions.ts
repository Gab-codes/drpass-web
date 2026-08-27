import { apiClient } from "@/lib/axios";
import type {
  AdminQuestion,
  AdminQuestionFilters,
  AdminQuestionInput,
  AdminQuestionUpdateInput,
  ImportQuestionsInput,
  ImportQuestionsResult,
} from "@/types/questions";

const ADMIN_QUESTIONS_PATH = "/api/v1/questions/admin";

export const questionKeys = {
  all: ["questions"] as const,
  admin: () => [...questionKeys.all, "admin"] as const,
  adminList: (filters?: AdminQuestionFilters) =>
    [...questionKeys.admin(), "list", filters ?? {}] as const,
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

export async function getAdminQuestions(filters: AdminQuestionFilters = {}) {
  const response = await apiClient.get<AdminQuestion[]>(ADMIN_QUESTIONS_PATH, {
    params: filters,
  });
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
