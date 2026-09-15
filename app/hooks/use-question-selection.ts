import * as React from "react";

/**
 * Client-side selection model for Topic Classification.
 *
 * Selection is a Set of question ids and is deliberately independent of the
 * currently rendered page: ids selected on one page survive pagination, search
 * and filter changes. Page-scoped helpers take the visible ids as an argument,
 * so this hook never needs to know about pagination.
 */
export interface QuestionSelection {
  selectedIds: Set<string>;
  selectedCount: number;
  /** True when the current selection is the whole eligible result set. */
  allEligibleSelected: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string, checked: boolean) => void;
  togglePage: (pageIds: string[], checked: boolean) => void;
  selectAllEligible: (ids: string[]) => void;
  clear: () => void;
  allOnPageSelected: (pageIds: string[]) => boolean;
  someOnPageSelected: (pageIds: string[]) => boolean;
}

export function useQuestionSelection(): QuestionSelection {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [allEligibleSelected, setAllEligibleSelected] = React.useState(false);

  const toggle = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    // A manual edit means the selection is no longer "all eligible".
    setAllEligibleSelected(false);
  }, []);

  const togglePage = React.useCallback((pageIds: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
    setAllEligibleSelected(false);
  }, []);

  const selectAllEligible = React.useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
    setAllEligibleSelected(true);
  }, []);

  const clear = React.useCallback(() => {
    setSelectedIds(new Set());
    setAllEligibleSelected(false);
  }, []);

  const isSelected = React.useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const allOnPageSelected = React.useCallback(
    (pageIds: string[]) =>
      pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  const someOnPageSelected = React.useCallback(
    (pageIds: string[]) =>
      pageIds.some((id) => selectedIds.has(id)) && !allOnPageSelected(pageIds),
    [selectedIds, allOnPageSelected],
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    allEligibleSelected,
    isSelected,
    toggle,
    togglePage,
    selectAllEligible,
    clear,
    allOnPageSelected,
    someOnPageSelected,
  };
}