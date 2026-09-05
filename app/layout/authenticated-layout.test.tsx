import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthenticatedLayout from "@/layout/authenticated-layout";
import { getCurrentUser } from "@/api/auth";
import type { UserResponse } from "@/types/auth";

vi.mock("@/api/auth", () => ({
  getCurrentUser: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const user: UserResponse = {
  id: "u1",
  name: "Gabriel Okafor",
  email: "gabriel@example.com",
  emailVerified: true,
  image: null,
  role: "user",
};

function renderLayout({
  resolvedUser,
  error,
}: { resolvedUser?: UserResponse; error?: Error } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  if (error) {
    queryClient.setQueryData(["auth", "me"], undefined);
    // Seed the cache with a rejected promise so isLoading is false
    mockedGetCurrentUser.mockRejectedValue(error);
  } else if (resolvedUser) {
    mockedGetCurrentUser.mockResolvedValue(resolvedUser);
  } else {
    mockedGetCurrentUser.mockReturnValue(new Promise(() => {}));
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route
            path="/protected"
            element={<AuthenticatedLayout />}
          >
            <Route index element={<div>PROTECTED CONTENT</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the existing loading spinner while /me is pending", () => {
    const { container } = renderLayout();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("PROTECTED CONTENT");
  });

  it("redirects unauthenticated users to /login", async () => {
    const { container } = renderLayout({
      error: new Error("401 Unauthorized"),
    });

    await waitFor(() =>
      expect(container).toHaveTextContent("LOGIN PAGE"),
    );
  });

  it("renders authenticated content without shell styling", async () => {
    const { container } = renderLayout({ resolvedUser: user });

    await waitFor(() =>
      expect(container).toHaveTextContent("PROTECTED CONTENT"),
    );

    // Access boundary only — no sidebar/header shell
    expect(container).not.toHaveTextContent("DrPass");
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });
});
