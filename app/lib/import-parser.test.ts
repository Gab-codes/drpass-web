import {
  normaliseHeader,
  toAnswerOption,
  cleanToSubject,
  extractYearAndSubject,
  extractOptionText,
  isInstructionRow,
  detectStatus,
  detectDuplicates,
  revalidateQuestions,
  normalizeOptions,
  detectHeaderRow,
  buildSummary,
  extractQuestionNumber,
} from "./import-parser";
import type { ParsedQuestion } from "@/types/import-types";

describe("normaliseHeader", () => {
  const cases: [string, string][] = [
    ["Question", "questionText"],
    ["question text", "questionText"],
    ["Questions", "questionText"],
    ["Text", "questionText"],
    ["Option A", "optionA"],
    ["A", "optionA"],
    ["Option B", "optionB"],
    ["B", "optionB"],
    ["Option C", "optionC"],
    ["C", "optionC"],
    ["Option D", "optionD"],
    ["D", "optionD"],
    ["Answer", "correctAnswer"],
    ["Correct Answer", "correctAnswer"],
    ["Correct Option", "correctAnswer"],
    ["Right Answer", "correctAnswer"],
    ["Correct", "correctAnswer"],
    ["Year", "year"],
    ["Subject", "subject"],
    ["Year  ", "year"],
    ["-Year-", "year"],
  ];

  test.each(cases)('normaliseHeader("%s")', (input, expected) => {
    expect(normaliseHeader(input)).toBe(expected);
  });

  test("lowercases and strips non-alphanumeric characters for unknown headers", () => {
    expect(normaliseHeader("Foo Bar!")).toBe("foo bar");
  });
});

describe("toAnswerOption", () => {
  const cases: [unknown, "A" | "B" | "C" | "D" | null][] = [
    ["A", "A"],
    ["B", "B"],
    ["C", "C"],
    ["D", "D"],
    ["a", "A"],
    ["Option A", "A"],
    ["Option B", "B"],
    ["Ans: B", "B"],
    ["Answer: C", "C"],
    ["X", null],
    ["AB", null],
    ["", null],
    [null, null],
    [undefined, null],
  ];

  test.each(cases)("toAnswerOption(%o)", (input, expected) => {
    expect(toAnswerOption(input)).toBe(expected);
  });
});

describe("cleanToSubject", () => {
  const cases: [string, string | null][] = [
    ["Sheet1", null],
    ["Sheet 1", null],
    ["Worksheet", null],
    ["Worksheet1", null],
    ["Copy", null],
    ["- Copy", null],
    ["Copy 1", null],
    ["(1)", null],
    ["[2]", null],
    ["Mathematics_2020", "Mathematics 2020"],
    ["Agric._Sci", "Agric. Sci"],
    ["Use of English", "Use of English"],
    ["", null],
    ["A", null],
    ["-", null],
    ["_", null],
    ["123", null],
  ];

  test.each(cases)('cleanToSubject("%s")', (input, expected) => {
    expect(cleanToSubject(input)).toBe(expected);
  });
});

describe("extractYearAndSubject", () => {
  const cases: [string, { year: number | null; subject: string | null }][] = [
    ["Mathematics_2020", { year: 2020, subject: "Mathematics" }],
    ["Chemistry 2004", { year: 2004, subject: "Chemistry" }],
    ["2020 Biology", { year: 2020, subject: "Biology" }],
    ["NoYear", { year: null, subject: "NoYear" }],
    ["Sheet1", { year: null, subject: null }],
    ["Use of English", { year: null, subject: "Use of English" }],
  ];

  test.each(cases)('extractYearAndSubject("%s")', (input, expected) => {
    expect(extractYearAndSubject(input)).toEqual(expected);
  });
});

describe("extractOptionText", () => {
  test("returns trimmed string for string values", () => {
    expect(extractOptionText("  Hello  ")).toBe("Hello");
  });

  test("returns trimmed string for number values", () => {
    expect(extractOptionText(42)).toBe("42");
  });

  test("returns text property for objects", () => {
    expect(extractOptionText({ text: "Foo" })).toBe("Foo");
  });

  test("returns value property for objects without text", () => {
    expect(extractOptionText({ value: "Bar" })).toBe("Bar");
  });

  test("returns empty string for null", () => {
    expect(extractOptionText(null)).toBe("");
  });

  test("returns empty string for undefined", () => {
    expect(extractOptionText(undefined)).toBe("");
  });

  test("returns empty string for empty object", () => {
    expect(extractOptionText({})).toBe("");
  });
});

describe("isInstructionRow", () => {
  const make = (text = "", answer: "A" | "B" | "C" | "D" | null = null, options: string[] = []): Omit<ParsedQuestion, "status" | "statusReason"> => ({
    _clientId: "q1",
    rowIndex: 1,
    text,
    options: options.map((o, i) => ({ key: ["A", "B", "C", "D"][i] as "A" | "B" | "C" | "D", text: o })),
    answer,
    year: 2020,
    subject: "Math",
    rawText: text,
    hasImage: false,
    image: null,
  });

  test("returns false for empty text", () => {
    expect(isInstructionRow(make(""))).toBe(false);
  });

  test("returns true when no answer and no non-empty options", () => {
    expect(isInstructionRow(make("Some instruction", null, ["", "", "", ""]))).toBe(true);
  });

  test("returns false when valid question row (has options)", () => {
    expect(isInstructionRow(make("What is 2+2?", "A", ["3", "4", "5", "6"]))).toBe(false);
  });

  test("returns false when answer present but no options", () => {
    expect(isInstructionRow(make("Answer only", "A", ["", "", "", ""]))).toBe(false);
  });
});

describe("detectStatus", () => {
  const make = (overrides: Partial<ParsedQuestion> = {}): Omit<ParsedQuestion, "status" | "statusReason"> => ({
    _clientId: "q1",
    rowIndex: 1,
    text: "Valid question",
    options: [
      { key: "A", text: "Opt A" },
      { key: "B", text: "Opt B" },
      { key: "C", text: "Opt C" },
      { key: "D", text: "Opt D" },
    ],
    answer: "A",
    year: 2020,
    subject: "Math",
    rawText: "Valid question",
    hasImage: false,
    image: null,
    ...overrides,
  });

  test("returns valid when all fields present", () => {
    const result = detectStatus(make());
    expect(result.status).toBe("valid");
  });

  test("returns error for missing text", () => {
    const result = detectStatus(make({ text: "" }));
    expect(result.status).toBe("error");
    expect(result.statusReason).toBe("Missing question text");
  });

  test("returns error for missing answer", () => {
    const result = detectStatus(make({ answer: null }));
    expect(result.status).toBe("error");
    expect(result.statusReason).toBe("Missing or invalid correct answer");
  });

  test("returns error for missing year", () => {
    const result = detectStatus(make({ year: null }));
    expect(result.status).toBe("error");
    expect(result.statusReason).toBe("Missing year");
  });

  test("returns error for missing subject", () => {
    const result = detectStatus(make({ subject: "" }));
    expect(result.status).toBe("error");
    expect(result.statusReason).toBe("Missing subject");
  });

  test("returns error for fewer than 2 options", () => {
    const result = detectStatus(make({ options: [{ key: "A", text: "A" }] }));
    expect(result.status).toBe("error");
    expect(result.statusReason).toBe("Fewer than 2 answer options");
  });

  test("returns warning for 2 options", () => {
    const result = detectStatus(make({ options: [{ key: "A", text: "A" }, { key: "B", text: "B" }] }));
    expect(result.status).toBe("warning");
    expect(result.statusReason).toBe("Only 2 of 4 options provided");
  });

  test("returns warning for image reference", () => {
    const result = detectStatus(make({ text: "Refer to figure above the table.", hasImage: true }));
    expect(result.status).toBe("warning");
    expect(result.statusReason).toContain("diagram/figure/image");
  });
});

describe("detectDuplicates", () => {
  const makeQ = (id: string, text: string, year: number | null): ParsedQuestion => ({
    _clientId: id,
    rowIndex: 1,
    text,
    options: [],
    answer: null,
    year,
    subject: "",
    rawText: text,
    hasImage: false,
    image: null,
    status: "valid",
  });

  test("marks later duplicate with same year", () => {
    const q1 = makeQ("q1", "Hello", 2020);
    const q2 = makeQ("q2", "Hello", 2020);
    const result = detectDuplicates([q1, q2]);
    expect(result[0].status).toBe("valid");
    expect(result[1].status).toBe("duplicate");
    expect(result[1].possibleDuplicateOf).toBe("q1");
  });

  test("does not flag different years", () => {
    const q1 = makeQ("q1", "Hello", 2020);
    const q2 = makeQ("q2", "Hello", 2021);
    const result = detectDuplicates([q1, q2]);
    expect(result[0].status).toBe("valid");
    expect(result[1].status).toBe("valid");
  });

  test("skips empty text", () => {
    const q1 = makeQ("q1", "", 2020);
    const q2 = makeQ("q2", "", 2020);
    const result = detectDuplicates([q1, q2]);
    expect(result[0].status).toBe("valid");
    expect(result[1].status).toBe("valid");
  });
});

describe("revalidateQuestions", () => {
  const makeQ = (
    overrides: Partial<ParsedQuestion> = {},
  ): ParsedQuestion => ({
    _clientId: "q1",
    rowIndex: 1,
    text: "Valid question",
    options: [
      { key: "A", text: "Opt A" },
      { key: "B", text: "Opt B" },
      { key: "C", text: "Opt C" },
      { key: "D", text: "Opt D" },
    ],
    answer: "A",
    year: 2020,
    subject: "Math",
    rawText: "Valid question",
    hasImage: false,
    image: null,
    status: "valid",
    ...overrides,
  });

  test("revalidates an edited error question into a valid question", () => {
    const before = makeQ({ answer: null, status: "error", statusReason: "Missing or invalid correct answer" });
    const after = revalidateQuestions([
      { ...before, answer: "A" },
    ]);

    expect(after[0].status).toBe("valid");
    expect(after[0].statusReason).toBeUndefined();

    const summary = buildSummary(after);
    expect(summary.errorCount).toBe(0);
    expect(summary.validCount).toBe(1);
  });

  test("revalidates a warning question after the warning is fixed", () => {
    const before = makeQ({
      options: [
        { key: "A", text: "Opt A" },
        { key: "B", text: "Opt B" },
      ],
      status: "warning",
      statusReason: "Only 2 of 4 options provided",
    });

    const after = revalidateQuestions([
      {
        ...before,
        options: [
          { key: "A", text: "Opt A" },
          { key: "B", text: "Opt B" },
          { key: "C", text: "Opt C" },
          { key: "D", text: "Opt D" },
        ],
      },
    ]);

    expect(after[0].status).toBe("valid");
    expect(after[0].statusReason).toBeUndefined();

    const summary = buildSummary(after);
    expect(summary.warningCount).toBe(0);
    expect(summary.validCount).toBe(1);
  });

  test("keeps the updated validation reason when an edit is still invalid", () => {
    const before = makeQ({ answer: null, status: "error", statusReason: "Missing or invalid correct answer" });
    const after = revalidateQuestions([
      { ...before, answer: "A", year: null },
    ]);

    expect(after[0].status).toBe("error");
    expect(after[0].statusReason).toBe("Missing year");
  });

  test("recalculates duplicate metadata after an edit removes the duplicate", () => {
    const q1 = makeQ({ _clientId: "q1", text: "Question one", year: 2020 });
    const q2 = makeQ({ _clientId: "q2", text: "Question one", year: 2020 });

    const before = revalidateQuestions([q1, q2]);
    expect(before[1].status).toBe("duplicate");
    expect(before[1].possibleDuplicateOf).toBe("q1");

    const after = revalidateQuestions([
      { ...q1, text: "Question one updated" },
      q2,
    ]);

    expect(after[0].status).toBe("valid");
    expect(after[1].status).toBe("valid");
    expect(after[1].possibleDuplicateOf).toBeUndefined();

    const summary = buildSummary(after);
    expect(summary.duplicateCount).toBe(0);
  });

  test("summary metrics are derived from the current question state", () => {
    const q1 = makeQ({ _clientId: "q1", answer: null, status: "error", statusReason: "Missing or invalid correct answer" });
    const q2 = makeQ({
      _clientId: "q2",
      text: "Different warning question",
      options: [
        { key: "A", text: "Opt A" },
        { key: "B", text: "Opt B" },
      ],
      status: "warning",
      statusReason: "Only 2 of 4 options provided",
    });

    const before = buildSummary(revalidateQuestions([q1, q2]));
    expect(before.errorCount).toBe(1);
    expect(before.warningCount).toBe(1);

    const after = buildSummary(
      revalidateQuestions([
        { ...q1, answer: "A" },
        {
          ...q2,
          text: "Different warning question",
          options: [
            { key: "A", text: "Opt A" },
            { key: "B", text: "Opt B" },
            { key: "C", text: "Opt C" },
            { key: "D", text: "Opt D" },
          ],
        },
      ]),
    );
    expect(after.errorCount).toBe(0);
    expect(after.warningCount).toBe(0);
    expect(after.validCount).toBe(2);
  });
});

describe("normalizeOptions", () => {
  test("returns plain text without prefixed labels", () => {
    const result = normalizeOptions({
      A: "First option",
      B: "Second option",
      C: "",
      D: "",
    });
    expect(result.options.A).toBe("First option");
    expect(result.options.B).toBe("Second option");
    expect(result.conflict).toBe(false);
  });

  test("handles prefixed labels", () => {
    const result = normalizeOptions({
      A: "Option A: First option",
      B: "Option B: Second option",
      C: "",
      D: "",
    });
    expect(result.options.A).toBe("First option");
    expect(result.options.B).toBe("Second option");
  });

  test("detects collision and returns conflict", () => {
    const result = normalizeOptions({
      A: "Option A: Foo",
      B: "Option A: Bar",
      C: "",
      D: "",
    });
    expect(result.conflict).toBe(true);
    expect(result.options.A).toBe("Foo");
  });
});

describe("detectHeaderRow", () => {
  test("returns best row with questionText and at least one other", () => {
    const rows = [
      ["Ignored", "Ignore"],
      ["Question", "Option A", "Option B", "Correct Answer"],
      ["Q1", "A", "B", "A"],
    ];
    const result = detectHeaderRow(rows);
    expect(result).not.toBeNull();
    expect(result!.headerRowIndex).toBe(1);
    expect(result!.columnMap).toEqual({
      0: "questionText",
      1: "optionA",
      2: "optionB",
      3: "correctAnswer",
    });
  });

  test("returns null when no header found", () => {
    const rows = [
      ["Foo", "Bar"],
      ["Baz", "Qux"],
    ];
    const result = detectHeaderRow(rows);
    expect(result).toBeNull();
  });

  test("limits scoring to first 20 rows", () => {
    const rows = Array.from({ length: 21 }, (_, i) => i === 19 ? ["Question", "Option A"] : ["X", "Y"]);
    const result = detectHeaderRow(rows);
    expect(result).not.toBeNull();
    expect(result!.headerRowIndex).toBe(19);
  });
});

describe("buildSummary", () => {
  const makeQ = (status: ParsedQuestion["status"]): ParsedQuestion => ({
    _clientId: "q1",
    rowIndex: 1,
    text: "Q",
    options: [],
    answer: null,
    year: 2020,
    subject: "M",
    rawText: "Q",
    hasImage: false,
    image: null,
    status,
  });

  test("returns counts and sorted years", () => {
    const questions = [makeQ("valid"), makeQ("warning"), makeQ("error"), makeQ("duplicate")];
    const summary = buildSummary(questions, 2);
    expect(summary.totalRows).toBe(6);
    expect(summary.totalQuestions).toBe(4);
    expect(summary.years).toEqual([2020]);
    expect(summary.validCount).toBe(1);
    expect(summary.warningCount).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.duplicateCount).toBe(1);
    expect(summary.contextRowCount).toBe(2);
  });
});

describe("extractQuestionNumber", () => {
  test("extracts number with dot prefix", () => {
    expect(extractQuestionNumber("1. What is 2+2?")).toEqual({
      questionNumber: 1,
      cleanText: "What is 2+2?",
    });
  });

  test("extracts number with parenthesis prefix", () => {
    expect(extractQuestionNumber("2) Hello")).toEqual({
      questionNumber: 2,
      cleanText: "Hello",
    });
  });

  test("extracts number with hyphen prefix", () => {
    expect(extractQuestionNumber("3-World")).toEqual({
      questionNumber: 3,
      cleanText: "World",
    });
  });

  test("returns undefined when no prefix", () => {
    const result = extractQuestionNumber("No prefix here");
    expect(result.questionNumber).toBeUndefined();
    expect(result.cleanText).toBe("No prefix here");
  });
});
