import { AnimatePresence, motion } from "motion/react";

interface OnboardingShellProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function OnboardingShell({
  currentStep,
  totalSteps,
  children,
}: OnboardingShellProps) {
  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-medium text-lg">
            <div className="size-6 bg-primary rounded-sm flex items-center justify-center" aria-hidden="true" />
            <span>DrPass</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground" aria-live="polite">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Step Content with Animation */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
