import { HugeiconsIcon } from "@hugeicons/react";
import { LockKeyIcon } from "@hugeicons/core-free-icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPULSORY_SUBJECT, UTME_SUBJECTS } from "@/constants/onboarding";
import { getSubjectSlots } from "@/lib/settings";

interface SettingsSubjectsProps {
  /** Use of English first, then the optional subjects. */
  subjects: string[];
  onSlotChange: (index: number, slug: string) => void;
}

const COMPULSORY_SUBJECT_NAME =
  UTME_SUBJECTS.find((subject) => subject.id === COMPULSORY_SUBJECT)?.name ??
  "Use of English";

const OPTIONAL_SUBJECTS = UTME_SUBJECTS.filter(
  (subject) => subject.id !== COMPULSORY_SUBJECT,
);

/**
 * The student's UTME combination. Use of English is locked, the three optional
 * slots stay editable, and a subject already picked in another slot cannot be
 * picked twice.
 */
export function SettingsSubjects({
  subjects,
  onSlotChange,
}: SettingsSubjectsProps) {
  const slots = getSubjectSlots(subjects);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4 text-muted-foreground">
        <HugeiconsIcon
          icon={LockKeyIcon}
          className="size-5 shrink-0"
          aria-hidden="true"
        />
        <span className="font-medium">{COMPULSORY_SUBJECT_NAME}</span>
        <span className="ml-auto text-xs font-semibold tracking-wider uppercase">
          Required
        </span>
      </div>

      <div className="space-y-3">
        {slots.map((slug, index) => {
          const selectedName = UTME_SUBJECTS.find(
            (subject) => subject.id === slug,
          )?.name;

          return (
            <div key={index} className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Subject {index + 1}
              </span>

              <Select
                value={slug}
                onValueChange={(value) => onSlotChange(index, value ?? "")}
              >
                <SelectTrigger
                  aria-label={`Subject ${index + 1}`}
                  className="h-11 w-full text-base"
                >
                  <SelectValue placeholder="Select a subject...">
                    {selectedName}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {OPTIONAL_SUBJECTS.map((subject) => (
                    <SelectItem
                      key={subject.id}
                      value={subject.id}
                      disabled={slots.some(
                        (slot, slotIndex) =>
                          slotIndex !== index && slot === subject.id,
                      )}
                    >
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
