import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/api/auth";
import { USER_QUERY_KEY } from "@/hooks/use-user";
import { useOnboardingStore } from "@/store/onboarding-store";
import type { UserResponse } from "@/types/auth";

import OnboardingPage from "@/routes/onboarding";

vi.mock("@/api/auth", () => ({
  getCurrentUser: vi.fn(),
}));

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

const incompleteUser: UserResponse = {
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

function renderOnboarding(user: UserResponse = incompleteUser) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // AuthenticatedLayout has already resolved the user upstream
  queryClient.setQueryData(USER_QUERY_KEY, user);

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
  });

  it("does not perform its own /me query", () => {
    renderOnboarding();

    expect(mockedGetCurrentUser).not.toHaveBeenCalled();
  });

  it("does not call the onboarding state endpoint — completion comes from /auth/me", () => {
    const { queryClient } = renderOnboarding();

    // The redundant GET /users/me/onboarding read was removed; the cache
    // must not contain an onboarding state entry.
    expect(
      queryClient.getQueryState(["onboarding", "state"]),
    ).toBeUndefined();
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

  it("redirects completed users to /dashboard based on the canonical user", async () => {
    const { container } = renderOnboarding({
      ...incompleteUser,
      onboardingCompleted: true,
    });

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
