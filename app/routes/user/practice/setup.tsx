import { useNavigate } from "react-router";

import { PracticeConfigurator } from "@/components/practice/setup/practice-configurator";
import { useUser } from "@/hooks/use-user";
import type { PracticeConfiguration, PracticeSessionStart } from "@/types/practice";

/** Where the student is returned to when they leave or finish the exam. */
const PRACTICE_EXIT_PATH = "/practice";

/**
 * Practice setup route.
 *
 * A thin orchestration layer: it renders the page header, hands the student's
 * subjects to `PracticeConfigurator`, and navigates to the preparation screen
 * with the finalized configuration. All setup state and UI live in the setup
 * components.
 */
export default function PracticeSetup() {
  const navigate = useNavigate();
  const { user } = useUser();

  // The authenticated/student layouts resolve the user before rendering this
  // route, so the subject list is always available here.
  if (!user) return null;

  const handleStart = (configuration: PracticeConfiguration) => {
    // Build the navigation state with display names resolved from the user's
    // enrolled subjects. The preparation screen needs names for display but
    // PracticeConfiguration only carries codes.
    const state: PracticeSessionStart = {
      totalTimeMinutes: configuration.totalTimeMinutes,
      subjects: configuration.subjects.map((s) => ({
        subjectCode: s.subjectCode,
        questionCount: s.questionCount,
        name:
          user.subjects.find((us) => us.code === s.subjectCode)?.name ??
          s.subjectCode,
      })),
    };

    navigate("/practice/prepare", { state });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">
          Practice Setup
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Choose how many questions to attempt per subject. Your time limit
          follows your question count until you set a time of your own.
        </p>
      </header>

      <PracticeConfigurator subjects={user.subjects} onStart={handleStart} />
    </div>
  );
}