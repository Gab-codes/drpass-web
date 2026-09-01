import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
import { Label } from "../ui/label";

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
  const [search, setSearch] = useState("");

  const selectedProgramme = getProgrammeById(selectedId) || null;

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

  // The student has explicitly chosen the manual path — clear the programme
  // and any recommended subjects, then advance directly to subject editing.
  const handleManualSelection = () => {
    setSelectedId("");
    setIntendedProgramme(null);
    setSubjects([]);
    onNext();
  };

  const handleContinue = () => {
    if (!selectedProgramme) return;

    setIntendedProgramme(selectedProgramme);

    // Auto-populate recommended subjects (dataset names mapped to subject IDs)
    const recommended = getRecommendedSubjectIds(selectedProgramme);
    // setSubjects handles adding the compulsory subject
    setSubjects([...recommended]);

    onNext();
  };

  const reducedMotion = useReducedMotion();

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
          <Label className="text-sm font-medium text-foreground">
            Intended Programme
          </Label>
          <Combobox
            items={PROGRAMME_NAMES}
            limit={30}
            value={selectedProgramme?.name || null}
            onValueChange={handleProgrammeChange}
            inputValue={search}
            onInputValueChange={setSearch}
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
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.2, ease: "easeOut" }
                  }
                  className="space-y-2 px-4"
                >
                  <p className="text-sm text-muted-foreground">
                    No programmes matched &ldquo;{search}&rdquo;.
                  </p>
                  <div className="rounded-xl border border-border bg-muted/50 p-4">
                    <p className="text-sm font-medium text-foreground">
                      Can&apos;t find your programme?
                    </p>
                    <button
                      type="button"
                      className="mt-1 cursor-pointer inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={handleManualSelection}
                    >
                      Choose your UTME subjects yourself.
                    </button>
                  </div>
                </motion.div>
              </ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
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
            disabled={!selectedProgramme}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
