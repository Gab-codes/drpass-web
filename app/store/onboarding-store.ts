import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Programme } from "@/types/onboarding";
import { COMPULSORY_SUBJECT } from "@/constants/onboarding";

interface OnboardingState {
  preferredName: string | null;
  intendedProgramme: Programme | null;
  subjects: string[]; // array of subject IDs
  onboardingCompleted: boolean;

  setPreferredName: (name: string) => void;
  setIntendedProgramme: (programme: Programme) => void;
  setSubjects: (subjects: string[]) => void;
  addSubject: (subjectId: string) => void;
  removeSubject: (subjectId: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      preferredName: null,
      intendedProgramme: null,
      subjects: [COMPULSORY_SUBJECT],
      onboardingCompleted: false,

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
      
      completeOnboarding: () => set({ onboardingCompleted: true }),
      
      resetOnboarding: () => set({
        preferredName: null,
        intendedProgramme: null,
        subjects: [COMPULSORY_SUBJECT],
        onboardingCompleted: false,
      }),
    }),
    {
      name: "drpass-onboarding-storage",
    }
  )
);
