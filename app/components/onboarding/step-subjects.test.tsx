import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";

import { StepSubjects } from "@/components/onboarding/step-subjects";
import { useOnboardingStore } from "@/store/onboarding-store";
import {
  getSubjects,
  onboardingKeys,
  submitOnboardingApi,
} from "@/api/onboarding";
import { USER_QUERY_KEY } from "@/hooks/use-user";
import { AxiosError } from "axios";
import type { ApiSubject } from "@/types/onboarding";
import type { UserResponse } from "@/types/auth";

vi.mock("@/store/onboarding-store", () => ({
  useOnboardingStore: vi.fn(),
}));

vi.mock("@/api/onboarding", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/onboarding")>()),
  getSubjects: vi.fn(),
  submitOnboardingApi: vi.fn(),
}));

const mockedGetSubjects = vi.mocked(getSubjects);
const mockedSubmitOnboardingApi = vi.mocked(submitOnboardingApi);
const mockedUseOnboardingStore = vi.mocked(useOnboardingStore);

const apiSubjects: ApiSubject[] = [
  { id: "uuid-eng", name: "Use of English", code: "ENG" },
  { id: "uuid-mth", name: "Mathematics", code: "MTH" },
  { id: "uuid-phy", name: "Physics", code: "PHY" },
  { id: "uuid-chm", name: "Chemistry", code: "CHM" },
];

const draft = {
  preferredName: "Gabriel",
  intendedProgramme: {
    id: "medicine-and-surgery",
    name: "Medicine and Surgery",
    recommendedSubjects: [],
  },
  subjects: ["english", "math", "physics", "chemistry"],
  completeOnboarding: vi.fn(),
};

const completeButton = () =>
  screen.getByRole("button", { name: /looks right|saving/i });

function renderStep() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Seed the cache so the component has the canonical catalogue synchronously.
  queryClient.setQueryData(onboardingKeys.subjects(), [
    { id: "uuid-eng", name: "Use of English", code: "ENG" },
    { id: "uuid-mth", name: "Mathematics", code: "MTH" },
    { id: "uuid-phy", name: "Physics", code: "PHY" },
    { id: "uuid-chm", name: "Chemistry", code: "CHM" },
  ]);
  // Seed the canonical current-user cache with the pre-onboarding user so
  // the success path's cache merge has something authoritative to update.
  const baseUser: UserResponse = {
    id: "u1",
    name: "Gabriel Okafor",
    email: "gabriel@example.com",
    emailVerified: true,
    image: null,
    role: "user",
    preferredName: null,
    onboardingCompleted: false,
    programme: null,
    subjects: [],
  };
  queryClient.setQueryData(USER_QUERY_KEY, baseUser);
  return { queryClient, render: renderUi() };

  function renderUi() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/onboarding"]}>
          <Routes>
            <Route
              path="/onboarding"
              element={<StepSubjects onBack={() => {}} />}
            />
            <Route path="/dashboard" element={<div>dashboard</div>} />
            <Route path="/login" element={<div>login</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }
}

// Flush pending promises (the subjects query) so the component has the
// canonical catalogue before the submission click.
async function renderAndSettle() {
  const { queryClient, render: rendered } = renderStep();
  await act(async () => {});
  return { queryClient, ...rendered };
}

describe("StepSubjects final submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSubjects.mockResolvedValue([
      { id: "uuid-eng", name: "Use of English", code: "ENG" },
      { id: "uuid-mth", name: "Mathematics", code: "MTH" },
      { id: "uuid-phy", name: "Physics", code: "PHY" },
      { id: "uuid-chm", name: "Chemistry", code: "CHM" },
    ]);
  });

  it("submits the draft exactly once and navigates to the dashboard on success", async () => {
    mockedUseOnboardingStore.mockReturnValue(draft);
    mockedSubmitOnboardingApi.mockResolvedValue({
      preferredName: "Gabriel",
      programme: null,
      subjects: [],
      onboardingCompleted: true,
    });

    await renderAndSettle();
    fireEvent.click(completeButton());

    await waitFor(() => {
      expect(screen.getByText("dashboard")).toBeInTheDocument();
    });

    expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(1);
    expect(mockedSubmitOnboardingApi.mock.calls[0][0]).toEqual({
      preferredName: "Gabriel",
      programmeId: "medicine-and-surgery",
      subjectIds: ["uuid-eng", "uuid-mth", "uuid-phy", "uuid-chm"],
    });
    expect(draft.completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it("reflects onboardingCompleted: true in the canonical user cache before navigating", async () => {
    mockedUseOnboardingStore.mockReturnValue(draft);
    mockedSubmitOnboardingApi.mockResolvedValue({
      preferredName: "Gabriel",
      programme: null,
      subjects: [],
      onboardingCompleted: true,
    });

    const { queryClient } = await renderAndSettle();
    fireEvent.click(completeButton());

    await waitFor(() => {
      expect(screen.getByText("dashboard")).toBeInTheDocument();
    });

    // The PATCH response is authoritative: by the time /dashboard renders,
    // the canonical ["auth", "me"] cache must already be completed, so the
    // student-route guard cannot bounce back to /onboarding.
    const user = queryClient.getQueryData<UserResponse>(USER_QUERY_KEY);
    expect(user?.onboardingCompleted).toBe(true);
    expect(user?.preferredName).toBe("Gabriel");
  });

  it("treats a PATCH response without completion confirmation as a failure", async () => {
    mockedUseOnboardingStore.mockReturnValue(draft);
    mockedSubmitOnboardingApi.mockResolvedValue({
      preferredName: "Gabriel",
      programme: null,
      subjects: [],
      onboardingCompleted: false,
    });

    const { queryClient } = await renderAndSettle();
    fireEvent.click(completeButton());

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't save your onboarding/i),
      ).toBeInTheDocument();
    });
    // Draft is preserved for retry; no navigation, no cache update.
    expect(draft.completeOnboarding).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData<UserResponse>(USER_QUERY_KEY)
        ?.onboardingCompleted,
    ).toBe(false);
    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
  });

  it("does not mark onboarding complete on failure and allows a retry", async () => {
    mockedUseOnboardingStore.mockReturnValue(draft);
    mockedSubmitOnboardingApi
      .mockRejectedValueOnce(
        new AxiosError(
          "Request failed with status code 400",
          "ERR_BAD_REQUEST",
          undefined,
          undefined,
          {
            status: 400,
            data: { message: "A subject combination must contain exactly 4 subjects." },
          } as never,
        ),
      )
      .mockResolvedValueOnce({
        preferredName: "Gabriel",
        programme: null,
        subjects: [],
        onboardingCompleted: true,
      });

    await renderAndSettle();
    fireEvent.click(completeButton());
    await waitFor(() => {
      expect(
        screen.getByText(/subject combination must contain exactly 4/i),
      ).toBeInTheDocument();
    });
    expect(draft.completeOnboarding).not.toHaveBeenCalled();

    // Retry succeeds.
    fireEvent.click(completeButton());
    await waitFor(() => {
      expect(screen.getByText("dashboard")).toBeInTheDocument();
    });
    expect(mockedSubmitOnboardingApi).toHaveBeenCalledTimes(2);
    expect(draft.completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it("disables the complete button and shows a saving state while submitting", async () => {
    mockedUseOnboardingStore.mockReturnValue(draft);
    let resolveSubmit!: (value: {
      preferredName: string;
      programme: null;
      subjects: never[];
      onboardingCompleted: boolean;
    }) => void;
    mockedSubmitOnboardingApi.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      }),
    );

    await renderAndSettle();
    fireEvent.click(completeButton());

    // The pending state is applied asynchronously by the mutation.
    await waitFor(() => {
      expect(completeButton()).toBeDisabled();
    });
    expect(completeButton()).toHaveTextContent(/saving/i);

    resolveSubmit({
      preferredName: "Gabriel",
      programme: null,
      subjects: [],
      onboardingCompleted: true,
    });
    await waitFor(() => {
      expect(screen.getByText("dashboard")).toBeInTheDocument();
    });
  });
});