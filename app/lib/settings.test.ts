import { describe, expect, it } from "vitest";

import { getProgrammeById, PROGRAMMES } from "@/data/programmes";
import {
  getSubjectSlots,
  isSettingsDirty,
  toSettingsFormValues,
  validatePreferredName,
  validateSubjectSelection,
  withProgramme,
  withSubjectSlot,
  type SettingsFormValues,
  type SettingsSource,
} from "@/lib/settings";

/** Resolves a dataset programme or fails loudly if the fixture moves. */
function programme(id: string) {
  const found = getProgrammeById(id);
  if (!found) throw new Error(`Missing programme fixture: ${id}`);
  return found;
}

/** The student's persisted state: programme selected, four subjects. */
const persisted: SettingsSource = {
  preferredName: "Gaby",
  programme: { id: "medicine-and-surgery" },
  subjects: [{ code: "ENG" }, { code: "BIO" }, { code: "CHM" }, { code: "PHY" }],
};

/** A student who picked their subjects manually (no programme). */
const manual: SettingsFormValues = toSettingsFormValues({
  preferredName: "Gaby",
  programme: null,
  subjects: [{ code: "ENG" }, { code: "MTH" }, { code: "GEO" }, { code: "GOV" }],
});

describe("toSettingsFormValues", () => {
  it("hydrates the preferred name, programme and subjects from persisted state", () => {
    expect(toSettingsFormValues(persisted)).toEqual({
      preferredName: "Gaby",
      programmeId: "medicine-and-surgery",
      subjectSlugs: ["english", "biology", "chemistry", "physics"],
    });
  });

  it("keeps Use of English first even when it is not persisted first", () => {
    const values = toSettingsFormValues({
      ...persisted,
      subjects: [{ code: "PHY" }, { code: "ENG" }, { code: "BIO" }],
    });

    expect(values.subjectSlugs).toEqual(["english", "physics", "biology"]);
  });

  it("drops subject codes that have no frontend slug instead of guessing", () => {
    const values = toSettingsFormValues({
      preferredName: "Gaby",
      programme: null,
      subjects: [{ code: "ENG" }, { code: "UNKNOWN" }],
    });

    expect(values.subjectSlugs).toEqual(["english"]);
    expect(getSubjectSlots(values.subjectSlugs)).toEqual(["", "", ""]);
  });

  it("hydrates an empty profile before onboarding", () => {
    expect(
      toSettingsFormValues({ preferredName: null, programme: null, subjects: [] }),
    ).toEqual({
      preferredName: "",
      programmeId: "",
      subjectSlugs: ["english"],
    });
  });
});

describe("getSubjectSlots", () => {
  it("always returns the three optional slots, padded with empty strings", () => {
    expect(getSubjectSlots(["english", "physics"])).toEqual(["physics", "", ""]);
    expect(getSubjectSlots(["english"])).toEqual(["", "", ""]);
  });
});

describe("withSubjectSlot", () => {
  it("replaces one slot and keeps Use of English first", () => {
    const next = withSubjectSlot(manual, 2, "history");

    expect(next.subjectSlugs).toEqual(["english", "math", "geography", "history"]);
  });

  it("compacts the combination when an empty slot is filled", () => {
    const next = withSubjectSlot(
      { preferredName: "Gaby", programmeId: "", subjectSlugs: ["english"] },
      0,
      "physics",
    );

    expect(next.subjectSlugs).toEqual(["english", "physics"]);
  });
});

describe("withProgramme", () => {
  it("replaces the subjects with the programme's recommended combination", () => {
    const next = withProgramme(manual, programme("medicine-and-surgery"));

    expect(next.programmeId).toBe("medicine-and-surgery");
    expect(next.subjectSlugs).toEqual([
      "english",
      "biology",
      "chemistry",
      "physics",
    ]);
  });

  it("maps dataset subject names through the existing alias map", () => {
    const next = withProgramme(manual, programme("religious-studies"));

    expect(next.subjectSlugs).toEqual([
      "english",
      "crk",
      "government",
      "history",
    ]);
  });

  it("keeps the student's subjects when the programme is cleared", () => {
    const next = withProgramme(toSettingsFormValues(persisted), null);

    expect(next.programmeId).toBe("");
    expect(next.subjectSlugs).toEqual([
      "english",
      "biology",
      "chemistry",
      "physics",
    ]);
  });

  it("always yields exactly four distinct subjects for every programme", () => {
    for (const candidate of PROGRAMMES) {
      const next = withProgramme(manual, candidate);

      expect(next.subjectSlugs).toHaveLength(4);
      expect(next.subjectSlugs[0]).toBe("english");
      expect(new Set(next.subjectSlugs).size).toBe(4);
    }
  });
});

describe("validatePreferredName", () => {
  it("accepts a trimmed name of 1 to 50 characters", () => {
    expect(validatePreferredName("Gaby")).toBeNull();
    expect(validatePreferredName("  Gaby  ")).toBeNull();
    expect(validatePreferredName("x".repeat(50))).toBeNull();
    expect(
      validatePreferredName(`  ${"x".repeat(50)}  `),
    ).toBeNull();
  });

  it("rejects a blank name", () => {
    expect(validatePreferredName("")).toBe("Enter a preferred name.");
    expect(validatePreferredName("   ")).toBe("Enter a preferred name.");
  });

  it("rejects a name longer than 50 characters after trimming", () => {
    expect(validatePreferredName("x".repeat(51))).toBe(
      "Preferred name must be 50 characters or fewer.",
    );
  });
});

describe("validateSubjectSelection", () => {
  it("accepts Use of English plus three distinct subjects", () => {
    expect(
      validateSubjectSelection(["english", "math", "physics", "chemistry"]),
    ).toBeNull();
  });

  it("requires Use of English", () => {
    expect(
      validateSubjectSelection(["math", "physics", "chemistry", "biology"]),
    ).toBe(
      "Use of English is a compulsory UTME subject and must be included.",
    );
  });

  it("requires all three optional slots to be filled", () => {
    expect(validateSubjectSelection(["english", "math"])).toBe(
      "Select 3 subjects in addition to Use of English.",
    );
    expect(
      validateSubjectSelection(["english", "math", "physics"]),
    ).toBe("Select 3 subjects in addition to Use of English.");
  });

  it("rejects duplicate subjects", () => {
    expect(
      validateSubjectSelection(["english", "math", "math", "physics"]),
    ).toBe("You cannot select the same subject twice.");
  });
});

describe("isSettingsDirty", () => {
  const baseline = toSettingsFormValues(persisted);

  it("reports no change for identical values, including name whitespace", () => {
    expect(isSettingsDirty(baseline, baseline)).toBe(false);
    expect(
      isSettingsDirty({ ...baseline, preferredName: "  Gaby  " }, baseline),
    ).toBe(false);
  });

  it("reports a change to the preferred name", () => {
    expect(
      isSettingsDirty({ ...baseline, preferredName: "Gabriel" }, baseline),
    ).toBe(true);
  });

  it("reports a change to the programme", () => {
    expect(
      isSettingsDirty({ ...baseline, programmeId: "manual" }, baseline),
    ).toBe(true);
  });

  it("reports a change to the subject combination", () => {
    expect(
      isSettingsDirty(
        { ...baseline, subjectSlugs: ["english", "biology", "chemistry", "math"] },
        baseline,
      ),
    ).toBe(true);
  });
});
