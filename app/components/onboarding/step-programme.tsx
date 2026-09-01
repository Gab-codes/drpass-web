import { useState } from "react";
import { motion } from "motion/react";
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
import { PROGRAMMES, getRecommendedSubjectIds } from "@/data/programmes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

const MANUAL_SELECTION = "__manual__";

interface StepProgrammeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepProgramme({ onNext, onBack }: StepProgrammeProps) {
  const { preferredName, intendedProgramme, setIntendedProgramme, setSubjects } = useOnboardingStore();
  const [selectedId, setSelectedId] = useState<string>(intendedProgramme?.id || "");

  const selectedProgramme = PROGRAMMES.find((p) => p.id === selectedId) || null;
  const isManual = selectedId === MANUAL_SELECTION;

  const handleSelect = (value: string) => {
    setSelectedId(value);
  };

  const handleProgrammeChange = (name: string | null) => {
    if (!name) {
      setSelectedId("");
      return;
    }
    const programme = PROGRAMMES.find((p) => p.name === name);
    if (programme) {
      setSelectedId(programme.id);
    }
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

  const triggerLabel = isManual
    ? "I'll choose my subjects myself"
    : selectedProgramme?.name || "";

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
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Intended Programme
          </label>
          <Combobox
            items={PROGRAMMES.map((p) => p.name)}
            value={isManual ? null : selectedProgramme?.name || null}
            onValueChange={handleProgrammeChange}
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
                  <ComboboxItem key={name} value={name} className="min-h-11 text-base">
                    {name}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>No programmes matched your search.</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>

          {triggerLabel && (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => handleSelect("")}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
              Clear selection
            </button>
          )}

          <p className="text-sm text-muted-foreground">
            Can&apos;t find your programme?{" "}
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-sm font-medium underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                isManual ? "text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
              onClick={() => handleSelect(MANUAL_SELECTION)}
            >
              Choose your UTME subjects yourself.
            </button>
          </p>
        </div>

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
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
