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

  it("clears the temporary draft on completion", () => {
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
    // The backend — not this store — owns onboarding completion; the store
    // is draft-only and must not carry any account-state flag.
    expect(state).not.toHaveProperty("onboardingCompleted");
    expect(state.preferredName).toBeNull();
    expect(state.intendedProgramme).toBeNull();
    expect(state.subjects).toEqual([COMPULSORY_SUBJECT]);
  });

  it("resets the draft", () => {
    useOnboardingStore.getState().setPreferredName("Gabriel");
    useOnboardingStore.getState().resetOnboarding();

    const state = useOnboardingStore.getState();
    expect(state.preferredName).toBeNull();
    expect(state.subjects).toEqual([COMPULSORY_SUBJECT]);
  });
});