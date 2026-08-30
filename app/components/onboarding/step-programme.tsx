import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/store/onboarding-store";
import { PROGRAMMES, SUBJECT_RECOMMENDATIONS, COMPULSORY_SUBJECT } from "@/constants/onboarding";
import type { Programme } from "@/types/onboarding";

interface StepProgrammeProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepProgramme({ onNext, onBack }: StepProgrammeProps) {
  const { preferredName, intendedProgramme, setIntendedProgramme, setSubjects } = useOnboardingStore();
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(intendedProgramme?.id || "");

  const handleContinue = () => {
    if (!selectedProgrammeId) return;
    
    const programme = PROGRAMMES.find(p => p.id === selectedProgrammeId);
    if (programme) {
      setIntendedProgramme(programme);
      
      // Auto-populate recommended subjects
      const recommended = SUBJECT_RECOMMENDATIONS[programme.id] || [];
      // setSubjects handles adding the compulsory subject
      setSubjects([...recommended]);
      
      onNext();
    }
  };

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
          <Select 
            value={selectedProgrammeId} 
            onValueChange={(val) => setSelectedProgrammeId(val || "")}
          >
            <SelectTrigger className="w-full h-12 text-base">
              <SelectValue placeholder="Select a programme..." />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMMES.map((prog) => (
                <SelectItem key={prog.id} value={prog.id}>
                  {prog.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            disabled={!selectedProgrammeId}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
