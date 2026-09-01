import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useOnboardingStore } from "@/store/onboarding-store";
import { UTME_SUBJECTS, COMPULSORY_SUBJECT } from "@/constants/onboarding";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon } from "@hugeicons/core-free-icons";

interface StepSubjectsProps {
  onBack: () => void;
}

export function StepSubjects({ onBack }: StepSubjectsProps) {
  const navigate = useNavigate();
  const { intendedProgramme, subjects, setSubjects, completeOnboarding } =
    useOnboardingStore();
  // Manual path (no programme, only the compulsory subject pre-selected)
  // opens straight into editing; the programme path shows recommended subjects.
  const [isEditing, setIsEditing] = useState(
    subjects.length <= 1 && !intendedProgramme,
  );
  const [errorMsg, setErrorMsg] = useState("");

  const compulsorySubject = UTME_SUBJECTS.find(
    (s) => s.id === COMPULSORY_SUBJECT,
  )!;
  const availableOptions = UTME_SUBJECTS.filter(
    (s) => s.id !== COMPULSORY_SUBJECT,
  );

  // The first slot is always english, next 3 are the remaining selections
  const selectedOptionalSubjects = subjects.filter(
    (s) => s !== COMPULSORY_SUBJECT,
  );
  // Pad with empty strings if less than 3 are selected
  const editableSlots = [
    selectedOptionalSubjects[0] || "",
    selectedOptionalSubjects[1] || "",
    selectedOptionalSubjects[2] || "",
  ];

  const handleSubjectChange = (index: number, newSubjectId: string) => {
    const newSlots = [...editableSlots];
    newSlots[index] = newSubjectId;

    // Check for duplicates
    const selectedSoFar = newSlots.filter(Boolean);
    const uniqueSelected = new Set(selectedSoFar);

    if (selectedSoFar.length !== uniqueSelected.size) {
      setErrorMsg("You cannot select the same subject twice.");
      return;
    }

    setErrorMsg("");
    setSubjects([COMPULSORY_SUBJECT, ...selectedSoFar]);
  };

  const handleComplete = () => {
    if (subjects.length !== 4) {
      setErrorMsg(
        "Please select exactly 3 subjects in addition to Use of English.",
      );
      return;
    }

    completeOnboarding();
    navigate("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Your UTME Subjects
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {intendedProgramme
            ? `Based on your choice of ${intendedProgramme.name}, I've picked the subjects you'll likely need.`
            : "You're choosing your subjects yourself. Pick the three you'll sit for in UTME."}
        </p>
      </div>

      {errorMsg && (
        <Alert variant="destructive" className="py-2 px-3 text-sm">
          {errorMsg}
        </Alert>
      )}

      <div className="space-y-4">
        {/* Compulsory Subject */}
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/40 text-muted-foreground">
          <HugeiconsIcon icon={LockKeyIcon} className="size-5 shrink-0" />
          <span className="font-medium">{compulsorySubject.name}</span>
          <span className="ml-auto text-xs font-semibold uppercase tracking-wider">
            Required
          </span>
        </div>

        {/* Optional Subjects */}
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {editableSlots.map((subjectId, i) => {
                const subject = UTME_SUBJECTS.find((s) => s.id === subjectId);
                return (
                  <div
                    key={`view-${i}`}
                    className="p-4 rounded-xl border bg-card text-card-foreground"
                  >
                    <span className="font-medium">
                      {subject?.name || "No subject selected"}
                    </span>
                  </div>
                );
              })}

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => setIsEditing(true)}
                >
                  Edit subjects
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1 h-12"
                  disabled={subjects.length !== 4}
                  onClick={handleComplete}
                >
                  Looks right
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {editableSlots.map((subjectId, i) => (
                <div key={`edit-${i}`} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Subject {i + 1}
                  </label>
                  <Select
                    value={subjectId}
                    onValueChange={(val) => handleSubjectChange(i, val || "")}
                  >
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.map((sub) => (
                        <SelectItem
                          key={sub.id}
                          value={sub.name}
                          disabled={
                            editableSlots.includes(sub.id) &&
                            editableSlots[i] !== sub.id
                          }
                        >
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => {
                    setErrorMsg("");
                    setIsEditing(false);
                  }}
                >
                  Done Editing
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isEditing && (
        <div className="pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Back to previous step
          </Button>
        </div>
      )}
    </motion.div>
  );
}
