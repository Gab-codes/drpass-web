import { apiClient } from "@/lib/axios";
import type { Syllabus } from "@/types/syllabus";

export const syllabusKeys = {
  all: ["syllabus"] as const,
  active: (exam: string) => [...syllabusKeys.all, "active", exam] as const,
};

export async function getActiveSyllabus(exam: string): Promise<Syllabus> {
  const response = await apiClient.get<Syllabus>(
    `/syllabus/${encodeURIComponent(exam)}/active`,
  );
  return response.data;
}
