import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  buildSubmitOnboardingRequest,
  getSubjects,
  onboardingKeys,
  submitOnboardingApi,
} from "@/api/onboarding";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  PROGRAMME_NAMES,
  getProgrammeById,
  getProgrammeByName,
} from "@/data/programmes";
import { USER_QUERY_KEY } from "@/hooks/use-user";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  isSettingsDirty,
  toSettingsFormValues,
  validatePreferredName,
  validateSubjectSelection,
  withProgramme,
  withSubjectSlot,
} from "@/lib/settings";
import type { UserResponse } from "@/types/auth";
import { SettingsSubjects } from "./settings-subjects";

interface SettingsFormProps {
  /** The resolved current user; the form hydrates from it, never from a draft. */
  user: UserResponse;
}

/**
 * The student's profile settings form (preferred name, programme and UTME
 * subject combination). State is local and mirrors the persisted server state;
 * saving is a single resubmission of the whole profile through the existing
 * onboarding endpoint, so the backend stays the source of truth.
 */
export function SettingsForm({ user }: SettingsFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [baseline, setBaseline] = useState(() => toSettingsFormValues(user));
  const [values, setValues] = useState(baseline);

  const selectedProgramme = values.programmeId
    ? (getProgrammeById(values.programmeId) ?? null)
    : null;

  // The combobox input text starts on the student's current programme, so the
  // persisted selection is visible before anything is typed.
  const [search, setSearch] = useState(() => selectedProgramme?.name ?? "");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);

  // Canonical subject catalogue, used to resolve the picked slugs to backend
  // subject IDs at submission time.
  const { data: apiSubjects = [] } = useQuery({
    queryKey: onboardingKeys.subjects(),
    queryFn: getSubjects,
  });

  const nameError = validatePreferredName(values.preferredName);
  const subjectError = validateSubjectSelection(values.subjectSlugs);
  const isDirty = isSettingsDirty(values, baseline);

  const submitMutation = useMutation({
    mutationFn: submitOnboardingApi,
    onSuccess: (response) => {
      // The PATCH response is authoritative for the profile fields; the rest of
      // the cached user (identity, completion timestamp) stays as it was. No
      // refetch: the current-user query intentionally never goes stale.
      queryClient.setQueryData<UserResponse>(USER_QUERY_KEY, (cached) => ({
        ...(cached ?? user),
        preferredName: response.preferredName,
        programme: response.programme,
        subjects: response.subjects,
        onboardingCompleted: response.onboardingCompleted,
      }));

      // Re-hydrate from the accepted state so the form and the dirty tracking
      // reflect exactly what was persisted.
      const nextValues = toSettingsFormValues(response);
      setValues(nextValues);
      setBaseline(nextValues);
      setErrorMsg("");
      setSavedOnce(true);
    },
    onError: (error) => {
      setSavedOnce(false);

      if (error instanceof AxiosError && error.response?.status === 401) {
        // Session expired — re-authenticate instead of showing a retry loop.
        navigate("/login", { replace: true });
        return;
      }

      setErrorMsg(
        getApiErrorMessage(
          error,
          "We couldn't save your settings. Please try again.",
        ),
      );
    },
  });

  const canSave =
    isDirty && !nameError && !subjectError && !submitMutation.isPending;

  // Selecting a programme replaces the subjects with its recommendations;
  // clearing it keeps the student's current subjects.
  const handleProgrammeChange = (name: string | null) => {
    if (!name) {
      setValues((current) => withProgramme(current, null));
      return;
    }

    const programme = getProgrammeByName(name);
    if (programme) {
      setValues((current) => withProgramme(current, programme));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;

    // The form is mapped to the canonical API payload with the existing helper.
    // Slugs that cannot be resolved block the submission — nothing is dropped.
    const request = buildSubmitOnboardingRequest({
      preferredName: values.preferredName,
      programme: selectedProgramme,
      subjectSlugs: values.subjectSlugs,
      apiSubjects,
    });

    if (request.unresolved.length > 0 || request.subjectIds.length !== 4) {
      setErrorMsg(
        "Some of your subjects aren't available right now. Please pick them again and try again.",
      );
      return;
    }

    setErrorMsg("");
    const { unresolved: _unresolved, ...payload } = request;
    submitMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {errorMsg && (
        <Alert variant="destructive" className="px-3 py-2 text-sm">
          {errorMsg}
        </Alert>
      )}

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="flex flex-col gap-6 p-5 sm:p-6">
          <section aria-labelledby="settings-name-heading" className="space-y-4">
            <div className="space-y-1">
              <h2
                id="settings-name-heading"
                className="text-lg font-medium text-foreground"
              >
                Preferred name
              </h2>
              <p className="text-sm text-muted-foreground">
                The name DrPass uses when it greets you.
              </p>
            </div>

            <div className="max-w-sm space-y-2">
              <Label htmlFor="settings-preferred-name">Preferred name</Label>
              <Input
                id="settings-preferred-name"
                className="h-11 text-base"
                value={values.preferredName}
                aria-invalid={Boolean(nameError)}
                aria-describedby={
                  nameError ? "settings-preferred-name-error" : undefined
                }
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    preferredName: event.target.value,
                  }))
                }
              />
              {nameError && (
                <p
                  id="settings-preferred-name-error"
                  className="text-sm text-destructive"
                >
                  {nameError}
                </p>
              )}
            </div>
          </section>

          <Separator />
          <section
            aria-labelledby="settings-programme-heading"
            className="space-y-4"
          >
            <div className="space-y-1">
              <h2
                id="settings-programme-heading"
                className="text-lg font-medium text-foreground"
              >
                Programme
              </h2>
              <p className="text-sm text-muted-foreground">
                Changing your programme replaces your subjects with the ones it
                recommends.
              </p>
            </div>

            <div className="max-w-md space-y-2">
              <Label htmlFor="settings-programme">Intended programme</Label>
              <Combobox
                items={PROGRAMME_NAMES}
                limit={30}
                value={selectedProgramme?.name ?? null}
                onValueChange={handleProgrammeChange}
                inputValue={search}
                onInputValueChange={setSearch}
              >
                <ComboboxInput
                  id="settings-programme"
                  placeholder="Search programmes..."
                  showTrigger
                  showClear
                  className="h-11 rounded-xl text-base"
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
                    <p className="px-4 text-sm text-muted-foreground">
                      No programmes matched &ldquo;{search}&rdquo;.
                    </p>
                  </ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            </div>
          </section>

          <Separator />

          <section
            aria-labelledby="settings-subjects-heading"
            className="space-y-4"
          >
            <div className="space-y-1">
              <h2
                id="settings-subjects-heading"
                className="text-lg font-medium text-foreground"
              >
                Subjects
              </h2>
              <p className="text-sm text-muted-foreground">
                Your four UTME subjects. Use of English is compulsory.
              </p>
            </div>

            <SettingsSubjects
              subjects={values.subjectSlugs}
              onSlotChange={(index, slug) =>
                setValues((current) => withSubjectSlot(current, index, slug))
              }
            />

            {subjectError && (
              <p className="text-sm text-destructive">{subjectError}</p>
            )}
          </section>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {savedOnce && !isDirty && !submitMutation.isPending && (
          <p role="status" className="text-sm text-muted-foreground sm:mr-auto">
            Your settings are saved.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!canSave}
          className="w-full sm:w-auto"
        >
          {submitMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
