import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
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
import {
  buildSubmitOnboardingRequest,
  getSubjects,
  onboardingKeys,
  submitOnboardingApi,
} from "@/api/onboarding";
import { getApiErrorMessage } from "@/lib/api-error";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon } from "@hugeicons/core-free-icons";

interface StepSubjectsProps {
  onBack: () => void;
}

export function StepSubjects({ onBack }: StepSubjectsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    preferredName,
    intendedProgramme,
    subjects,
    setSubjects,
    completeOnboarding,
  } = useOnboardingStore();

  // Manual path (no programme, only the compulsory subject pre-selected)
  // opens straight into editing.
  const [isEditing, setIsEditing] = useState(
    subjects.length <= 1 && !intendedProgramme,
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Canonical subject catalogue, used to resolve the local draft's subject
  // slugs to backend subject IDs at submission time.
  const { data: apiSubjects = [] } = useQuery({
    queryKey: onboardingKeys.subjects(),
    queryFn: getSubjects,
  });

  // Single final submission. On failure the draft stays intact so the student
  // can simply retry; only a successful response marks onboarding complete.
  const submitMutation = useMutation({
    mutationFn: submitOnboardingApi,
    onSuccess: () => {
      completeOnboarding();
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.state() });
      navigate("/dashboard");
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        // Session expired — re-authenticate instead of showing a retry loop.
        navigate("/login", { replace: true });
        return;
      }
      setErrorMsg(
        getApiErrorMessage(
          error,
          "We couldn't save your onboarding. Please try again.",
        ),
      );
    },
  });

  const subjectById = new Map(
    UTME_SUBJECTS.map((subject) => [subject.id, subject]),
  );

  const compulsorySubject = subjectById.get(COMPULSORY_SUBJECT)!;

  const availableOptions = UTME_SUBJECTS.filter(
    (subject) => subject.id !== COMPULSORY_SUBJECT,
  );

  // The first slot is always Use of English.
  // The next 3 slots are the student's optional subject selections.
  const selectedOptionalSubjects = subjects.filter(
    (subjectId) => subjectId !== COMPULSORY_SUBJECT,
  );

  // Pad with empty strings if fewer than 3 optional subjects are selected.
  const editableSlots = [
    selectedOptionalSubjects[0] || "",
    selectedOptionalSubjects[1] || "",
    selectedOptionalSubjects[2] || "",
  ];

  const handleSubjectChange = (index: number, newSubjectId: string) => {
    const newSlots = [...editableSlots];
    newSlots[index] = newSubjectId;

    // Check for duplicates.
    const selectedSoFar = newSlots.filter(Boolean);
    const uniqueSelected = new Set(selectedSoFar);

    if (selectedSoFar.length !== uniqueSelected.size) {
      setErrorMsg("You cannot select the same subject twice.");
      return;
    }

    setErrorMsg("");

    // Store IDs, never subject names.
    setSubjects([COMPULSORY_SUBJECT, ...selectedSoFar]);
  };

  const handleComplete = () => {
    if (subjects.length !== 4) {
      setErrorMsg(
        "Please select exactly 3 subjects in addition to Use of English.",
      );
      return;
    }

    if (!preferredName) {
      setErrorMsg(
        "We couldn't save your onboarding. Please try again.",
      );
      return;
    }

    // Map the local draft to the canonical API payload. Slugs that cannot be
    // resolved to a backend subject block the submission — nothing is dropped.
    const request = buildSubmitOnboardingRequest({
      preferredName,
      programme: intendedProgramme,
      subjectSlugs: subjects,
      apiSubjects,
    });

    if (request.unresolved.length > 0 || request.subjectIds.length !== 4) {
      setErrorMsg(
        "Some of your subjects aren't available right now. Please edit your subjects and try again.",
      );
      return;
    }

    setErrorMsg("");
    const { unresolved: _unresolved, ...payload } = request;
    submitMutation.mutate(payload);
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
        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4 text-muted-foreground">
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
              {editableSlots.map((subjectId, index) => {
                const subject = subjectById.get(subjectId);

                return (
                  <div
                    key={`view-${index}`}
                    className="rounded-xl border bg-card p-4 text-card-foreground"
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
                  className="h-12 flex-1"
                  onClick={() => setIsEditing(true)}
                >
                  Edit subjects
                </Button>

                <Button
                  type="button"
                  size="lg"
                  className="h-12 flex-1"
                  disabled={subjects.length !== 4 || submitMutation.isPending}
                  onClick={handleComplete}
                >
                  {submitMutation.isPending ? "Saving..." : "Looks right"}
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
              {editableSlots.map((subjectId, index) => {
                const selectedSubject = subjectById.get(subjectId);

                return (
                  <div key={`edit-${index}`} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Subject {index + 1}
                    </label>

                    <Select
                      value={subjectId}
                      onValueChange={(value) =>
                        handleSubjectChange(index, value || "")
                      }
                    >
                      <SelectTrigger className="h-12 w-full text-base">
                        <SelectValue placeholder="Select a subject...">
                          {selectedSubject?.name}
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        {availableOptions.map((subject) => (
                          <SelectItem
                            key={subject.id}
                            value={subject.id}
                            disabled={
                              editableSlots.includes(subject.id) &&
                              editableSlots[index] !== subject.id
                            }
                          >
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="h-12 flex-1"
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
