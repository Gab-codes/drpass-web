import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOnboardingState, onboardingKeys } from "@/api/onboarding";
import { getCurrentUser } from "@/api/auth";
import { USER_QUERY_KEY } from "@/hooks/use-user";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { UserResponse } from "@/types/auth";

import OnboardingPage from "@/routes/onboarding";

vi.mock("@/api/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/api/onboarding", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/onboarding")>();
  return {
    ...actual,
    getOnboardingState: vi.fn(),
  };
});

// The step flow is covered by its own component/store/API tests; stub the
// steps so this test can assert page-level wiring (user name, navigation).
vi.mock("@/components/onboarding/onboarding-shell", () => ({
  OnboardingShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="onboarding-shell">{children}</div>
  ),
}));
vi.mock("@/components/onboarding/step-welcome", () => ({
  StepWelcome: ({ defaultName }: { defaultName: string }) => (
    <div data-testid="step-welcome">{defaultName}</div>
  ),
}));
vi.mock("@/components/onboarding/step-programme", () => ({
  StepProgramme: () => <div data-testid="step-programme" />,
}));
vi.mock("@/components/onboarding/step-subjects", () => ({
  StepSubjects: () => <div data-testid="step-subjects" />,
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetOnboardingState = vi.mocked(getOnboardingState);

const user: UserResponse = {
  id: "u1",
  name: "Gabriel Okafor",
  email: "gabriel@example.com",
  emailVerified: true,
  image: null,
  role: "user",
};

function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // AuthenticatedLayout has already resolved the user upstream
  queryClient.setQueryData(USER_QUERY_KEY, {
    ...user,
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route path="/dashboard" element={<div>DASHBOARD PAGE</div>} />
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { queryClient, ...utils };
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().resetOnboarding();
    localStorage.removeItem("drpass-onboarding-storage");
    mockedGetOnboardingState.mockResolvedValue({
      preferredName: null,
      programme: null,
      subjects: [],
      onboardingCompleted: false,
    });
  });

  it("does not perform its own /me query", async () => {
    renderOnboarding();

    expect(mockedGetCurrentUser).not.toHaveBeenCalled();

    await waitFor(() => expect(mockedGetOnboardingState).toHaveBeenCalled());
  });

  it("still accesses the authenticated user correctly", async () => {
    const { getByTestId } = renderOnboarding();

    // The resolved user's name is passed through to the welcome step
    await waitFor(() =>
      expect(getByTestId("step-welcome")).toHaveTextContent(
        "Gabriel Okafor",
      ),
    );
  });

  it("redirects to /dashboard when the backend reports onboarding already completed", async () => {
    mockedGetOnboardingState.mockResolvedValue({
      preferredName: "Gabriel",
      programme: null,
      subjects: [],
      onboardingCompleted: true,
    });

    const { container } = renderOnboarding();

    await waitFor(() => expect(container).toHaveTextContent("DASHBOARD PAGE"));
  });

  it("renders the onboarding flow when not yet completed", async () => {
    const { getByTestId } = renderOnboarding();

    await waitFor(() =>
      expect(getByTestId("onboarding-shell")).toBeInTheDocument(),
    );
    expect(getByTestId("step-welcome")).toBeInTheDocument();
  });
});

describe("onboardingKeys", () => {
  it("keeps a stable state query key", () => {
    expect(onboardingKeys.state()).toBeDefined();
  });
});
