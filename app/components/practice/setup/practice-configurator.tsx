import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { PRACTICE_LIMITS } from "@/data/mock-exam";
import {
  DEFAULT_QUESTIONS_PER_SUBJECT,
  buildPracticeConfiguration,
  createSubjectQuestionConfigs,
  getPracticeSummary,
  toggleSubjectSelection,
  updateSubjectCount,
  validatePracticeSetup,
} from "@/lib/practice-setup";
import type { ApiSubject } from "@/types/onboarding";
import type { PracticeConfiguration, TimeMode } from "@/types/practice";
import { PracticeConfirmation } from "./practice-confirmation";
import { PracticeSummary } from "./practice-summary";
import { PracticeTimeSelector } from "./practice-time-selector";
import { SubjectQuestionSelector } from "./subject-question-selector";

interface PracticeConfiguratorProps {
  /** The student's enrolled subjects — the only subjects that can be practised. */
  subjects: ApiSubject[];
  /** Called with the finished configuration when the student starts. */
  onStart: (configuration: PracticeConfiguration) => void;
}

/**
 * Owns the practice setup state (question counts and time mode) and composes the
 * setup UI. Everything shown to the student is derived from that state, so the
 * summary, the confirmation and the started configuration can never disagree.
 */
export function PracticeConfigurator({
  subjects,
  onStart,
}: PracticeConfiguratorProps) {
  const [subjectConfigs, setSubjectConfigs] = useState(() =>
    createSubjectQuestionConfigs(subjects),
  );
  const [timeMode, setTimeMode] = useState<TimeMode>("default");
  const [customTimeMinutes, setCustomTimeMinutes] = useState(
    DEFAULT_QUESTIONS_PER_SUBJECT,
  );

  const summary = useMemo(
    () => getPracticeSummary(subjectConfigs, timeMode, customTimeMinutes),
    [subjectConfigs, timeMode, customTimeMinutes],
  );
  const validationError = validatePracticeSetup(summary);
  const canStart = validationError === null;

  const handleStart = () => {
    if (!canStart) return;
    onStart(buildPracticeConfiguration(summary));
  };

  const startTrigger = (
    <Button size="lg" className="w-full" disabled={!canStart}>
      Review &amp; Start
    </Button>
  );

  return (
    <>
      <div className="grid items-start gap-8 pb-28 md:grid-cols-[minmax(0,1fr)_20rem] md:pb-0">
        <div className="space-y-10">
          <SubjectQuestionSelector
            subjects={subjectConfigs}
            maxSelected={PRACTICE_LIMITS.maxSubjects}
            onToggle={(code) =>
              setSubjectConfigs((previous) =>
                toggleSubjectSelection(previous, code),
              )
            }
            onCountChange={(code, count) =>
              setSubjectConfigs((previous) =>
                updateSubjectCount(previous, code, count),
              )
            }
          />

          <PracticeTimeSelector
            timeMode={summary.timeMode}
            totalTimeMinutes={summary.totalTimeMinutes}
            suggestedTimeMinutes={summary.suggestedTimeMinutes}
            onTimeChange={(minutes) => {
              setTimeMode("custom");
              setCustomTimeMinutes(minutes);
            }}
            onResetToSuggested={() => setTimeMode("default")}
          />
        </div>

        <PracticeSummary
          variant="panel"
          summary={summary}
          error={validationError}
          action={
            <PracticeConfirmation
              variant="dialog"
              trigger={startTrigger}
              summary={summary}
              onStart={handleStart}
            />
          }
        />
      </div>

      <PracticeSummary
        variant="bar"
        summary={summary}
        error={validationError}
        action={
          <PracticeConfirmation
            variant="drawer"
            trigger={startTrigger}
            summary={summary}
            onStart={handleStart}
          />
        }
      />
    </>
  );
}