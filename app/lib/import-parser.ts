// ─── Client-side file parsers ─────────────────────────────────────────────────
// These parsers translate raw file content into ParsedQuestion[].
// IMPORTANT: This parsing is for immediate UX preview only.
// The NestJS backend is the authoritative validation layer.

import * as XLSX from "xlsx";
import type { ParsedQuestion, ParseSummary, AnswerOption } from "./import-types";

function normaliseHeader(h: string): string {
  const normalized = String(h)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const aliases: Record<string, string> = {
    "year": "year",
    "subject": "subject",
    
    "question": "questionText",
    "question text": "questionText",
    "questions": "questionText",
    "text": "questionText",
    
    "option a": "optionA",
    "a": "optionA",
    
    "option b": "optionB",
    "b": "optionB",
    
    "option c": "optionC",
    "c": "optionC",
    
    "option d": "optionD",
    "d": "optionD",
    
    "answer": "correctAnswer",
    "correct answer": "correctAnswer",
    "correct option": "correctAnswer",
    "right answer": "correctAnswer",
    "correct": "correctAnswer",
  };

  return aliases[normalized] ?? normalized;
}

function toAnswerOption(v: unknown): AnswerOption | null {
  if (v == null || v === "") return null;
  const s = String(v).trim().toUpperCase();
  
  if (["A", "B", "C", "D"].includes(s)) return s as AnswerOption;
  
  const match = s.match(/(?:OPTION|ANS|ANSWER)\s*[-_:]?\s*([ABCD])/i);
  if (match) return match[1].toUpperCase() as AnswerOption;

  const letters = s.replace(/[^A-Z]/g, "");
  if (letters.length === 1 && ["A", "B", "C", "D"].includes(letters)) {
    return letters as AnswerOption;
  }
  
  return null;
}

function extractSheetMetadata(sheetName: string) {
  let year: number | null = null;
  let subject: string | null = null;

  // Find a 4 digit year starting with 19 or 20
  const yearMatch = sheetName.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10);
    const potentialSubject = sheetName.replace(yearMatch[0], "").trim().replace(/^[-_\s]+|[-_\s]+$/g, "");
    // Only use as subject if it looks like a real word (e.g., Account, Biology)
    if (potentialSubject.length > 2 && /^[a-zA-Z\s]+$/.test(potentialSubject)) {
      subject = potentialSubject;
    }
  }

  return { year, subject };
}

function detectHeaderRow(rows: unknown[][]): { headerRowIndex: number; columnMap: Record<number, string> } | null {
  const limit = Math.min(rows.length, 20);
  
  let bestRowIdx = -1;
  let bestMap: Record<number, string> = {};
  let maxScore = 0;

  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    
    let score = 0;
    const map: Record<number, string> = {};
    
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = row[colIdx];
      if (typeof cell !== "string") continue;
      const semantic = normaliseHeader(cell);
      
      if (["questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "year", "subject"].includes(semantic)) {
        score++;
        map[colIdx] = semantic;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestRowIdx = i;
      bestMap = map;
    }
  }

  // Require at least question text and 1 other recognized column
  if (maxScore >= 2 && Object.values(bestMap).includes("questionText")) {
    return { headerRowIndex: bestRowIdx, columnMap: bestMap };
  }
  
  return null;
}

function extractQuestionNumber(text: string) {
  // Support 1., 1), 1 -
  const match = text.match(/^(\d+)(?:\.|\)|-)\s*(.*)/s);
  if (match) {
    return {
      questionNumber: parseInt(match[1], 10),
      cleanText: match[2].trim(),
    };
  }
  return { questionNumber: undefined, cleanText: text };
}

function isInstructionRow(q: Omit<ParsedQuestion, "status" | "statusReason">): boolean {
  if (!q.text || q.text.trim() === "") return false;
  const nonEmptyOptions = q.options.filter((o) => o.text.trim() !== "");
  return !q.answer && nonEmptyOptions.length === 0;
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
  if (!q.subject) {
    return { status: "error", statusReason: "Missing subject" };
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

function normalizeOptions(rawOptions: Record<AnswerOption, string>) {
  const BOUNDARY_REGEX = /(?:^|\s+)(?:Option\s+)?([A-D])\s*(?:\.|\)|-|:)\s*/gi;
  
  type Piece = { letter: AnswerOption, text: string, sourceCol: AnswerOption };
  const allPieces: Piece[] = [];
  
  for (const col of ["A", "B", "C", "D"] as AnswerOption[]) {
    const text = rawOptions[col];
    if (!text) continue;
    
    const matches = [...text.matchAll(BOUNDARY_REGEX)];
    if (matches.length === 0) {
      allPieces.push({ letter: col, text, sourceCol: col });
      continue;
    }
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchLetter = match[1].toUpperCase() as AnswerOption;
      
      if (i === 0 && match.index! > 0) {
        allPieces.push({ 
          letter: col, 
          text: text.substring(0, match.index!).trim(), 
          sourceCol: col
        });
      }
      
      const nextIndex = i + 1 < matches.length ? matches[i+1].index! : text.length;
      allPieces.push({
        letter: matchLetter,
        text: text.substring(match.index! + match[0].length, nextIndex).trim(),
        sourceCol: col
      });
    }
  }

  const piecesByLetter: Record<AnswerOption, Piece[]> = { A: [], B: [], C: [], D: [] };
  for (const p of allPieces) {
    if (p.text.trim() !== "") {
      piecesByLetter[p.letter].push(p);
    }
  }

  let hasCollision = false;
  for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
    if (piecesByLetter[letter].length > 1) {
      hasCollision = true;
      break;
    }
  }

  if (!hasCollision) {
    const finalOptions: Record<AnswerOption, string> = { A: "", B: "", C: "", D: "" };
    for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
      if (piecesByLetter[letter].length === 1) {
        finalOptions[letter] = piecesByLetter[letter][0].text;
      }
    }
    return { options: finalOptions, conflict: false };
  }

  const safePiecesByLetter: Record<AnswerOption, Piece[]> = { A: [], B: [], C: [], D: [] };
  for (const col of ["A", "B", "C", "D"] as AnswerOption[]) {
    const text = rawOptions[col];
    if (!text) continue;
    
    const match = text.match(/^(?:Option\s+)?([A-D])\s*(?:\.|\)|-|:)\s*(.*)/is);
    if (match) {
      const matchLetter = match[1].toUpperCase() as AnswerOption;
      safePiecesByLetter[matchLetter].push({ letter: matchLetter, text: match[2].trim(), sourceCol: col });
    } else {
      safePiecesByLetter[col].push({ letter: col, text: text.trim(), sourceCol: col });
    }
  }
  
  let hasSafeCollision = false;
  for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
    const nonEmpty = safePiecesByLetter[letter].filter(p => p.text !== "");
    if (nonEmpty.length > 1) {
      hasSafeCollision = true;
      break;
    }
  }
  
  if (!hasSafeCollision) {
    const finalOptions: Record<AnswerOption, string> = { A: "", B: "", C: "", D: "" };
    for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
      const nonEmpty = safePiecesByLetter[letter].filter(p => p.text !== "");
      if (nonEmpty.length === 1) {
        finalOptions[letter] = nonEmpty[0].text;
      }
    }
    return { options: finalOptions, conflict: false };
  }

  const fallbackOptions: Record<AnswerOption, string> = { A: "", B: "", C: "", D: "" };
  for (const col of ["A", "B", "C", "D"] as AnswerOption[]) {
    const raw = rawOptions[col];
    const match = raw.match(/^(?:Option\s+)?([A-D])\s*(?:\.|\)|-|:)\s*(.*)/is);
    if (match && match[1].toUpperCase() === col) {
      fallbackOptions[col] = match[2].trim();
    } else {
      fallbackOptions[col] = raw.trim();
    }
  }
  
  return { options: fallbackOptions, conflict: true, conflictReason: "Conflicting option labels detected. Please review." };
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

export async function parseXlsx(
  file: File
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  const allQuestions: ParsedQuestion[] = [];
  let rowGlobal = 0;
  let contextRowCount = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    
    // First pass to detect header
    const arrayRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    if (arrayRows.length === 0) continue;

    const detected = detectHeaderRow(arrayRows);
    
    if (detected) {
      // Strategy 1: Structured column parser
      const { headerRowIndex, columnMap } = detected;
      const sheetMeta = extractSheetMetadata(sheetName);
      
      for (let i = headerRowIndex + 1; i < arrayRows.length; i++) {
        const row = arrayRows[i];
        if (!Array.isArray(row)) continue;
        
        const record: Record<string, unknown> = {};
        for (const [colIdxStr, semantic] of Object.entries(columnMap)) {
           const colIdx = parseInt(colIdxStr, 10);
           record[semantic] = row[colIdx];
        }
        
        if (Object.values(record).every(v => v === "" || v == null)) continue;
        
        rowGlobal++;
        const clientId = `parsed_${rowGlobal}_${Math.random().toString(36).slice(2, 6)}`;
        
        let rowYear = sheetMeta.year;
        let yearConflict = false;
        if (record.year) {
          const parsedYear = parseInt(String(record.year), 10);
          if (!isNaN(parsedYear)) {
            if (sheetMeta.year && parsedYear !== sheetMeta.year) {
               yearConflict = true;
            }
            rowYear = parsedYear;
          }
        }
        
        let rowSubject = record.subject ? String(record.subject).trim() : sheetMeta.subject;
        
        const rawText = String(record.questionText ?? "").trim();
        const { questionNumber, cleanText } = extractQuestionNumber(rawText);
        
        const rawOptions = {
          A: String(record.optionA ?? "").trim(),
          B: String(record.optionB ?? "").trim(),
          C: String(record.optionC ?? "").trim(),
          D: String(record.optionD ?? "").trim(),
        };
        
        const { options: normOptions, conflict, conflictReason } = normalizeOptions(rawOptions);

        const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
          _clientId: clientId,
          rowIndex: i + 1,
          questionNumber,
          year: rowYear,
          subject: rowSubject ?? "",
          text: cleanText,
          rawText,
          options: [
            { key: "A", text: normOptions.A },
            { key: "B", text: normOptions.B },
            { key: "C", text: normOptions.C },
            { key: "D", text: normOptions.D },
          ],
          answer: toAnswerOption(record.correctAnswer),
        };

        if (isInstructionRow(base)) {
          contextRowCount++;
          continue;
        }

        let { status, statusReason } = detectStatus(base);
        
        if (conflict && status === "valid") {
          status = "warning";
          statusReason = statusReason ? `${statusReason} | ${conflictReason}` : conflictReason;
        }

        if (yearConflict && status === "valid") {
           status = "warning";
           statusReason = statusReason ? `${statusReason} | Year conflict: Sheet is ${sheetMeta.year} but row says ${record.year}. Used row year.` : `Year conflict: Sheet is ${sheetMeta.year} but row says ${record.year}. Used row year.`;
        }
        
        allQuestions.push({ ...base, status, statusReason });
      }
    } else {
      // Strategy 2: Legacy Parser (fallback)
      const objectRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      
      if (objectRows.length === 0) continue;

      const normalised = objectRows.map((raw) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(raw)) {
          out[normaliseHeader(k)] = v;
        }
        return out;
      });

      for (const row of normalised) {
        rowGlobal++;
        const clientId = `parsed_legacy_${rowGlobal}_${Math.random().toString(36).slice(2, 6)}`;
        const year = row.year ? parseInt(String(row.year), 10) || null : null;
        
        const rawText = String(row.questionText ?? row.text ?? "").trim();
        const { questionNumber, cleanText } = extractQuestionNumber(rawText);

        const rawOptions = {
          A: String(row.optionA ?? "").trim(),
          B: String(row.optionB ?? "").trim(),
          C: String(row.optionC ?? "").trim(),
          D: String(row.optionD ?? "").trim(),
        };
        
        const { options: normOptions, conflict, conflictReason } = normalizeOptions(rawOptions);

        const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
          _clientId: clientId,
          rowIndex: rowGlobal,
          questionNumber,
          year,
          subject: String(row.subject ?? "").trim(),
          text: cleanText,
          rawText,
          options: [
            { key: "A", text: normOptions.A },
            { key: "B", text: normOptions.B },
            { key: "C", text: normOptions.C },
            { key: "D", text: normOptions.D },
          ],
          answer: toAnswerOption(row.answer ?? row.correctAnswer),
        };
        
        if (isInstructionRow(base)) {
          contextRowCount++;
          continue;
        }

        let { status, statusReason } = detectStatus(base);
        if (conflict && status === "valid") {
          status = "warning";
          statusReason = statusReason ? `${statusReason} | ${conflictReason}` : conflictReason;
        }

        allQuestions.push({ ...base, status, statusReason });
      }
    }
  }

  const withDuplicates = detectDuplicates(allQuestions);
  const summary = buildSummary(withDuplicates, contextRowCount);
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

  const questions: ParsedQuestion[] = [];
  let contextRowCount = 0;

  for (let idx = 0; idx < raw.length; idx++) {
    const item = raw[idx];
    const row = item as Record<string, unknown>;
    const clientId = `parsed_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`;
    
    let year = row.year ? parseInt(String(row.year), 10) || null : null;
    
    const rawText = String(row.question ?? row.text ?? "").trim();
    const { questionNumber, cleanText } = extractQuestionNumber(rawText);

    const rawOptionsArray = Array.isArray(row.options)
      ? (row.options as unknown[]).map((o, i) => {
          const opt = o as Record<string, unknown>;
          return String(opt.text ?? opt.value ?? "").trim();
        })
      : [
          String(row.optionA ?? row.a ?? "").trim(),
          String(row.optionB ?? row.b ?? "").trim(),
          String(row.optionC ?? row.c ?? "").trim(),
          String(row.optionD ?? row.d ?? "").trim(),
        ];
        
    const rawOptions = {
      A: rawOptionsArray[0] ?? "",
      B: rawOptionsArray[1] ?? "",
      C: rawOptionsArray[2] ?? "",
      D: rawOptionsArray[3] ?? "",
    };
    const { options: normOptions, conflict, conflictReason } = normalizeOptions(rawOptions);

    const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
      _clientId: clientId,
      rowIndex: idx + 1,
      questionNumber,
      year,
      subject: String(row.subject ?? "").trim(),
      text: cleanText,
      rawText,
      options: [
        { key: "A", text: normOptions.A },
        { key: "B", text: normOptions.B },
        { key: "C", text: normOptions.C },
        { key: "D", text: normOptions.D },
      ],
      answer: toAnswerOption(row.answer ?? row.correctAnswer),
    };

      if (isInstructionRow(base)) {
        contextRowCount++;
        continue;
      }

      let { status, statusReason } = detectStatus(base);
      if (conflict && status === "valid") {
        status = "warning";
        statusReason = statusReason ? `${statusReason} | ${conflictReason}` : conflictReason;
      }
      questions.push({ ...base, status, statusReason });
  }

  const withDuplicates = detectDuplicates(questions);
  const summary = buildSummary(withDuplicates, contextRowCount);
  return { questions: withDuplicates, summary };
}

// ── Shared ─────────────────────────────────────────────────────────────────

function buildSummary(questions: ParsedQuestion[], contextRowCount: number = 0): ParseSummary {
  const years = [
    ...new Set(questions.map((q) => q.year).filter(Boolean) as number[]),
  ].sort((a, b) => a - b);

  return {
    totalRows: questions.length + contextRowCount,
    totalQuestions: questions.length,
    years,
    validCount: questions.filter((q) => q.status === "valid").length,
    warningCount: questions.filter((q) => q.status === "warning").length,
    errorCount: questions.filter((q) => q.status === "error").length,
    duplicateCount: questions.filter((q) => q.status === "duplicate").length,
    contextRowCount,
  };
}

export async function parseFile(
  file: File,
  format: "xlsx" | "json"
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary }> {
  if (format === "xlsx") return parseXlsx(file);
  return parseJson(file);
}
