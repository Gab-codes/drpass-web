import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useOnboardingStore } from "@/store/onboarding-store";
import { PROGRAMMES, getRecommendedSubjectIds } from "@/data/programmes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

const MANUAL_SELECTION = "__manual__";

interface StepProgrammeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepProgramme({ onNext, onBack }: StepProgrammeProps) {
  const { preferredName, intendedProgramme, setIntendedProgramme, setSubjects } = useOnboardingStore();
  const [selectedId, setSelectedId] = useState<string>(intendedProgramme?.id || "");
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const selectedProgramme = PROGRAMMES.find((p) => p.id === selectedId) || null;
  const isManual = selectedId === MANUAL_SELECTION;

  const handleSelect = (value: string) => {
    setSelectedId(value);
    setComboboxOpen(false);
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
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 text-left text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50">
              <span className={triggerLabel ? "" : "text-muted-foreground"}>
                {triggerLabel || "Search programmes..."}
              </span>
              <HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[var(--anchor-width)] min-w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search programmes..." />
                <CommandList>
                  <CommandEmpty>No programmes matched your search.</CommandEmpty>
                  {PROGRAMMES.map((prog) => (
                    <CommandItem
                      key={prog.id}
                      value={prog.name}
                      onSelect={() => handleSelect(prog.id)}
                    >
                      {prog.name}
                      {prog.id === selectedId && (
                        <HugeiconsIcon icon={Tick02Icon} className="ml-auto size-4 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

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
