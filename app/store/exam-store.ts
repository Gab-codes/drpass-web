import { create } from "zustand";
import type { ExamConfig, Question } from "@/data/mock-exam";

export type ExamStatus = "idle" | "in-progress" | "submitting" | "completed";

interface ExamState {
  status: ExamStatus;
  config: ExamConfig | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> optionId
  timeRemaining: number; // in seconds
  isSubmitDialogOpen: boolean;

  // Actions
  setupExam: (config: ExamConfig, questions: Question[]) => void;
  startExam: () => void;
  setAnswer: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  tickTime: () => void;
  openSubmitDialog: () => void;
  closeSubmitDialog: () => void;
  submitExam: () => void;
  resetExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  status: "idle",
  config: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 0,
  isSubmitDialogOpen: false,

  setupExam: (config, questions) =>
    set({
      config,
      questions,
      status: "idle",
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: config.totalTimeMinutes * 60,
      isSubmitDialogOpen: false,
    }),

  startExam: () => set({ status: "in-progress" }),

  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: optionId,
      },
    })),

  nextQuestion: () =>
    set((state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        return { currentQuestionIndex: state.currentQuestionIndex + 1 };
      }
      return state;
    }),

  prevQuestion: () =>
    set((state) => {
      if (state.currentQuestionIndex > 0) {
        return { currentQuestionIndex: state.currentQuestionIndex - 1 };
      }
      return state;
    }),

  goToQuestion: (index) =>
    set((state) => {
      if (index >= 0 && index < state.questions.length) {
        return { currentQuestionIndex: index };
      }
      return state;
    }),

  tickTime: () =>
    set((state) => {
      if (state.status !== "in-progress") return state;
      
      const newTime = Math.max(0, state.timeRemaining - 1);
      if (newTime === 0) {
        return { timeRemaining: 0, status: "completed", isSubmitDialogOpen: false };
      }
      return { timeRemaining: newTime };
    }),

  openSubmitDialog: () => set({ isSubmitDialogOpen: true }),

  closeSubmitDialog: () => set({ isSubmitDialogOpen: false }),

  submitExam: () => set({ status: "completed", isSubmitDialogOpen: false }),

  resetExam: () =>
    set({
      status: "idle",
      config: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: 0,
      isSubmitDialogOpen: false,
    }),
}));
