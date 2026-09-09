import * as XLSX from "xlsx";
import type {
  ParsedQuestion,
  ParseSummary,
  AnswerOption,
} from "../types/import-types";

export function normaliseHeader(h: string): string {
  const normalized = String(h)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const aliases: Record<string, string> = {
    year: "year",
    subject: "subject",

    question: "questionText",
    "question text": "questionText",
    questions: "questionText",
    text: "questionText",

    "option a": "optionA",
    a: "optionA",

    "option b": "optionB",
    b: "optionB",

    "option c": "optionC",
    c: "optionC",

    "option d": "optionD",
    d: "optionD",

    answer: "correctAnswer",
    "correct answer": "correctAnswer",
    "correct option": "correctAnswer",
    "right answer": "correctAnswer",
    correct: "correctAnswer",
  };

  return aliases[normalized] ?? normalized;
}

const IMAGE_REFERENCE_RE =
  /\b(diagram|figure|table|graph|chart|illustration|image)\b[^.?!]{0,40}\b(above|below)\b|\b(above|below)\b[^.?!]{0,40}\b(diagram|figure|table|graph|chart|illustration|image)\b/i;

function detectPossibleImage(text: string): boolean {
  if (!text) return false;
  return IMAGE_REFERENCE_RE.test(text);
}

export function toAnswerOption(v: unknown): AnswerOption | null {
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

// ── Spreadsheet metadata helpers ────────────────────────────────────────────

/**
 * Auto-generated sheet names that carry no subject information.
 * Matches: Sheet1, Sheet 1, Sheet, Worksheet1, Worksheet 1, Worksheet
 */
const GENERIC_SHEET_RE = /^(sheet\s*\d*|worksheet\s*\d*)$/i;

/**
 * Remove common spreadsheet naming artifacts from a raw string fragment and
 * return a cleaned subject candidate, or null if the result is unusable.
 *
 * Stripped artifacts:
 *   - Index suffixes:  (1)  (2)  [1]  [2]
 *   - Copy suffixes:   Copy  - Copy  Copy 1  (case-insensitive)
 *   - Underscores:     replaced with spaces so they act as word separators
 *   - Leading/trailing separators: spaces, hyphens
 */
export function cleanToSubject(raw: string): string | null {
  const cleaned = raw
    .replace(/\(\d+\)|\[\d+\]/g, " ") // (1), [2] → space
    .replace(/[-_\s]*\bcopy\s*\d*\b/gi, " ") // Copy, - Copy, Copy 1 → space
    .replace(/_+/g, " ") // underscores → spaces
    .replace(/^[-\s]+|[-\s]+$/g, "") // trim leading/trailing - and spaces
    .replace(/\s{2,}/g, " ") // collapse runs of whitespace
    .trim();

  if (cleaned.length < 2) return null;
  if (GENERIC_SHEET_RE.test(cleaned)) return null;
  // Must start with a letter; allows letters, digits, spaces, hyphens,
  // apostrophes, ampersands, and periods (e.g. "Use of English", "Agric. Sci")
  if (!/^[a-zA-Z][a-zA-Z0-9\s\-'&.]*$/.test(cleaned)) return null;

  return cleaned;
}

/**
 * Extract a 4-digit year (19xx or 20xx) and a cleaned subject from any raw
 * string (sheet name or filename stem). The two are extracted independently:
 * a missing year does not prevent subject extraction, and vice-versa.
 */
export function extractYearAndSubject(raw: string): {
  year: number | null;
  subject: string | null;
} {
  // Normalise underscores to spaces before year matching so that \b word
  // boundaries work correctly in names like "Mathematics_2020" (where "_" is
  // treated as a word character by the regex engine, breaking \b before "2020").
  const normalised = raw.replace(/_+/g, " ");

  const yearMatch = normalised.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

  // Remove the year token before attempting subject extraction
  const withoutYear = yearMatch
    ? normalised.replace(yearMatch[0], "")
    : normalised;
  const subject = cleanToSubject(withoutYear);

  return { year, subject };
}

/**
 * Extract year and subject metadata from a worksheet name, with an optional
 * workbook filename as a fallback source for any piece not found in the sheet
 * name.
 *
 * Precedence for each field:
 *   1. Value derived from the sheet name
 *   2. Value derived from the workbook filename stem (filenameHint)
 *   3. null
 */
export function extractSheetMetadata(
  sheetName: string,
  filenameHint?: string,
): { year: number | null; subject: string | null } {
  const fromSheet = extractYearAndSubject(sheetName);

  // If the sheet name provided both pieces, return early — no fallback needed
  if (fromSheet.year !== null && fromSheet.subject !== null) {
    return fromSheet;
  }

  if (!filenameHint) return fromSheet;

  // Strip the file extension (e.g. "CHEMISTRY.xlsx" → "CHEMISTRY",
  // "Chemistry 2004.xlsx" → "Chemistry 2004") and apply the same extraction
  const stem = filenameHint.replace(/\.[^.]+$/, "");
  const fromFile = extractYearAndSubject(stem);

  return {
    year: fromSheet.year ?? fromFile.year,
    subject: fromSheet.subject ?? fromFile.subject,
  };
}

function parseJsonOptions(
  row: Record<string, unknown>,
): Record<AnswerOption, string> {
  const options = row.options;

  if (Array.isArray(options)) {
    return {
      A: extractOptionText(options[0]),
      B: extractOptionText(options[1]),
      C: extractOptionText(options[2]),
      D: extractOptionText(options[3]),
    };
  }

  if (options && typeof options === "object") {
    const optionObject = options as Record<string, unknown>;

    return {
      A: String(optionObject.A ?? optionObject.a ?? "").trim(),
      B: String(optionObject.B ?? optionObject.b ?? "").trim(),
      C: String(optionObject.C ?? optionObject.c ?? "").trim(),
      D: String(optionObject.D ?? optionObject.d ?? "").trim(),
    };
  }

  return {
    A: String(row.optionA ?? row.a ?? "").trim(),
    B: String(row.optionB ?? row.b ?? "").trim(),
    C: String(row.optionC ?? row.c ?? "").trim(),
    D: String(row.optionD ?? row.d ?? "").trim(),
  };
}

export function extractOptionText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (value && typeof value === "object") {
    const option = value as Record<string, unknown>;
    return String(option.text ?? option.value ?? "").trim();
  }

  return "";
}

export function detectHeaderRow(
  rows: unknown[][],
): { headerRowIndex: number; columnMap: Record<number, string> } | null {
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

      if (
        [
          "questionText",
          "optionA",
          "optionB",
          "optionC",
          "optionD",
          "correctAnswer",
          "year",
          "subject",
        ].includes(semantic)
      ) {
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

export function extractQuestionNumber(text: string) {
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

export function isInstructionRow(
  q: Omit<ParsedQuestion, "status" | "statusReason">,
): boolean {
  if (!q.text || q.text.trim() === "") return false;
  const nonEmptyOptions = q.options.filter((o) => o.text.trim() !== "");
  return !q.correctAnswer && nonEmptyOptions.length === 0;
}

export function detectStatus(q: Omit<ParsedQuestion, "status" | "statusReason">): {
  status: ParsedQuestion["status"];
  statusReason?: string;
} {
  if (!q.text || q.text.trim() === "") {
    return { status: "error", statusReason: "Missing question text" };
  }
  if (q.correctAnswer === null || q.correctAnswer === undefined || q.correctAnswer === "") {
    return {
      status: "error",
      statusReason: "Missing or invalid correct answer",
    };
  }
  if (!q.year) {
    return { status: "error", statusReason: "Missing year" };
  }
  if (!q.subject) {
    return { status: "error", statusReason: "Missing subject" };
  }
  if (q.type === 'UNKNOWN') {
    return {
      status: "warning",
      statusReason: "Question type could not be determined. Please resolve.",
    };
  }
  
  const nonEmptyOptions = q.options.filter((o) => o.text.trim() !== "");
  if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
    if (nonEmptyOptions.length < 2) {
      return { status: "error", statusReason: "Fewer than 2 answer options" };
    }
    if (nonEmptyOptions.length < 4) {
      return {
        status: "warning",
        statusReason: `Only ${nonEmptyOptions.length} of 4 options provided`,
      };
    }
  }

  if (q.hasImage) {
    return {
      status: "warning",
      statusReason:
        "Question text references a diagram/figure/image — please verify and attach",
    };
  }
  return { status: "valid" };
}

const KNOWN_SOURCES = ['JAMB', 'WAEC', 'NECO', 'GCE'] as const;
type KnownSource = typeof KNOWN_SOURCES[number];

/**
 * Detect a source from a single text string (sheet name or filename stem).
 * Returns one source only if exactly one source keyword is found; null otherwise.
 */
export function detectSourceFromText(text: string): KnownSource | null {
  const upper = text.toUpperCase();
  const found = KNOWN_SOURCES.filter((s) => upper.includes(s));
  // Return source only if unambiguous (exactly one match)
  return found.length === 1 ? found[0] : null;
}

/**
 * Detect source from an entire XLSX workbook using deterministic precedence:
 *   1. Workbook built-in properties (Title, Subject, Keywords, Description)
 *   2. All sheet names combined — returns null if multiple sources found
 *   3. Filename stem
 *
 * Returns null if:
 *   - No recognisable source keyword found
 *   - More than one different source found in any single tier
 *
 * Never defaults to JAMB or any other source.
 */
export function detectSourceFromWorkbook(
  wb: import('xlsx').WorkBook,
  filename: string,
): KnownSource | null {
  // Tier 1: workbook built-in properties (if the spreadsheet author filled them in)
  const props = wb.Props as any;
  if (props) {
    const propsText = [
      props.Title ?? '',
      props.Subject ?? '',
      props.Keywords ?? '',
      props.Description ?? '',
    ].join(' ');
    const fromProps = detectSourceFromText(propsText);
    if (fromProps !== null) return fromProps;
  }

  // Tier 2: all sheet names combined
  const sheetText = (wb.SheetNames ?? []).join(' ');
  const fromSheets = detectSourceFromText(sheetText);
  if (fromSheets !== null) return fromSheets;

  // Tier 3: filename stem (strip extension)
  const stem = filename.replace(/\.[^.]+$/, '');
  return detectSourceFromText(stem);
}

/**
 * @deprecated Use detectSourceFromWorkbook for full workbook inspection.
 * Kept for the per-sheet path in the existing structured parser.
 */
export function detectSource(sheetName: string, filenameHint?: string): KnownSource | null {
  // Try sheet name first, then fall back to filename
  const fromSheet = detectSourceFromText(sheetName);
  if (fromSheet !== null) return fromSheet;
  if (filenameHint) {
    const stem = filenameHint.replace(/\.[^.]+$/, '');
    return detectSourceFromText(stem);
  }
  return null;
}

export function detectQuestionType(options: { key: string; text: string }[], correctAnswer: any): string {
  const validOptions = options.filter(o => o.text.trim() !== '');
  
  if (Array.isArray(correctAnswer) && correctAnswer.length > 1) {
    return 'MULTIPLE_CHOICE';
  }
  
  if (validOptions.length === 0) {
    if (typeof correctAnswer === 'number' || !isNaN(Number(correctAnswer))) {
      return 'NUMERIC';
    }
    if (typeof correctAnswer === 'string' && correctAnswer.trim() !== '') {
      return 'SHORT_ANSWER';
    }
  }
  
  if (validOptions.length >= 3) {
    return 'SINGLE_CHOICE';
  }
  
  if (validOptions.length === 2) {
    const keys = validOptions.map(o => o.key.toUpperCase());
    const texts = validOptions.map(o => o.text.toUpperCase());
    if ((keys.includes('T') && keys.includes('F')) || (texts.includes('TRUE') && texts.includes('FALSE'))) {
      return 'TRUE_FALSE';
    }
    // Two options that are not clearly True/False are ambiguous — require admin resolution
    return 'UNKNOWN';
  }
  
  return 'UNKNOWN';
}


export function detectDuplicates(questions: ParsedQuestion[]): ParsedQuestion[] {
  const seen = new Map<string, string>();

  return questions.map((q) => {
    const normalisedText = (q.text ?? "").toLowerCase().trim();
    if (!normalisedText) return q;

    const key = `${q.year ?? "unknown"}|${normalisedText}`;

    if (seen.has(key)) {
      return {
        ...q,
        status: "duplicate" as const,
        statusReason:
          "Question text matches another question from the same year in this file",
        possibleDuplicateOf: seen.get(key)!,
      };
    }
    seen.set(key, q._clientId);
    return q;
  });
}

export function revalidateQuestions(
  questions: ParsedQuestion[],
): ParsedQuestion[] {
  const revalidated = questions.map((q) => {
    const {
      _clientId,
      rowIndex,
      questionNumber,
      year,
      subject,
      text,
      rawText,
      options,
      correctAnswer,
      source,
      type,
      difficulty,
      explanation,
      hasImage,
      image,
      isEdited,
    } = q;

    const base: Omit<
      ParsedQuestion,
      "status" | "statusReason" | "possibleDuplicateOf" | "duplicateResolution"
    > = {
      _clientId,
      rowIndex,
      questionNumber,
      year,
      subject,
      text,
      rawText,
      options,
      correctAnswer,
      source,
      type,
      difficulty,
      explanation,
      hasImage,
      image,
      isEdited,
    };

    const { status, statusReason } = detectStatus(base);

    return {
      ...q,
      status,
      statusReason,
      possibleDuplicateOf: undefined,
    };
  });

  const activeQuestions = revalidated.filter(
    (q) => q.duplicateResolution !== "remove",
  );
  const withDuplicates = detectDuplicates(activeQuestions);
  const duplicateById = new Map(
    withDuplicates.map((question) => [question._clientId, question]),
  );

  return revalidated.map((question) => {
    const duplicate = duplicateById.get(question._clientId);
    if (!duplicate) return question;
    return {
      ...question,
      ...duplicate,
    };
  });
}

export function normalizeOptions(rawOptions: Record<AnswerOption, string>) {
  const BOUNDARY_REGEX = /(?:^|\s+)(?:Option\s+)?([A-D])\s*(?:\.|\)|-|:)\s*/gi;

  type Piece = { letter: AnswerOption; text: string; sourceCol: AnswerOption };
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
          sourceCol: col,
        });
      }

      const nextIndex =
        i + 1 < matches.length ? matches[i + 1].index! : text.length;
      allPieces.push({
        letter: matchLetter,
        text: text.substring(match.index! + match[0].length, nextIndex).trim(),
        sourceCol: col,
      });
    }
  }

  const piecesByLetter: Record<AnswerOption, Piece[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };
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
    const finalOptions: Record<AnswerOption, string> = {
      A: "",
      B: "",
      C: "",
      D: "",
    };
    for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
      if (piecesByLetter[letter].length === 1) {
        finalOptions[letter] = piecesByLetter[letter][0].text;
      }
    }
    return { options: finalOptions, conflict: false };
  }

  const safePiecesByLetter: Record<AnswerOption, Piece[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };
  for (const col of ["A", "B", "C", "D"] as AnswerOption[]) {
    const text = rawOptions[col];
    if (!text) continue;

    const match = text.match(/^(?:Option\s+)?([A-D])\s*(?:\.|\)|-|:)\s*(.*)/is);
    if (match) {
      const matchLetter = match[1].toUpperCase() as AnswerOption;
      safePiecesByLetter[matchLetter].push({
        letter: matchLetter,
        text: match[2].trim(),
        sourceCol: col,
      });
    } else {
      safePiecesByLetter[col].push({
        letter: col,
        text: text.trim(),
        sourceCol: col,
      });
    }
  }

  let hasSafeCollision = false;
  for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
    const nonEmpty = safePiecesByLetter[letter].filter((p) => p.text !== "");
    if (nonEmpty.length > 1) {
      hasSafeCollision = true;
      break;
    }
  }

  if (!hasSafeCollision) {
    const finalOptions: Record<AnswerOption, string> = {
      A: "",
      B: "",
      C: "",
      D: "",
    };
    for (const letter of ["A", "B", "C", "D"] as AnswerOption[]) {
      const nonEmpty = safePiecesByLetter[letter].filter((p) => p.text !== "");
      if (nonEmpty.length === 1) {
        finalOptions[letter] = nonEmpty[0].text;
      }
    }
    return { options: finalOptions, conflict: false };
  }

  const fallbackOptions: Record<AnswerOption, string> = {
    A: "",
    B: "",
    C: "",
    D: "",
  };
  for (const col of ["A", "B", "C", "D"] as AnswerOption[]) {
    const raw = rawOptions[col];
    const match = raw.match(/^(?:Option\s+)?([A-D])\s*(?:\.|\)|-|:)\s*(.*)/is);
    if (match && match[1].toUpperCase() === col) {
      fallbackOptions[col] = match[2].trim();
    } else {
      fallbackOptions[col] = raw.trim();
    }
  }

  return {
    options: fallbackOptions,
    conflict: true,
    conflictReason: "Conflicting option labels detected. Please review.",
  };
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

export async function parseXlsx(
  file: File,
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary; detectedSource: string | null }> {
  const buffer = await file.arrayBuffer();

  // SheetJS 0.18.x: `type: "array"` requires a Uint8Array, not a bare ArrayBuffer.
  // `file.arrayBuffer()` returns a raw ArrayBuffer, so it must be wrapped.
  // Do NOT pass `bookProps: true` — in 0.18.x that flag makes XLSX.read return
  // only { Props, Custprops } instead of a full workbook, causing SheetNames to
  // be undefined. A normal read already includes wb.Props.
  const wb = XLSX.read(new Uint8Array(buffer));

  if (!Array.isArray(wb.SheetNames) || wb.SheetNames.length === 0) {
    throw new Error(
      "Unable to read this XLSX file. The file may be corrupted or in an unsupported format.",
    );
  }

  // Workbook-level source detection — runs once before iterating sheets
  const detectedSource = detectSourceFromWorkbook(wb, file.name);

  const allQuestions: ParsedQuestion[] = [];
  let rowGlobal = 0;
  let contextRowCount = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];

    // First pass to detect header
    const arrayRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    });
    if (arrayRows.length === 0) continue;

    const detected = detectHeaderRow(arrayRows);

    if (detected) {
      // Strategy 1: Structured column parser
      const { headerRowIndex, columnMap } = detected;
      const sheetMeta = extractSheetMetadata(sheetName, file.name);

      for (let i = headerRowIndex + 1; i < arrayRows.length; i++) {
        const row = arrayRows[i];
        if (!Array.isArray(row)) continue;

        const record: Record<string, unknown> = {};
        for (const [colIdxStr, semantic] of Object.entries(columnMap)) {
          const colIdx = parseInt(colIdxStr, 10);
          record[semantic] = row[colIdx];
        }

        if (Object.values(record).every((v) => v === "" || v == null)) continue;

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

        let rowSubject = record.subject
          ? String(record.subject).trim()
          : sheetMeta.subject;

        const rawText = String(record.questionText ?? "").trim();
        const { questionNumber, cleanText } = extractQuestionNumber(rawText);

        const rawOptions = {
          A: String(record.optionA ?? "").trim(),
          B: String(record.optionB ?? "").trim(),
          C: String(record.optionC ?? "").trim(),
          D: String(record.optionD ?? "").trim(),
        };

        const {
          options: normOptions,
          conflict,
          conflictReason,
        } = normalizeOptions(rawOptions);

        const optionsArr = [
          { key: "A", text: normOptions.A },
          { key: "B", text: normOptions.B },
          { key: "C", text: normOptions.C },
          { key: "D", text: normOptions.D },
        ];
        const rawAns = String(record.correctAnswer ?? record.answer ?? "");
        
        const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
          _clientId: clientId,
          rowIndex: i + 1,
          questionNumber,
          year: rowYear,
          subject: rowSubject ?? "",
          text: cleanText,
          rawText,
          options: optionsArr,
          correctAnswer: rawAns,
          source: detectSource(sheetName, file.name),
          type: detectQuestionType(optionsArr, rawAns),
          difficulty: record.difficulty ? String(record.difficulty) : null,
          explanation: record.explanation ? String(record.explanation) : null,
          hasImage: detectPossibleImage(cleanText),
          image: null,
        };

        if (isInstructionRow(base)) {
          contextRowCount++;
          continue;
        }

        let { status, statusReason } = detectStatus(base);

        if (conflict && status === "valid") {
          status = "warning";
          statusReason = statusReason
            ? `${statusReason} | ${conflictReason}`
            : conflictReason;
        }

        if (yearConflict && status === "valid") {
          status = "warning";
          statusReason = statusReason
            ? `${statusReason} | Year conflict: Sheet is ${sheetMeta.year} but row says ${record.year}. Used row year.`
            : `Year conflict: Sheet is ${sheetMeta.year} but row says ${record.year}. Used row year.`;
        }

        allQuestions.push({ ...base, status, statusReason });
      }
    } else {
      // Strategy 2: Legacy Parser (fallback)
      const objectRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
      });

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

        const {
          options: normOptions,
          conflict,
          conflictReason,
        } = normalizeOptions(rawOptions);

        const optionsArr = [
          { key: "A", text: normOptions.A },
          { key: "B", text: normOptions.B },
          { key: "C", text: normOptions.C },
          { key: "D", text: normOptions.D },
        ];
        const rawAns = String(row.correctAnswer ?? row.answer ?? "");

        const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
          _clientId: clientId,
          rowIndex: rowGlobal,
          questionNumber,
          year,
          subject: String(row.subject ?? "").trim(),
          text: cleanText,
          rawText,
          options: optionsArr,
          correctAnswer: rawAns,
          source: detectSource(sheetName, file.name),
          type: detectQuestionType(optionsArr, rawAns),
          difficulty: row.difficulty ? String(row.difficulty) : null,
          explanation: row.explanation ? String(row.explanation) : null,
          hasImage: detectPossibleImage(cleanText),
          image: null,
        };

        if (isInstructionRow(base)) {
          contextRowCount++;
          continue;
        }

        let { status, statusReason } = detectStatus(base);
        if (conflict && status === "valid") {
          status = "warning";
          statusReason = statusReason
            ? `${statusReason} | ${conflictReason}`
            : conflictReason;
        }

        allQuestions.push({ ...base, status, statusReason });
      }
    }
  }

  const withDuplicates = detectDuplicates(allQuestions);
  const summary = buildSummary(withDuplicates, contextRowCount);
  return { questions: withDuplicates, summary, detectedSource };
}

// ── JSON ──────────────────────────────────────────────────────────────────────

export async function parseJson(
  file: File,
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary; detectedSource: string | null }> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file. The file could not be parsed.");
  }

  // Source detection for JSON files — filename only
  const stem = file.name.replace(/\.[^.]+$/, "");
  const detectedSource = detectSourceFromText(stem);
  const raw: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { questions?: unknown[] }).questions)
      ? (data as { questions: unknown[] }).questions
      : [];

  if (raw.length === 0) {
    throw new Error(
      "No questions found. Expected an array of question objects.",
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

    const rawOptions = parseJsonOptions(row);

    const {
      options: normOptions,
      conflict,
      conflictReason,
    } = normalizeOptions(rawOptions);

    const optionsArr = [
      { key: "A", text: normOptions.A },
      { key: "B", text: normOptions.B },
      { key: "C", text: normOptions.C },
      { key: "D", text: normOptions.D },
    ];
    const rawAns = String(row.correctAnswer ?? row.answer ?? "");

    const base: Omit<ParsedQuestion, "status" | "statusReason"> = {
      _clientId: clientId,
      rowIndex: idx + 1,
      questionNumber,
      year,
      subject: String(row.subject ?? "").trim(),
      text: cleanText,
      rawText,
      options: optionsArr,
      correctAnswer: rawAns,
      source: detectSource("JSON", file.name),
      type: detectQuestionType(optionsArr, rawAns),
      difficulty: row.difficulty ? String(row.difficulty) : null,
      explanation: row.explanation ? String(row.explanation) : null,
      hasImage: detectPossibleImage(cleanText),
      image: null,
    };

    if (isInstructionRow(base)) {
      contextRowCount++;
      continue;
    }

    let { status, statusReason } = detectStatus(base);
    if (conflict && status === "valid") {
      status = "warning";
      statusReason = statusReason
        ? `${statusReason} | ${conflictReason}`
        : conflictReason;
    }
    questions.push({ ...base, status, statusReason });
  }

  const withDuplicates = detectDuplicates(questions);
  const summary = buildSummary(withDuplicates, contextRowCount);
  return { questions: withDuplicates, summary, detectedSource };
}

// ── Shared ─────────────────────────────────────────────────────────────────

export function buildSummary(
  questions: ParsedQuestion[],
  contextRowCount: number = 0,
): ParseSummary {
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
  format: "xlsx" | "json",
): Promise<{ questions: ParsedQuestion[]; summary: ParseSummary; detectedSource: string | null }> {
  if (format === "xlsx") return parseXlsx(file);
  return parseJson(file);
}
