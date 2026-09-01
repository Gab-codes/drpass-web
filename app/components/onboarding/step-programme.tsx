import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useOnboardingStore } from "@/store/onboarding-store";
import {
  PROGRAMME_NAMES,
  getProgrammeById,
  getProgrammeByName,
  getRecommendedSubjectIds,
} from "@/data/programmes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

type SelectionMode = "programme" | "manual";

interface StepProgrammeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepProgramme({ onNext, onBack }: StepProgrammeProps) {
  const {
    preferredName,
    intendedProgramme,
    setIntendedProgramme,
    setSubjects,
  } = useOnboardingStore();
  const [selectedId, setSelectedId] = useState<string>(
    intendedProgramme?.id || "",
  );
  const [mode, setMode] = useState<SelectionMode>("programme");
  const [search, setSearch] = useState("");

  const selectedProgramme = getProgrammeById(selectedId) || null;
  const isManual = mode === "manual";

  const handleProgrammeChange = (name: string | null) => {
    if (!name) {
      setSelectedId("");
      return;
    }
    const programme = getProgrammeByName(name);
    if (programme) {
      setSelectedId(programme.id);
    }
  };

  const handleEnterManualMode = () => {
    setSelectedId("");
    setMode("manual");
  };

  const handleExitManualMode = () => {
    setSelectedId("");
    setSearch("");
    setMode("programme");
  };

  const handleContinue = () => {
    if (isManual) {
      // Manual mode: student picks their own subjects in Step 3.
      setIntendedProgramme(null);
      setSubjects([]);
      onNext();
      return;
    }

    if (!selectedProgramme) return;

    setIntendedProgramme(selectedProgramme);

    // Auto-populate recommended subjects (dataset names mapped to subject IDs)
    const recommended = getRecommendedSubjectIds(selectedProgramme);
    // setSubjects handles adding the compulsory subject
    setSubjects([...recommended]);

    onNext();
  };

  return (
    <StepProgrammeView
      preferredName={preferredName}
      isManual={isManual}
      search={search}
      selectedProgramme={selectedProgramme}
      onSearchChange={setSearch}
      onProgrammeChange={handleProgrammeChange}
      onEnterManualMode={handleEnterManualMode}
      onExitManualMode={handleExitManualMode}
      onContinue={handleContinue}
      onBack={onBack}
    />
  );
}

interface StepProgrammeViewProps {
  preferredName: string | null;
  isManual: boolean;
  search: string;
  selectedProgramme: { id: string; name: string } | null;
  onSearchChange: (value: string) => void;
  onProgrammeChange: (name: string | null) => void;
  onEnterManualMode: () => void;
  onExitManualMode: () => void;
  onContinue: () => void;
  onBack: () => void;
}

function StepProgrammeView({
  preferredName,
  isManual,
  search,
  selectedProgramme,
  onSearchChange,
  onProgrammeChange,
  onEnterManualMode,
  onExitManualMode,
  onContinue,
  onBack,
}: StepProgrammeViewProps) {
  const reducedMotion = useReducedMotion();
  const viewTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" as const };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Nice to meet you, {preferredName}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          What are you hoping to study? This helps me set up your study plan.
        </p>
      </div>

      <div className="space-y-6 pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {isManual ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={viewTransition}
              className="space-y-2"
            >
              <p className="text-base font-medium text-foreground">
                I&apos;ll choose my UTME subjects myself.
              </p>
              <p className="text-sm text-muted-foreground">
                You can select the subjects you want to practice in the next
                step.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={onExitManualMode}
              >
                Change programme
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="programme"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={viewTransition}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-foreground">
                Intended Programme
              </label>
              <Combobox
                items={PROGRAMME_NAMES}
                limit={30}
                value={selectedProgramme?.name || null}
                onValueChange={onProgrammeChange}
                inputValue={search}
                onInputValueChange={onSearchChange}
              >
                <ComboboxInput
                  placeholder="Search programmes..."
                  showTrigger
                  showClear
                  className="h-12 rounded-xl text-base"
                />
                <ComboboxContent className="w-(--anchor-width)">
                  <ComboboxList>
                    {(name: string) => (
                      <ComboboxItem
                        key={name}
                        value={name}
                        className="min-h-11 text-base"
                      >
                        {name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxEmpty className="block py-3 text-left">
                    <div className="space-y-2 px-4">
                      <p className="text-sm text-muted-foreground">
                        No programmes matched &ldquo;{search}&rdquo;.
                      </p>
                      <div className="rounded-xl border border-border bg-muted/50 p-4">
                        <p className="text-sm font-medium text-foreground">
                          Can&apos;t find your programme?
                        </p>
                        <button
                          type="button"
                          className="mt-1 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                          onClick={onEnterManualMode}
                        >
                          Choose your UTME subjects yourself.
                        </button>
                      </div>
                    </div>
                  </ComboboxEmpty>
                </ComboboxContent>
              </Combobox>

              {selectedProgramme && (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => onProgrammeChange(null)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  Clear selection
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-12"
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1 h-12"
            disabled={!isManual && !selectedProgramme}
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
