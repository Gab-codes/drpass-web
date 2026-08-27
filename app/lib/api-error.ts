import { AxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
