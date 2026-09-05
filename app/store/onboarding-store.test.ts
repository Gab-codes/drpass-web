import { beforeEach, describe, expect, it } from "vitest";
import { useOnboardingStore } from "@/store/onboarding-store";
import { COMPULSORY_SUBJECT } from "@/constants/onboarding";

describe("onboarding store", () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding();
  });

  it("keeps the compulsory subject in the draft combination", () => {
    useOnboardingStore.getState().setSubjects(["math", "physics", "chemistry"]);
    expect(useOnboardingStore.getState().subjects).toEqual([
      COMPULSORY_SUBJECT,
      "math",
      "physics",
      "chemistry",
    ]);
  });

  it("marks completion and clears the temporary draft", () => {
    const store = useOnboardingStore.getState();
    store.setPreferredName("Gabriel");
    store.setIntendedProgramme({
      id: "medicine-and-surgery",
      name: "Medicine and Surgery",
      recommendedSubjects: [],
    });
    store.setSubjects(["math", "physics", "chemistry"]);

    useOnboardingStore.getState().completeOnboarding();

    const state = useOnboardingStore.getState();
    expect(state.onboardingCompleted).toBe(true);
    // Backend is the source of truth after submission; the draft is cleared.
    expect(state.preferredName).toBeNull();
    expect(state.intendedProgramme).toBeNull();
    expect(state.subjects).toEqual([COMPULSORY_SUBJECT]);
  });

  it("does not mark onboarding complete on reset", () => {
    useOnboardingStore.getState().completeOnboarding();
    useOnboardingStore.getState().resetOnboarding();

    const state = useOnboardingStore.getState();
    expect(state.onboardingCompleted).toBe(false);
    expect(state.subjects).toEqual([COMPULSORY_SUBJECT]);
  });
});