/**
 * Topic Classification history routing.
 *
 * The history is subject-first: `/admin/questions/classification/history`
 * lists subjects, and `.../history/:subject` lists that subject's jobs.
 * Jobs recorded without a subject (a targeted selection spanning subjects)
 * cannot be addressed by a subject name, so they are grouped under one
 * reserved segment that the subject page recognises.
 */

export const CLASSIFICATION_HISTORY_PATH =
  "/admin/questions/classification/history";

/** Reserved segment for the jobs recorded without a subject. */
export const UNASSIGNED_HISTORY_SEGMENT = "__unassigned__";

/**
 * Job-list path for a history group. `null` (or a blank subject) addresses the
 * custom-selections group; a subject name is URL-encoded so it survives
 * characters such as spaces or slashes.
 */
export function classificationHistoryJobsPath(subject: string | null): string {
  if (!subject) {
    return `${CLASSIFICATION_HISTORY_PATH}/${UNASSIGNED_HISTORY_SEGMENT}`;
  }
  return `${CLASSIFICATION_HISTORY_PATH}/${encodeURIComponent(subject)}`;
}
