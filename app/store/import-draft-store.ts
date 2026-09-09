/**
 * Import draft store — persists the admin's current import session across
 * page refreshes and hot-reloads using Zustand's persist middleware.
 *
 * Only explicit user actions trigger save (Save Draft button).
 * Restoration is also explicit (Restore Draft banner).
 *
 * Draft lifecycle:
 *   Save Draft   → persists current preview state
 *   Restore Draft → loads draft and reconstructs preview
 *   Discard Draft → clears persistence and removes banner
 *   Successful submit → clears draft
 *   Failed submit  → draft preserved (state never touched on error)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ParsedQuestion, ParseSummary } from "@/types/import-types";

/** Bump this whenever the draft schema changes in a breaking way. */
export const IMPORT_DRAFT_VERSION = 1;

export interface ImportDraftState {
  /** Opaque schema version. null means no draft saved. */
  version: number | null;
  /** ISO timestamp of when Save Draft was last clicked */
  savedAt: string | null;
  /** Source selected by the admin at the time of saving */
  importSource: string | null;
  /** Snapshot of the question list */
  questions: ParsedQuestion[];
  /** Snapshot of the parse summary */
  summary: ParseSummary | null;

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Persist the current preview state as a named draft.
   * Called only by the explicit "Save Draft" button.
   */
  saveDraft: (params: {
    importSource: string | null;
    questions: ParsedQuestion[];
    summary: ParseSummary | null;
  }) => void;

  /**
   * Return true when a valid, version-compatible draft is stored.
   */
  hasDraft: () => boolean;

  /**
   * Clear the stored draft. Called by:
   *   - "Discard Draft" button
   *   - Successful import submission
   *   - "Discard & Start New" in the new-upload guard
   */
  clearDraft: () => void;
}

const EMPTY_STATE: Pick<ImportDraftState, 'version' | 'savedAt' | 'importSource' | 'questions' | 'summary'> = {
  version: null,
  savedAt: null,
  importSource: null,
  questions: [],
  summary: null,
};

export const useImportDraftStore = create<ImportDraftState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      saveDraft: ({ importSource, questions, summary }) =>
        set({
          version: IMPORT_DRAFT_VERSION,
          savedAt: new Date().toISOString(),
          importSource,
          questions,
          summary,
        }),

      hasDraft: () => {
        const { version } = get();
        return version === IMPORT_DRAFT_VERSION;
      },

      clearDraft: () => set({ ...EMPTY_STATE }),
    }),
    {
      name: "drpass:import:draft",
      // Only persist the data fields — not the action functions
      partialize: (state) => ({
        version: state.version,
        savedAt: state.savedAt,
        importSource: state.importSource,
        questions: state.questions,
        summary: state.summary,
      }),
      /**
       * On rehydrate: if the stored version doesn't match the current schema,
       * discard the draft entirely so the admin is never shown stale/broken data.
       */
      merge: (persisted, current) => {
        const p = persisted as Partial<ImportDraftState>;
        if (p.version !== IMPORT_DRAFT_VERSION) {
          // Incompatible draft — return current state (effectively discards stored draft)
          return current;
        }
        return { ...current, ...p };
      },
    },
  ),
);
