import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Programme } from "@/types/onboarding";
import { COMPULSORY_SUBJECT } from "@/constants/onboarding";

interface OnboardingDraftState {
  preferredName: string | null;
  intendedProgramme: Programme | null;
  subjects: string[]; // array of subject slugs

  setPreferredName: (name: string) => void;
  setIntendedProgramme: (programme: Programme | null) => void;
  setSubjects: (subjects: string[]) => void;
  addSubject: (subjectId: string) => void;
  removeSubject: (subjectId: string) => void;
  /** Clears the draft. Called only after the PATCH succeeds — the backend, not this store, owns completion. */
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      preferredName: null,
      intendedProgramme: null,
      subjects: [COMPULSORY_SUBJECT],

      setPreferredName: (name) => set({ preferredName: name }),
      
      setIntendedProgramme: (programme) =>
        set({ intendedProgramme: programme }),
      
      setSubjects: (subjects) => {
        // Ensure compulsory subject is always included
        const finalSubjects = subjects.includes(COMPULSORY_SUBJECT) 
          ? subjects 
          : [COMPULSORY_SUBJECT, ...subjects];
        
        set({ subjects: finalSubjects });
      },
      
      addSubject: (subjectId) => set((state) => {
        if (state.subjects.includes(subjectId)) return state;
        return { subjects: [...state.subjects, subjectId] };
      }),
      
      removeSubject: (subjectId) => set((state) => {
        if (subjectId === COMPULSORY_SUBJECT) return state; // Cannot remove compulsory
        return { subjects: state.subjects.filter(s => s !== subjectId) };
      }),
      
      completeOnboarding: () =>
        set({
          // The backend is the source of truth for onboarding completion;
          // clearing the draft here only discards the temporary local input.
          preferredName: null,
          intendedProgramme: null,
          subjects: [COMPULSORY_SUBJECT],
        }),

      resetOnboarding: () => set({
        preferredName: null,
        intendedProgramme: null,
        subjects: [COMPULSORY_SUBJECT],
      }),
    }),
    {
      name: "drpass-onboarding-storage",
      // Only the incomplete draft is persisted; no account-state flags.
      partialize: (state) => ({
        preferredName: state.preferredName,
        intendedProgramme: state.intendedProgramme,
        subjects: state.subjects,
      }),
    }
  )
);
