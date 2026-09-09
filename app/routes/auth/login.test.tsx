import { login, getCurrentUser } from "@/api/auth";

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserResponse } from "@/types/auth";

import LoginPage from "@/routes/auth/login";

vi.mock("@/api/auth", () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

vi.mock("@/components/auth/auth-layout", () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockedLogin = vi.mocked(login);
const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const completeUser: UserResponse = {
  id: "u1",
  name: "Gabriel Okafor",
  email: "gabriel@example.com",
  emailVerified: true,
  image: null,
  role: "user",
  preferredName: "Gaby",
  onboardingCompleted: true, onboardingCompletedAt: new Date(),
  programme: null,
  subjects: [],
};

const incompleteUser: UserResponse = {
  ...completeUser,
  preferredName: null,
  onboardingCompleted: false, onboardingCompletedAt: null,
};

const adminUser: UserResponse = {
  ...completeUser,
  role: "admin",
};

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<div>REGISTER PAGE</div>} />
            <Route path="/dashboard" element={<div>DASHBOARD PAGE</div>} />
            <Route path="/onboarding" element={<div>ONBOARDING PAGE</div>} />
            <Route path="/admin" element={<div>ADMIN PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

async function submitCredentials() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "gabriel@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("LoginPage post-login routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLogin.mockResolvedValue({
      data: { user: { id: "u1", role: "user" } },
    } as never);
  });

  it("navigates onboarded users to /dashboard based on the canonical /me response", async () => {
    mockedGetCurrentUser.mockResolvedValue(completeUser);
    renderLoginPage();

    await submitCredentials();

    await waitFor(() =>
      expect(screen.getByText("DASHBOARD PAGE")).toBeInTheDocument(),
    );
    // The decision comes from the canonical /auth/me fetch, exactly once.
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("navigates incomplete users to /onboarding", async () => {
    mockedGetCurrentUser.mockResolvedValue(incompleteUser);
    renderLoginPage();

    await submitCredentials();

    await waitFor(() =>
      expect(screen.getByText("ONBOARDING PAGE")).toBeInTheDocument(),
    );
  });

  it("navigates admins to /admin", async () => {
    mockedGetCurrentUser.mockResolvedValue(adminUser);
    renderLoginPage();

    await submitCredentials();

    await waitFor(() =>
      expect(screen.getByText("ADMIN PAGE")).toBeInTheDocument(),
    );
  });

  it("shows an error and does not navigate when login fails", async () => {
    mockedLogin.mockRejectedValue(
      Object.assign(new Error("Invalid credentials"), {
        message: "Invalid credentials",
      }),
    );
    renderLoginPage();

    await submitCredentials();

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("DASHBOARD PAGE")).not.toBeInTheDocument();
    expect(screen.queryByText("ONBOARDING PAGE")).not.toBeInTheDocument();
    expect(mockedGetCurrentUser).not.toHaveBeenCalled();
  });

  it("shows an error and does not navigate when the /me fetch fails", async () => {
    mockedGetCurrentUser.mockRejectedValue(new Error("network down"));
    renderLoginPage();

    await submitCredentials();

    await waitFor(() =>
      expect(screen.getByText(/network down/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText("DASHBOARD PAGE")).not.toBeInTheDocument();
    expect(screen.queryByText("ONBOARDING PAGE")).not.toBeInTheDocument();
  });
});