// ─── Client-side file parsers ─────────────────────────────────────────────────
// These parsers translate raw file content into ParsedQuestion[].
// IMPORTANT: This parsing is for immediate UX preview only.
// The NestJS backend is the authoritative validation layer.
// When the API is available, replace the caller of these functions with a
// TanStack Query mutation that POSTs the file and receives the parsed result.

import * as XLSX from "xlsx";
import type { ParsedQuestion, ParseSummary, AnswerOption } from "./import-types";

// Expected XLSX column headers (case-insensitive matching)
const COLUMN_ALIASES: Record<string, string> = {
  year: "year",
  subject: "subject",
  question: "text",
  "question text": "text",
  text: "text",
  "option a": "optionA",
  a: "optionA",
  "option b": "optionB",
  b: "optionB",
  "option c": "optionC",
  c: "optionC",
  "option d": "optionD",
  d: "optionD",
  answer: "answer",
  "correct answer": "answer",
  "correct option": "answer",
};

function normaliseHeader(h: string): string {
  const key = String(h).toLowerCase().trim();
  return COLUMN_ALIASES[key] ?? key;
}

function toAnswerOption(v: unknown): AnswerOption | null {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  return ["A", "B", "C", "D"].includes(s) ? (s as AnswerOption) : null;
}

function detectStatus(q: Omit<ParsedQuestion, "status" | "statusReason">): {
  status: ParsedQuestion["status"];
  statusReason?: string;
} {
  if (!q.text || q.text.trim() === "") {
    return { status: "error", statusReason: "Missing question text" };
  }
  if (!q.answer) {
    return { status: "error", statusReason: "Missing or invalid correct answer" };
  }
  if (!q.year) {
    return { status: "error", statusReason: "Missing year" };
  }
  const nonEmptyOptions = q.options.filter((o) => o.text.trim() !== "");
  if (nonEmptyOptions.length < 2) {
    return { status: "error", statusReason: "Fewer than 2 answer options" };
  }
  if (nonEmptyOptions.length < 4) {
    return {
      status: "warning",
      statusReason: `Only ${nonEmptyOptions.length} of 4 options provided`,
    };
  }
  return { status: "valid" };
}

function detectDuplicates(questions: ParsedQuestion[]): ParsedQuestion[] {
  // Simple exact text match across all questions (case-insensitive, trimmed).
  // The backend will run a more sophisticated semantic/phonetic algorithm.
  const seen = new Map<string, string>(); // normalised text → _clientId

  return questions.map((q) => {
    const key = (q.text ?? "").toLowerCase().trim();
    if (!key) return q;

    if (seen.has(key)) {
      return {
        ...q,
        status: "duplicate" as const,
        statusReason: "Question text matches another question in this file",
        possibleDuplicateOf: seen.get(key)!,
      };
    }
    seen.set(key, q._clientId);
    return q;
  });
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

export async function parseXlsx(
  file: File
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  const allQuestions: ParsedQuestion[] = [];
  let rowGlobal = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: "",
    });

    if (rows.length === 0) continue;

    // Normalise headers
    const normalised = rows.map((raw) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) {
        out[normaliseHeader(k)] = v;
      }
      return out;
    });

    for (const row of normalised) {
      rowGlobal++;
      const clientId = `parsed_${rowGlobal}_${Math.random().toString(36).slice(2, 6)}`;
      const year = row.year ? parseInt(String(row.year), 10) || null : null;

      const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
        _clientId: clientId,
        rowIndex: rowGlobal,
        year,
        subject: String(row.subject ?? "").trim(),
        text: String(row.text ?? "").trim(),
        options: [
          { key: "A", text: String(row.optionA ?? "").trim() },
          { key: "B", text: String(row.optionB ?? "").trim() },
          { key: "C", text: String(row.optionC ?? "").trim() },
          { key: "D", text: String(row.optionD ?? "").trim() },
        ],
        answer: toAnswerOption(row.answer),
      };

      const { status, statusReason } = detectStatus(base);
      allQuestions.push({ ...base, status, statusReason });
    }
  }

  const withDuplicates = detectDuplicates(allQuestions);
  const summary = buildSummary(withDuplicates);
  return { questions: withDuplicates, summary };
}

// ── JSON ──────────────────────────────────────────────────────────────────────

export async function parseJson(
  file: File
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary }> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file. The file could not be parsed.");
  }

  // Accept either an array at root or { questions: [...] }
  const raw: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { questions?: unknown[] }).questions)
      ? (data as { questions: unknown[] }).questions
      : [];

  if (raw.length === 0) {
    throw new Error(
      "No questions found. Expected an array of question objects."
    );
  }

  const questions: ParsedQuestion[] = raw.map((item, idx) => {
    const row = item as Record<string, unknown>;
    const clientId = `parsed_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`;
    const year = row.year ? parseInt(String(row.year), 10) || null : null;

    const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
      _clientId: clientId,
      rowIndex: idx + 1,
      year,
      subject: String(row.subject ?? "").trim(),
      text: String(row.question ?? row.text ?? "").trim(),
      options: Array.isArray(row.options)
        ? (row.options as unknown[]).map((o, i) => {
            const opt = o as Record<string, unknown>;
            return {
              key: (["A", "B", "C", "D"][i] ?? "A") as AnswerOption,
              text: String(opt.text ?? opt.value ?? "").trim(),
            };
          })
        : [
            { key: "A", text: String(row.optionA ?? row.a ?? "").trim() },
            { key: "B", text: String(row.optionB ?? row.b ?? "").trim() },
            { key: "C", text: String(row.optionC ?? row.c ?? "").trim() },
            { key: "D", text: String(row.optionD ?? row.d ?? "").trim() },
          ],
      answer: toAnswerOption(row.answer ?? row.correctAnswer),
    };

    const { status, statusReason } = detectStatus(base);
    return { ...base, status, statusReason };
  });

  const withDuplicates = detectDuplicates(questions);
  const summary = buildSummary(withDuplicates);
  return { questions: withDuplicates, summary };
}

// ── Shared ─────────────────────────────────────────────────────────────────

function buildSummary(questions: ParsedQuestion[]): ParseSummary {
  const years = [
    ...new Set(questions.map((q) => q.year).filter(Boolean) as number[]),
  ].sort((a, b) => a - b);

  return {
    totalRows: questions.length,
    totalQuestions: questions.length,
    years,
    validCount: questions.filter((q) => q.status === "valid").length,
    warningCount: questions.filter((q) => q.status === "warning").length,
    errorCount: questions.filter((q) => q.status === "error").length,
    duplicateCount: questions.filter((q) => q.status === "duplicate").length,
  };
}

export async function parseFile(
  file: File,
  format: "xlsx" | "json"
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary }> {
  if (format === "xlsx") return parseXlsx(file);
  return parseJson(file);
}
