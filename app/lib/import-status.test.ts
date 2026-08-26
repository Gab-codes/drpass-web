import { describe, expect } from "vitest";
import { statusLabel, statusBadgeClass } from "./import-status";
import type { QuestionStatus } from "@/types/import-types";

describe("statusLabel", () => {
  test.each<[QuestionStatus, string]>([
    ["valid", "Valid"],
    ["warning", "Warning"],
    ["error", "Error"],
    ["duplicate", "Possible Duplicate"],
  ])("returns %s for %s", (status, expected) => {
    expect(statusLabel(status)).toBe(expected);
  });
});

describe("statusBadgeClass", () => {
  test("returns base classes plus status-specific classes", () => {
    const result = statusBadgeClass("valid");
    expect(result).toContain("inline-flex");
    expect(result).toContain("rounded-full");
    expect(result).toContain("bg-green-100");
    expect(result).toContain("text-green-700");
  });

  test("appends extra classes when provided", () => {
    const result = statusBadgeClass("error", "mt-2");
    expect(result).toContain("mt-2");
  });
});
