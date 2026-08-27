import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
    // E2E tests live in e2e/ and are run by Playwright, not vitest
    exclude: ["**/node_modules/**", "e2e/**", "playwright-report/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
});
