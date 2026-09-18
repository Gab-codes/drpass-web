import { useQuery } from "@tanstack/react-query";
import { getActiveSyllabus, syllabusKeys } from "@/api/syllabus";

export function useSyllabus(exam = "jamb") {
  return useQuery({
    queryKey: syllabusKeys.active(exam),
    queryFn: () => getActiveSyllabus(exam),
    staleTime: 10 * 60 * 1000, // 10 minutes — syllabus rarely changes
  });
}
