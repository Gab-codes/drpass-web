import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@/hooks/use-user";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { StepWelcome } from "@/components/onboarding/step-welcome";
import { StepProgramme } from "@/components/onboarding/step-programme";
import { StepSubjects } from "@/components/onboarding/step-subjects";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Authentication/loading/redirect is owned by AuthenticatedLayout;
  // the page only reads the resolved user from the shared cache.
  const { user } = useUser();

  // Backend (/auth/me via useUser) is authoritative for whether onboarding
  // is already completed — e.g. re-login on a fresh device. Completed users
  // never re-enter onboarding; the local draft is never overwritten.
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const defaultName = user?.name || "Student";

  return (
    <OnboardingShell currentStep={step} totalSteps={totalSteps}>
      {step === 1 && (
        <StepWelcome onNext={nextStep} defaultName={defaultName} />
      )}
      {step === 2 && <StepProgramme onNext={nextStep} onBack={prevStep} />}
      {step === 3 && <StepSubjects onBack={prevStep} />}
    </OnboardingShell>
  );
}
