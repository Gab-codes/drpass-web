export { default } from "@/routes/practice/exam";

/**
 * Mock Exam route.
 *
 * Reuses the shared exam experience (timer, subject navigation, keyboard
 * controls) verbatim. The session is fully driven by the exam store, which
 * the Mock Exam prepare route seeds with the fixed question set, the
 * 120-minute duration and `mode: "mock"` — so this route needs no logic of
 * its own.
 */
