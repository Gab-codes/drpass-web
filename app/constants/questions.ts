import type { AdminQuestionStatus } from "@/types/questions";

export const STATUS_OPTIONS: Array<AdminQuestionStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
];

export function statusVariant(status: AdminQuestionStatus) {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function truncate(text: string) {
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}
