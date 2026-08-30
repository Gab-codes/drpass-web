/**
 * Student dashboard mock data.
 *
 * Replace with real TanStack Query data fetching when the backend analytics
 * API is available. Component structure does not change — just swap
 * MOCK_DASHBOARD_DATA for a real query result.
 *
 * Three representative states:
 *   newStudentData       — no activity yet (post-onboarding)
 *   earlyStudentData     — a few sessions completed
 *   establishedStudentData — meaningful performance data
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type DashboardState = "new" | "early" | "established";

export type StudentProfile = {
  /** Preferred first name for greeting. */
  preferredName: string;
  /** Programme the student is preparing for. */
  programme: string;
  /** UTME subjects selected during onboarding. */
  subjects: string[];
};

export type PrepMetrics = {
  questionsAttempted: number;
  /** Accuracy percentage 0–100. null when no attempts yet. */
  accuracy: number | null;
  /** Total study time in minutes. */
  studyMinutes: number;
  sessionsCompleted: number;
};

export type SubjectStat = {
  subject: string;
  /** Accuracy percentage 0–100. */
  accuracy: number;
  questionsAttempted: number;
};

export type ActivityDay = {
  /** ISO date YYYY-MM-DD. */
  date: string;
  active: boolean;
};

/**
 * An in-progress session the student can resume.
 * null when no unfinished session exists.
 */
export type ContinueSession = {
  subject: string;
  topic: string;
  questionsRemaining: number;
  progressPercent: number;
} | null;

/**
 * A topic area to prioritise, derived from performance data.
 * null when there is insufficient data.
 */
export type FocusArea = {
  subject: string;
  /** Accuracy percentage surfacing this area. */
  accuracy: number;
  suggestedTopic: string;
} | null;

export type MockDashboardData = {
  state: DashboardState;
  profile: StudentProfile;
  metrics: PrepMetrics;
  /** Populated when state is "early" or "established". */
  subjectStats: SubjectStat[];
  streakDays: number;
  /** Last 7 days of activity, oldest first. */
  recentActivity: ActivityDay[];
  continueSession: ContinueSession;
  focusArea: FocusArea;
};

// ─── New student ────────────────────────────────────────────────────────────

export const newStudentData: MockDashboardData = {
  state: "new",
  profile: {
    preferredName: "Gab",
    programme: "Computer Science",
    subjects: ["Use of English", "Mathematics", "Physics", "Chemistry"],
  },
  metrics: {
    questionsAttempted: 0,
    accuracy: null,
    studyMinutes: 0,
    sessionsCompleted: 0,
  },
  subjectStats: [],
  streakDays: 0,
  recentActivity: [
    { date: "2026-08-24", active: false },
    { date: "2026-08-25", active: false },
    { date: "2026-08-26", active: false },
    { date: "2026-08-27", active: false },
    { date: "2026-08-28", active: false },
    { date: "2026-08-29", active: false },
    { date: "2026-08-30", active: false },
  ],
  continueSession: null,
  focusArea: null,
};

// ─── Early student ──────────────────────────────────────────────────────────

export const earlyStudentData: MockDashboardData = {
  state: "early",
  profile: {
    preferredName: "Gab",
    programme: "Computer Science",
    subjects: ["Use of English", "Mathematics", "Physics", "Chemistry"],
  },
  metrics: {
    questionsAttempted: 47,
    accuracy: 63,
    studyMinutes: 62,
    sessionsCompleted: 3,
  },
  subjectStats: [
    { subject: "Use of English", accuracy: 71, questionsAttempted: 18 },
    { subject: "Mathematics", accuracy: 58, questionsAttempted: 16 },
    { subject: "Physics", accuracy: 67, questionsAttempted: 13 },
  ],
  streakDays: 3,
  recentActivity: [
    { date: "2026-08-24", active: false },
    { date: "2026-08-25", active: false },
    { date: "2026-08-26", active: false },
    { date: "2026-08-27", active: false },
    { date: "2026-08-28", active: true },
    { date: "2026-08-29", active: true },
    { date: "2026-08-30", active: true },
  ],
  continueSession: {
    subject: "Mathematics",
    topic: "Algebra & Equations",
    questionsRemaining: 9,
    progressPercent: 55,
  },
  focusArea: {
    subject: "Mathematics",
    accuracy: 58,
    suggestedTopic: "Algebra & Equations",
  },
};

// ─── Established student ────────────────────────────────────────────────────

export const establishedStudentData: MockDashboardData = {
  state: "established",
  profile: {
    preferredName: "Gab",
    programme: "Computer Science",
    subjects: ["Use of English", "Mathematics", "Physics", "Chemistry"],
  },
  metrics: {
    questionsAttempted: 347,
    accuracy: 68,
    studyMinutes: 412,
    sessionsCompleted: 23,
  },
  subjectStats: [
    { subject: "Use of English", accuracy: 72, questionsAttempted: 98 },
    { subject: "Mathematics", accuracy: 61, questionsAttempted: 87 },
    { subject: "Physics", accuracy: 78, questionsAttempted: 104 },
    { subject: "Chemistry", accuracy: 54, questionsAttempted: 58 },
  ],
  streakDays: 6,
  recentActivity: [
    { date: "2026-08-24", active: true },
    { date: "2026-08-25", active: false },
    { date: "2026-08-26", active: true },
    { date: "2026-08-27", active: true },
    { date: "2026-08-28", active: true },
    { date: "2026-08-29", active: true },
    { date: "2026-08-30", active: true },
  ],
  continueSession: {
    subject: "Chemistry",
    topic: "Organic Chemistry",
    questionsRemaining: 12,
    progressPercent: 53,
  },
  focusArea: {
    subject: "Chemistry",
    accuracy: 54,
    suggestedTopic: "Organic Chemistry",
  },
};

// ─── Active mock ─────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_DATA: MockDashboardData = establishedStudentData;

