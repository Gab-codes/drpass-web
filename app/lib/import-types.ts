// ─── Domain types for the import workflow ────────────────────────────────────
// These types describe the shape of parsed data. When the real backend is wired
// up, the API responses should conform to the same shape so the UI needs no
// structural changes – only the data-fetching layer changes.

export type AnswerOption = "A" | "B" | "C" | "D";

export type QuestionStatus = "valid" | "warning" | "error" | "duplicate";

export interface ParsedOption {
  key: AnswerOption;
  text: string;
}

export interface ParsedQuestion {
  /** Stable client-side ID assigned during parsing (not a database ID). */
  _clientId: string;
  rowIndex: number;
  year: number | null;
  subject: string;
  text: string;
  options: ParsedOption[];
  answer: AnswerOption | null;
  status: QuestionStatus;
  /** Human-readable reason for warning/error/duplicate status. */
  statusReason?: string;
  /** _clientId of a possibly-matching question already in the parse result. */
  possibleDuplicateOf?: string;
  /** Has the admin explicitly resolved this duplicate (keep = true, remove = false). */
  duplicateResolution?: "keep" | "remove";
  /** Whether the admin has edited this question in the preview. */
  isEdited?: boolean;
}

export interface ParseSummary {
  totalRows: number;
  totalQuestions: number;
  years: number[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  duplicateCount: number;
}

export type ImportFormat = "xlsx" | "json";

export type ImportStatus =
  | "idle"
  | "processing"
  | "preview"
  | "submitting"
  | "submitted"
  | "error";

export interface ImportState {
  format: ImportFormat;
  file: File | null;
  status: ImportStatus;
  errorMessage?: string;
  summary: ParseSummary | null;
  questions: ParsedQuestion[];
}

// ─── Import record (for the show/details page) ────────────────────────────────
export type ImportRecordStatus =
  | "Processing"
  | "Needs Review"
  | "Submitted"
  | "Approved"
  | "Rejected";

export interface ImportRecord {
  id: string;
  subject: string;
  format: ImportFormat;
  filename: string;
  status: ImportRecordStatus;
  questionCount: number;
  years: number[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  duplicateCount: number;
  submittedBy: string;
  createdAt: string;
  questions: ParsedQuestion[];
}
