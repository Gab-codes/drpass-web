// test-metadata.ts – Unit tests for extractSheetMetadata
// Run with:  npx tsx test-metadata.ts

import { extractSheetMetadata } from "./app/lib/import-parser";

// ── Tiny assertion harness ────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(
  label: string,
  actual: { year: number | null; subject: string | null },
  expected: { year: number | null; subject: string | null },
) {
  const yearOk = actual.year === expected.year;
  const subjectOk = actual.subject === expected.subject;
  if (yearOk && subjectOk) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    if (!yearOk)
      console.error(
        `       year:    expected ${expected.year}, got ${actual.year}`,
      );
    if (!subjectOk)
      console.error(
        `       subject: expected ${JSON.stringify(expected.subject)}, got ${JSON.stringify(actual.subject)}`,
      );
    failed++;
  }
}

// ── Sheet name: standard year + subject combos ────────────────────────────────

console.log(
  "\n── Sheet name extraction ─────────────────────────────────────────────────\n",
);

assert("CHEMISTRY (1) 2004", extractSheetMetadata("CHEMISTRY (1) 2004"), {
  year: 2004,
  subject: "CHEMISTRY",
});

assert("CHEMISTRY (2) 2004", extractSheetMetadata("CHEMISTRY (2) 2004"), {
  year: 2004,
  subject: "CHEMISTRY",
});

assert(
  "CHEMISTRY - Copy 2004",
  extractSheetMetadata("CHEMISTRY - Copy 2004"),
  { year: 2004, subject: "CHEMISTRY" },
);

assert("Biology (1) 2012", extractSheetMetadata("Biology (1) 2012"), {
  year: 2012,
  subject: "Biology",
});

assert("Use of English 2018", extractSheetMetadata("Use of English 2018"), {
  year: 2018,
  subject: "Use of English",
});

assert(
  "Use of English - 2018",
  extractSheetMetadata("Use of English - 2018"),
  { year: 2018, subject: "Use of English" },
);

assert("Mathematics_2020", extractSheetMetadata("Mathematics_2020"), {
  year: 2020,
  subject: "Mathematics",
});

assert("CHEMISTRY (1) 2023", extractSheetMetadata("CHEMISTRY (1) 2023"), {
  year: 2023,
  subject: "CHEMISTRY",
});

// ── Subject extraction without a year ─────────────────────────────────────────

console.log(
  "\n── Subject without year ──────────────────────────────────────────────────\n",
);

assert("Mathematics (no year)", extractSheetMetadata("Mathematics"), {
  year: null,
  subject: "Mathematics",
});

assert("Use of English (no year)", extractSheetMetadata("Use of English"), {
  year: null,
  subject: "Use of English",
});

assert("CHEMISTRY (no year)", extractSheetMetadata("CHEMISTRY"), {
  year: null,
  subject: "CHEMISTRY",
});

// ── Generic/auto-generated sheet names rejected ───────────────────────────────

console.log(
  "\n── Generic sheet names rejected ──────────────────────────────────────────\n",
);

assert("Sheet1", extractSheetMetadata("Sheet1"), {
  year: null,
  subject: null,
});

assert("Sheet 1", extractSheetMetadata("Sheet 1"), {
  year: null,
  subject: null,
});

assert("Sheet2", extractSheetMetadata("Sheet2"), {
  year: null,
  subject: null,
});

assert("Sheet", extractSheetMetadata("Sheet"), {
  year: null,
  subject: null,
});

assert("Worksheet1", extractSheetMetadata("Worksheet1"), {
  year: null,
  subject: null,
});

assert("Worksheet 1", extractSheetMetadata("Worksheet 1"), {
  year: null,
  subject: null,
});

// ── Filename fallback ─────────────────────────────────────────────────────────

console.log(
  "\n── Filename fallback ─────────────────────────────────────────────────────\n",
);

assert(
  "Sheet1 + CHEMISTRY.xlsx -> subject from filename",
  extractSheetMetadata("Sheet1", "CHEMISTRY.xlsx"),
  { year: null, subject: "CHEMISTRY" },
);

assert(
  "Sheet1 + biology.xlsx -> preserves original casing",
  extractSheetMetadata("Sheet1", "biology.xlsx"),
  { year: null, subject: "biology" },
);

assert(
  "Chemistry 2004.xlsx -> year from filename stem",
  extractSheetMetadata("Sheet1", "Chemistry 2004.xlsx"),
  { year: 2004, subject: "Chemistry" },
);

assert(
  "Sheet year + filename subject (year from sheet wins)",
  extractSheetMetadata("(1) 2018", "CHEMISTRY.xlsx"),
  { year: 2018, subject: "CHEMISTRY" },
);

assert(
  "Sheet subject takes precedence over filename subject",
  extractSheetMetadata("Biology 2018", "CHEMISTRY.xlsx"),
  { year: 2018, subject: "Biology" },
);

assert(
  "No filenameHint -> null subject for generic sheet",
  extractSheetMetadata("Sheet1"),
  { year: null, subject: null },
);

// ── Edge cases ────────────────────────────────────────────────────────────────

console.log(
  "\n── Edge cases ────────────────────────────────────────────────────────────\n",
);

assert(
  "(1) alone -> null subject, no year",
  extractSheetMetadata("(1)"),
  { year: null, subject: null },
);

assert(
  "Copy alone -> null subject",
  extractSheetMetadata("Copy"),
  { year: null, subject: null },
);

assert(
  "CHEMISTRY Copy 2004",
  extractSheetMetadata("CHEMISTRY Copy 2004"),
  { year: 2004, subject: "CHEMISTRY" },
);

assert(
  "Mathematics Copy 1 2020",
  extractSheetMetadata("Mathematics Copy 1 2020"),
  { year: 2020, subject: "Mathematics" },
);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(
  "\n─────────────────────────────────────────────────────────────────────────\n",
);
console.log(`  ${passed} passed, ${failed} failed\n`);

if (failed > 0) process.exit(1);
