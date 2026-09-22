import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

import { MockExamOverview } from "@/components/mock-exam/mock-exam-overview";
import { MockExamRecentAttempts } from "@/components/mock-exam/mock-exam-recent-attempts";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import {
  MOCK_EXAM_ALLOCATION_MESSAGES,
  buildMockExamAllocation,
} from "@/lib/mock-exam";

// ─── Constants ────────────────────────────────────────────────────────────────

const DASHBOARD_PATH = "/dashboard";

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * Mock Exam overview route.
 *
 * Informational/confirmation entry point: shows the fixed JAMB UTME format,
 * the student's actual subjects and allocation, and the duration. Performs
 * no exam-side requests — the only fetch is the lightweight attempt-history
 * summary; the 180-question preparation begins only on the prepare screen,
 * after the student explicitly continues.
 *
 * The allocation comes from the shared `buildMockExamAllocation()` domain
 * rule, so this screen and the prepare screen can never disagree about the
 * subject/question distribution.
 */
export default function MockExamOverviewPage() {
  const navigate = useNavigate();

  // The student layout resolves the user and guards onboarding.
  const { user } = useUser();

  if (!user) return null;

  const handleStart = () => navigate("/mock-exam/prepare");
  const handleBack = () => navigate(DASHBOARD_PATH);

  const allocation = buildMockExamAllocation(
    user.subjects.map((subject) => subject.code),
  );

  // Invalid combination: explain, and provide a way back. Never invent an
  // allocation, and never begin preparation in this state.
  if (!allocation.ok) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">
            Mock Exam
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Test yourself under JAMB UTME-style exam conditions.
          </p>
        </header>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning"
            aria-hidden="true"
          >
            <HugeiconsIcon icon={InformationCircleIcon} className="size-6" />
          </div>
          <h2 className="text-lg font-medium text-foreground tracking-tight">
            Your subjects don't match the Mock Exam format.
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground" role="alert">
            {MOCK_EXAM_ALLOCATION_MESSAGES[allocation.reason]}
          </p>
          <Button variant="ghost" size="lg" onClick={handleBack}>
            Back to Dashboard
          </Button>
        </div>

        <MockExamRecentAttempts />
      </div>
    );
  }

  // Display rows: shared allocation joined with the canonical subject names.
  const subjects = allocation.subjects.map((subject) => ({
    name:
      user.subjects.find((u) => u.code === subject.subjectCode)?.name ??
      subject.subjectCode,
    questionCount: subject.questionCount,
  }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <MockExamOverview
        subjects={subjects}
        onStart={handleStart}
        onBack={handleBack}
      />
      <MockExamRecentAttempts />
    </div>
  );
}
