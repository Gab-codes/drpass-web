import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  test("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["email"]);
    }
  });

  test("rejects missing password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["password"]);
    }
  });

  test("accepts optional rememberMe", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  test("accepts valid input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "supersecret",
    });
    expect(result.success).toBe(true);
  });

  test("rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "supersecret",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
    }
  });

  test("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
      password: "supersecret",
    });
    expect(result.success).toBe(false);
  });

  test("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["password"]);
    }
  });
});
