import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentLayout from "@/layout/student-layout";
import { USER_QUERY_KEY } from "@/hooks/use-user";
import { getCurrentUser } from "@/api/auth";
import type { UserResponse } from "@/types/auth";

vi.mock("@/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const user: UserResponse = {
  id: "u1",
  name: "Gabriel Okafor",
  email: "gabriel@example.com",
  emailVerified: true,
  image: null,
  role: "user",
  preferredName: "Gaby",
  onboardingCompleted: true,
  programme: null,
  subjects: [],
};

const incompleteUser: UserResponse = {
  ...user,
  preferredName: null,
  onboardingCompleted: false,
};

function renderStudentLayout(resolvedUser: UserResponse = user) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // The user is already resolved by AuthenticatedLayout upstream; seed
  // the shared cache so the layout must read it, not fetch it.
  queryClient.setQueryData(USER_QUERY_KEY, resolvedUser);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/" element={<StudentLayout />}>
            <Route path="dashboard" element={<div>DASHBOARD PAGE</div>} />
          </Route>
          <Route path="/onboarding" element={<div>ONBOARDING PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("StudentLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the existing sidebar/application shell with the user from useUser()", () => {
    const { container } = renderStudentLayout();

    expect(container).toHaveTextContent("DrPass");
    expect(container).toHaveTextContent("Gabriel Okafor");
    expect(container).toHaveTextContent("gabriel@example.com");
    expect(container).toHaveTextContent("DASHBOARD PAGE");
  });

  it("does not independently fetch /me", () => {
    renderStudentLayout();
    expect(mockedGetCurrentUser).not.toHaveBeenCalled();
  });

  it("redirects incomplete users to /onboarding on direct navigation", async () => {
    const { container } = renderStudentLayout(incompleteUser);

    await waitFor(() =>
      expect(container).toHaveTextContent("ONBOARDING PAGE"),
    );
    // The shell must not flash for an incomplete user.
    expect(container).not.toHaveTextContent("DASHBOARD PAGE");
  });

  it("does not redirect completed users away from student routes", () => {
    const { container } = renderStudentLayout(user);

    expect(container).toHaveTextContent("DASHBOARD PAGE");
  });
});
