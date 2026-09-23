import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AxiosError } from "axios";

import { SettingsForm } from "@/components/student/settings/settings-form";
import {
  getSubjects,
  onboardingKeys,
  submitOnboardingApi,
} from "@/api/onboarding";
import { USER_QUERY_KEY } from "@/hooks/use-user";
import type { UserResponse } from "@/types/auth";
import type { ApiSubject, OnboardingResponse } from "@/types/onboarding";

vi.mock("@/api/onboarding", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/onboarding")>()),
  getSubjects: vi.fn(),
  submitOnboardingApi: vi.fn(),
}));

const mockedGetSubjects = vi.mocked(getSubjects);
const mockedSubmitOnboardingApi = vi.mocked(submitOnboardingApi);

const apiSubjects: ApiSubject[] = [
  { id: "uuid-eng", name: "Use of English", code: "ENG" },
  { id: "uuid-mth", name: "Mathematics", code: "MTH" },
  { id: "uuid-bio", name: "Biology", code: "BIO" },
  { id: "uuid-chm", name: "Chemistry", code: "CHM" },
  { id: "uuid-phy", name: "Physics", code: "PHY" },
  { id: "uuid-geo", name: "Geography", code: "GEO" },
  { id: "uuid-crs", name: "Christian Religious Knowledge", code: "CRS" },
  { id: "uuid-gov", name: "Government", code: "GOV" },
  { id: "uuid-his", name: "History", code: "HIS" },
];

const medicine: ApiSubject[] = [
  { id: "uuid-eng", name: "Use of English", code: "ENG" },
  { id: "uuid-bio", name: "Biology", code: "BIO" },
  { id: "uuid-chm", name: "Chemistry", code: "CHM" },
  { id: "uuid-phy", name: "Physics", code: "PHY" },
];

const programme = {
  id: "medicine-and-surgery",
  slug: "medicine-and-surgery",
  name: "Medicine and Surgery",
};

const user: UserResponse = {
  id: "u1",
  name: "Gabriel Okafor",
  email: "gabriel@example.com",
  emailVerified: true,
  image: null,
  role: "user",
  preferredName: "Gaby",
  onboardingCompleted: true,
  onboardingCompletedAt: new Date("2024-06-01T08:00:00.000Z"),
  programme,
  subjects: medicine,
};

/** The canonical PATCH response for a successful settings save. */
function savedState(
  overrides: Partial<OnboardingResponse> = {},
): OnboardingResponse {
  return {
    preferredName: "Gabriel",
    programme,
    subjects: medicine,
    onboardingCompleted: true,
    ...overrides,
  };
}

const saveButton = () =>
  screen.getByRole("button", { name: /save changes|saving/i });

const nameInput = () =>
  screen.getByRole("textbox", { name: "Preferred name" });

/** Renders the form with the given persisted user already resolved. */
function renderForm(overrides: Partial<UserResponse> = {}) {
  const resolvedUser = { ...user, ...overrides };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(USER_QUERY_KEY, resolvedUser);
  queryClient.setQueryData(onboardingKeys.subjects(), apiSubjects);

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/settings"]}>
        <Routes>
          <Route path="/settings" element={<SettingsForm user={resolvedUser} />} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { queryClient, ...rendered };
}

/** Flushes the subject-catalogue query so the form has canonical IDs. */
async function renderAndSettle(overrides: Partial<UserResponse> = {}) {
  const result = renderForm(overrides);
  await act(async () => {});
  return result;
}

function rejectWith(status: number, message: string) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    { status, data: { message } } as never,
  );
}

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSubjects.mockResolvedValue(apiSubjects);
  });

  it("hydrates the persisted preferred name, programme and subjects", async () => {
    await renderAndSettle();

    expect(nameInput()).toHaveValue("Gaby");
    expect(screen.getByLabelText("Intended programme")).toHaveValue(
      "Medicine and Surgery",
    );
    expect(screen.getByLabelText("Subject 1")).toHaveTextContent("Biology");
    expect(screen.getByLabelText("Subject 2")).toHaveTextContent("Chemistry");
    expect(screen.getByLabelText("Subject 3")).toHaveTextContent("Physics");
  });

  it("keeps Use of English compulsory and not selectable", async () => {
    await renderAndSettle();

    expect(screen.getByText("Use of English")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    // Only the three optional slots are editable.
    expect(screen.getByLabelText("Subject 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject 3")).toBeInTheDocument();
    expect(screen.queryByLabelText("Subject 4")).not.toBeInTheDocument();
  });

  it("keeps save disabled until something changes", async () => {
    await renderAndSettle();

    expect(saveButton()).toBeDisabled();

    // Re-setting the same name is not a change.
    fireEvent.change(nameInput(), { target: { value: "Gaby" } });
    expect(saveButton()).toBeDisabled();

    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    expect(saveButton()).toBeEnabled();

    fireEvent.change(nameInput(), { target: { value: "Gaby" } });
    expect(saveButton()).toBeDisabled();
  });

  it("saves the whole profile through the existing onboarding endpoint", async () => {
    mockedSubmitOnboardingApi.mockResolvedValue(savedState());
    await renderAndSettle();

    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1),
    );

    expect(mockedSubmitOnboardingApi.mock.calls[0][0]).toEqual({
      preferredName: "Gabriel",
      programmeId: "medicine-and-surgery",
      subjectIds: ["uuid-eng", "uuid-bio", "uuid-chm", "uuid-phy"],
    });

    // The accepted state stays visible and confirms the save.
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your settings are saved.",
      ),
    );
    expect(saveButton()).toBeDisabled();
  });

  it("reflects the accepted state in the canonical user cache", async () => {
    mockedSubmitOnboardingApi.mockResolvedValue(
      savedState({
        programme: null,
        subjects: [
          { id: "uuid-eng", name: "Use of English", code: "ENG" },
          { id: "uuid-mth", name: "Mathematics", code: "MTH" },
          { id: "uuid-phy", name: "Physics", code: "PHY" },
          { id: "uuid-geo", name: "Geography", code: "GEO" },
        ],
      }),
    );

    const { queryClient } = await renderAndSettle();
    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(
        queryClient.getQueryData<UserResponse>(USER_QUERY_KEY)?.preferredName,
      ).toBe("Gabriel"),
    );

    const cached = queryClient.getQueryData<UserResponse>(USER_QUERY_KEY);
    expect(cached?.programme).toBeNull();
    expect(cached?.subjects.map((subject) => subject.code)).toEqual([
      "ENG",
      "MTH",
      "PHY",
      "GEO",
    ]);
    // Identity fields and the completion timestamp are preserved.
    expect(cached?.name).toBe("Gabriel Okafor");
    expect(cached?.email).toBe("gabriel@example.com");
    expect(cached?.onboardingCompletedAt).toEqual(user.onboardingCompletedAt);
  });

  it("blocks saving with an invalid preferred name", async () => {
    await renderAndSettle();

    fireEvent.change(nameInput(), { target: { value: "   " } });
    expect(screen.getByText("Enter a preferred name.")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    fireEvent.change(nameInput(), { target: { value: "x".repeat(51) } });
    expect(
      screen.getByText("Preferred name must be 50 characters or fewer."),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(mockedSubmitOnboardingApi).not.toHaveBeenCalled();
  });

  it("requires a complete four-subject combination before saving", async () => {
    // A persisted subject with no frontend slug leaves a slot empty.
    await renderAndSettle({
      subjects: [
        { id: "uuid-eng", name: "Use of English", code: "ENG" },
        { id: "uuid-bio", name: "Biology", code: "BIO" },
      ],
    });

    expect(
      screen.getByText("Select 3 subjects in addition to Use of English."),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  function deferred() {
    let resolve!: (value: OnboardingResponse) => void;
    const promise = new Promise<OnboardingResponse>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  }

  /**
   * Types into the programme combobox. A real `InputEvent` is dispatched
   * because the combobox only opens for genuine typing (not for autofill-style
   * value changes, which carry no `inputType`).
   */
  async function findProgrammeOption(name: string) {
    const input = screen.getByLabelText("Intended programme");
    fireEvent.click(input);
    fireEvent.input(input, { target: { value: name }, inputType: "insertText" });
    return screen.findByRole("option", { name });
  }

  /**
   * Opens a subject select and returns the named option from its popup.
   */
  async function openSubjectSelect(slot: number, name: string) {
    fireEvent.click(screen.getByLabelText(`Subject ${slot}`));
    return screen.findByRole("option", { name });
  }

  /**
   * Commits an option the way a real pointer interaction does. Base UI ignores
   * clicks on select items that never received a `pointerdown` on the item.
   */
  function clickOption(option: HTMLElement) {
    fireEvent.pointerDown(option);
    fireEvent.click(option);
  }

  it("replaces the subjects with the programme's recommended combination", async () => {
    await renderAndSettle();
    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });

    fireEvent.click(await findProgrammeOption("Religious Studies"));

    expect(screen.getByLabelText("Subject 1")).toHaveTextContent(
      "Christian Religious Knowledge",
    );
    expect(screen.getByLabelText("Subject 2")).toHaveTextContent("Government");
    expect(screen.getByLabelText("Subject 3")).toHaveTextContent("History");

    mockedSubmitOnboardingApi.mockResolvedValue(savedState());
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1),
    );
    expect(mockedSubmitOnboardingApi.mock.calls[0][0]).toEqual({
      preferredName: "Gabriel",
      programmeId: "religious-studies",
      subjectIds: ["uuid-eng", "uuid-crs", "uuid-gov", "uuid-his"],
    });
  });

  it("lets the student adjust the recommended subjects before saving", async () => {
    await renderAndSettle();
    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });

    fireEvent.click(await findProgrammeOption("Religious Studies"));
    clickOption(await openSubjectSelect(3, "Geography"));

    expect(screen.getByLabelText("Subject 3")).toHaveTextContent("Geography");

    mockedSubmitOnboardingApi.mockResolvedValue(savedState());
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1),
    );
    expect(mockedSubmitOnboardingApi.mock.calls[0][0]).toEqual({
      preferredName: "Gabriel",
      programmeId: "religious-studies",
      subjectIds: ["uuid-eng", "uuid-crs", "uuid-gov", "uuid-geo"],
    });
  });

  it("does not allow the same subject twice", async () => {
    await renderAndSettle();

    // Physics already fills slot 3, so slot 1 cannot pick it.
    fireEvent.click(screen.getByLabelText("Subject 1"));
    const physics = await screen.findByRole("option", { name: "Physics" });

    expect(physics).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(physics);
    expect(screen.getByLabelText("Subject 1")).toHaveTextContent("Biology");
  });

  it("disables saving while the request is in flight", async () => {
    const pending = deferred();
    mockedSubmitOnboardingApi.mockReturnValue(pending.promise);
    await renderAndSettle();

    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(saveButton()).toBeDisabled());
    expect(saveButton()).toHaveTextContent(/saving/i);

    pending.resolve(savedState());
    await waitFor(() =>
      expect(saveButton()).toHaveTextContent(/save changes/i),
    );
    expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1);
  });

  it("submits only once when save is clicked repeatedly", async () => {
    const pending = deferred();
    mockedSubmitOnboardingApi.mockReturnValue(pending.promise);
    await renderAndSettle();

    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    fireEvent.click(saveButton());
    fireEvent.click(saveButton());
    fireEvent.click(saveButton());

    await waitFor(() => expect(saveButton()).toBeDisabled());
    expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1);

    pending.resolve(savedState());
    await act(async () => {});
    expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1);
  });

  it("shows the API error and lets the student retry", async () => {
    mockedSubmitOnboardingApi.mockRejectedValueOnce(
      rejectWith(400, "Programme does not exist."),
    );
    await renderAndSettle();

    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(screen.getByText("Programme does not exist.")).toBeInTheDocument(),
    );
    // The student keeps their edits and can save again.
    expect(nameInput()).toHaveValue("Gabriel");
    expect(saveButton()).toBeEnabled();
  });

  it("redirects to /login when the session has expired", async () => {
    mockedSubmitOnboardingApi.mockRejectedValueOnce(
      rejectWith(401, "Unauthorized"),
    );
    await renderAndSettle();

    fireEvent.change(nameInput(), { target: { value: "Gabriel" } });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(screen.getByText("login page")).toBeInTheDocument(),
    );
  });
});
