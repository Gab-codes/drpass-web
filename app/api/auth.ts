import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/axios";
import type { LoginInput, RegisterInput } from "@/validation/auth";
import type { UserResponse } from "@/types/auth";

export const login = async (input: LoginInput) => {
  const result = await authClient.signIn.email(input);
  return result;
};

export const register = async (input: RegisterInput) => {
  const result = await authClient.signUp.email(input);

  return result;
};

export const logout = async () => {
  const result = await authClient.signOut();

  return result;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await apiClient.get<UserResponse>("/api/v1/auth/me");
  return response.data;
};
