import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AxiosError } from "axios";

import { apiClient } from "@/lib/axios";
import {
  PracticePrepareError,
  preparePracticeQuestions,
} from "@/lib/practice-api";

vi.mock("@/lib/axios", () => ({
  apiClient: { post: vi.fn() },
}));

const postMock = apiClient.post as unknown as ReturnType<typeof vi.fn>;

const config = {
  subjects: [
    { subjectCode: "ENG", questionCount: 10 },
    { subjectCode: "MTH", questionCount: 5 },
  ],
  totalTimeMinutes: 15,
};

const apiQuestions = [
  {
    id: "q-1",
    subjectCode: "ENG",
    subject: "Use of English",
    text: "Pick one.",
    options: [
      { id: "q-1-A", label: "A", text: "one" },
      { id: "q-1-B", label: "B", text: "two" },
    ],
  },
];

beforeEach(() => {
  postMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("preparePracticeQuestions", () => {
  it("posts subjects and time without filters by default", async () => {
    postMock.mockResolvedValue({ data: { questions: apiQuestions } });

    await preparePracticeQuestions(config);

    expect(postMock).toHaveBeenCalledWith(
      "/api/v1/practice/questions",
      {
        subjects: config.subjects,
        totalTimeMinutes: config.totalTimeMinutes,
      },
      { signal: undefined },
    );
  });

  it("includes filters only when provided", async () => {
    postMock.mockResolvedValue({ data: { questions: [] } });

    await preparePracticeQuestions(config, { hasTopic: true, source: "JAMB" });

    expect(postMock).toHaveBeenCalledWith(
      "/api/v1/practice/questions",
      {
        subjects: config.subjects,
        totalTimeMinutes: config.totalTimeMinutes,
        filters: { hasTopic: true, source: "JAMB" },
      },
      { signal: undefined },
    );
  });

  it("returns the API-returned questions unchanged", async () => {
    postMock.mockResolvedValue({ data: { questions: apiQuestions } });

    const questions = await preparePracticeQuestions(config);

    expect(questions).toEqual(apiQuestions);
    expect(questions[0]).toMatchObject({
      id: "q-1",
      subject: "Use of English",
    });
    expect(questions[0].options[0]).toEqual({
      id: "q-1-A",
      label: "A",
      text: "one",
    });
  });

  it("maps network failures to a network error", async () => {
    const axiosError = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
      code: "ERR_NETWORK",
    }) as AxiosError;

    postMock.mockRejectedValue(axiosError);

    await expect(preparePracticeQuestions(config)).rejects.toMatchObject({
      name: "PracticePrepareError",
      code: "network",
    });
  });

  it("maps a 400 with an insufficient-questions message", async () => {
    const axiosError = Object.assign(new Error("fail"), {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message:
            "Not enough eligible questions for one or more selected subjects.",
        },
      },
    }) as AxiosError;

    postMock.mockRejectedValue(axiosError);

    const error = await preparePracticeQuestions(config).catch((e) => e);
    expect(error).toBeInstanceOf(PracticePrepareError);
    expect(error.code).toBe("insufficient-questions");
  });

  it("maps other 400 responses to invalid-config", async () => {
    const axiosError = Object.assign(new Error("fail"), {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: "Subject(s) not part of your subject combination: XXX." },
      },
    }) as AxiosError;

    postMock.mockRejectedValue(axiosError);

    const error = await preparePracticeQuestions(config).catch((e) => e);
    expect(error.code).toBe("invalid-config");
  });

  it("maps server errors", async () => {
    const axiosError = Object.assign(new Error("boom"), {
      isAxiosError: true,
      response: { status: 500, data: {} },
    }) as AxiosError;

    postMock.mockRejectedValue(axiosError);

    const error = await preparePracticeQuestions(config).catch((e) => e);
    expect(error.code).toBe("server");
  });
});
