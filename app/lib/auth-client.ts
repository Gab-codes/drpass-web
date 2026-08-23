import { createAuthClient } from "better-auth/client";
import {
  twoFactorClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor", // the page to redirect if a user needs to verify 2nd factor. not implemented yet
    }),
    inferAdditionalFields({
      user: {
        role: {
          type: ["admin", "user"] as const,
          required: false,
          input: false,
          returned: true,
        },
      },
    }),
  ],
});
