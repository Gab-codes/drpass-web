import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useQuestionSelection } from "./use-question-selection";

const eligibleIds = (count: number) =>
  Array.from({ length: count }, (_, i) => `q-${i + 1}`);

describe("useQuestionSelection", () => {
  it("adds an id when a question is selected and removes it when unselected", () => {
    const { result } = renderHook(() => useQuestionSelection());
    expect(result.current.selectedCount).toBe(0);

    act(() => result.current.toggle("q-1", true));
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected("q-1")).toBe(true);

    act(() => result.current.toggle("q-1", false));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected("q-1")).toBe(false);
  });

  it("keeps previously selected ids when selecting on another page", () => {
    const { result } = renderHook(() => useQuestionSelection());

    // Page 1
    act(() => result.current.toggle("q-1", true));
    act(() => result.current.toggle("q-2", true));
    // Page 2
    act(() => result.current.toggle("q-3", true));

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected("q-1")).toBe(true);
    expect(result.current.isSelected("q-2")).toBe(true);
    expect(result.current.isSelected("q-3")).toBe(true);
  });

  it("selects and clears every question on the current page", () => {
    const { result } = renderHook(() => useQuestionSelection());

    act(() => result.current.togglePage(["q-1", "q-2"], true));
    expect(result.current.selectedCount).toBe(2);
    expect(result.current.allOnPageSelected(["q-1", "q-2"])).toBe(true);

    act(() => result.current.togglePage(["q-1", "q-2"], false));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("clearing a page leaves ids selected on other pages intact", () => {
    const { result } = renderHook(() => useQuestionSelection());

    act(() => result.current.togglePage(["q-1"], true));
    act(() => result.current.togglePage(["q-2"], true));
    act(() => result.current.togglePage(["q-2"], false));

    expect(result.current.isSelected("q-1")).toBe(true);
    expect(result.current.isSelected("q-2")).toBe(false);
    expect(result.current.selectedCount).toBe(1);
  });

  it("reports partial page selection as indeterminate, not fully selected", () => {
    const { result } = renderHook(() => useQuestionSelection());

    act(() => result.current.toggle("q-1", true));

    expect(result.current.someOnPageSelected(["q-1", "q-2"])).toBe(true);
    expect(result.current.allOnPageSelected(["q-1", "q-2"])).toBe(false);
    // An empty page is never "all selected".
    expect(result.current.allOnPageSelected([])).toBe(false);
  });

  it("selects every eligible question without needing per-page ids", () => {
    const { result } = renderHook(() => useQuestionSelection());

    act(() => result.current.selectAllEligible(eligibleIds(762)));

    expect(result.current.selectedCount).toBe(762);
    expect(result.current.allEligibleSelected).toBe(true);
    expect(result.current.isSelected("q-762")).toBe(true);
  });

  it("drops the all-eligible flag once the selection is edited manually", () => {
    const { result } = renderHook(() => useQuestionSelection());

    act(() => result.current.selectAllEligible(eligibleIds(5)));
    expect(result.current.allEligibleSelected).toBe(true);

    act(() => result.current.toggle("q-1", false));
    expect(result.current.allEligibleSelected).toBe(false);
    expect(result.current.selectedCount).toBe(4);
  });

  it("clears the entire selection", () => {
    const { result } = renderHook(() => useQuestionSelection());

    act(() => result.current.selectAllEligible(eligibleIds(10)));
    act(() => result.current.clear());

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.allEligibleSelected).toBe(false);
  });
});