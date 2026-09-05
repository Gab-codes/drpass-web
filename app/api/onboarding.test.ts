import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildSubmitOnboardingRequest,
  getOnboardingState,
  getSubjects,
  resolveSubjectIds,
  submitOnboardingApi,
} from "@/api/onboarding";
import { apiClient } from "@/lib/axios";
import type { ApiSubject, Programme } from "@/types/onboarding";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

const apiSubjects: ApiSubject[] = [
  { id: "uuid-eng", name: "Use of English", code: "ENG" },
  { id: "uuid-mth", name: "Mathematics", code: "MTH" },
  { id: "uuid-phy", name: "Physics", code: "PHY" },
  { id: "uuid-chm", name: "Chemistry", code: "CHM" },
  { id: "uuid-bio", name: "Biology", code: "BIO" },
];

const programme: Programme = {
  id: "medicine-and-surgery",
  name: "Medicine and Surgery",
  recommendedSubjects: ["Biology", "Chemistry", "Physics"],
};

const draft = {
  preferredName: "Gabriel",
  programme,
  subjectSlugs: ["english", "math", "physics", "chemistry"],
  apiSubjects,
};

describe("onboarding API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches canonical subjects from GET /subjects", async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: apiSubjects });

    await expect(getSubjects()).resolves.toEqual(apiSubjects);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/subjects");
  });

  it("fetches the canonical onboarding state from GET /users/me/onboarding", async () => {
    const state = {
      preferredName: "Gabriel",
      programme: { id: "medicine-and-surgery", slug: "medicine-and-surgery", name: "Medicine and Surgery" },
      subjects: [apiSubjects[0]],
      onboardingCompleted: true,
    };
    mockedApiClient.get.mockResolvedValueOnce({ data: state });

    await expect(getOnboardingState()).resolves.toEqual(state);
    expect(mockedApiClient.get).toHaveBeenCalledWith("/users/me/onboarding");
  });

  it("submits the onboarding draft via PATCH /users/me/onboarding", async () => {
    const response = {
      preferredName: "Gabriel",
      programme: null,
      subjects: [apiSubjects[0]],
      onboardingCompleted: true,
    };
    mockedApiClient.patch.mockResolvedValueOnce({ data: response });

    const input = {
      preferredName: "Gabriel",
      programmeId: null,
      subjectIds: ["uuid-eng", "uuid-mth", "uuid-phy", "uuid-chm"],
    };

    await expect(submitOnboardingApi(input)).resolves.toEqual(response);
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      "/users/me/onboarding",
      input,
    );
  });

  describe("buildSubmitOnboardingRequest", () => {
    it("maps the preferred name through unchanged", () => {
      const request = buildSubmitOnboardingRequest(draft);
      expect(request.preferredName).toBe("Gabriel");
    });

    it("maps a selected programme to its canonical programme id", () => {
      const request = buildSubmitOnboardingRequest(draft);
      expect(request.programmeId).toBe("medicine-and-surgery");
    });

    it("sends programmeId: null for the manual subject-selection path", () => {
      const request = buildSubmitOnboardingRequest({ ...draft, programme: null });
      expect(request.programmeId).toBeNull();
    });

    it("maps subject slugs to canonical subject UUIDs via backend codes", () => {
      const request = buildSubmitOnboardingRequest(draft);
      expect(request.subjectIds).toEqual([
        "uuid-eng",
        "uuid-mth",
        "uuid-phy",
        "uuid-chm",
      ]);
    });

    it("submits exactly four subject IDs including Use of English", () => {
      const request = buildSubmitOnboardingRequest(draft);
      expect(request.subjectIds).toHaveLength(4);
      expect(request.subjectIds).toContain("uuid-eng");
    });

    it("reports unresolved slugs instead of silently dropping them", () => {
      const request = buildSubmitOnboardingRequest({
        ...draft,
        subjectSlugs: ["english", "math", "physics", "made-up"],
      });
      expect(request.subjectIds).toHaveLength(3);
      expect(request.unresolved).toEqual(["made-up"]);
    });

    it("reports slugs with no matching active backend subject", () => {
      expect(resolveSubjectIds(apiSubjects, ["english", "yoruba"])).toEqual({
        ids: ["uuid-eng"],
        unresolved: ["yoruba"],
      });
    });
  });
});