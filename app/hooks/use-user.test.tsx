import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/api/auth";
import { USER_QUERY_KEY, useUser } from "@/hooks/use-user";
import type { UserResponse } from "@/types/auth";

vi.mock("@/api/auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the single stable /me query key", async () => {
    mockedGetCurrentUser.mockResolvedValueOnce(user);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(user));

    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(USER_QUERY_KEY).toEqual(["auth", "me"]);
  });

  it("exposes user, isLoading and isError", async () => {
    mockedGetCurrentUser.mockResolvedValueOnce(user);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);

    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("exposes isError when /me fails and user stays null", async () => {
    mockedGetCurrentUser.mockRejectedValueOnce(new Error("401"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("shares one cached fetch between multiple consumers", async () => {
    mockedGetCurrentUser.mockResolvedValueOnce(user);
    const { wrapper } = createWrapper();

    const first = renderHook(() => useUser(), { wrapper });
    const second = renderHook(() => useUser(), { wrapper });

    await waitFor(() => expect(first.result.current.user).toEqual(user));
    await waitFor(() => expect(second.result.current.user).toEqual(user));

    // Single query key → a single network fetch for both consumers
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
  });
});
