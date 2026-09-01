import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { useOnboardingStore } from "@/store/onboarding-store";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { StepWelcome } from "@/components/onboarding/step-welcome";
import { StepProgramme } from "@/components/onboarding/step-programme";
import { StepSubjects } from "@/components/onboarding/step-subjects";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { onboardingCompleted } = useOnboardingStore();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const { data: user, isPending, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    // If onboarding is completed, they shouldn't be here
    if (onboardingCompleted) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboardingCompleted, navigate]);

  useEffect(() => {
    // If user fetch fails (unauthenticated), redirect to login
    if (isError) {
      navigate("/login", { replace: true });
    }
  }, [isError, navigate]);

  if (isPending || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <HugeiconsIcon icon={Loading03Icon} className="animate-spin text-muted-foreground size-8" />
      </div>
    );
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const defaultName = user.name || "Student";

  return (
    <OnboardingShell currentStep={step} totalSteps={totalSteps}>
      {step === 1 && (
        <StepWelcome onNext={nextStep} defaultName={defaultName} />
      )}
      {step === 2 && (
        <StepProgramme onNext={nextStep} onBack={prevStep} />
      )}
      {step === 3 && (
        <StepSubjects onBack={prevStep} />
      )}
    </OnboardingShell>
  );
}
