import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import type { LoginInput, RegisterInput } from "@/validation/auth";
import type { UserResponse } from "@/types/auth";

export const login = async (input: LoginInput) => {
  const result = await authClient.signIn.email(input);

  if (result.error) {
    throw result.error;
  }

  return result;
};

export const register = async (input: RegisterInput) => {
  const result = await authClient.signUp.email(input);

  if (result.error) {
    throw result.error;
  }

  return result;
};

export const logout = async () => {
  const result = await authClient.signOut();

  return result;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>("/auth/me");
  return response.data;
};
