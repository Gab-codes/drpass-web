import { useNavigate } from "react-router";

import { PracticeConfigurator } from "@/components/practice/setup/practice-configurator";
import { generateMockExam, type ExamConfig } from "@/data/mock-exam";
import { useUser } from "@/hooks/use-user";
import { useExamStore } from "@/store/exam-store";
import type { PracticeConfiguration } from "@/types/practice";

/** Where the student is returned to when they leave or finish the exam. */
const PRACTICE_EXIT_PATH = "/practice";

/**
 * Practice setup route.
 *
 * A thin orchestration layer: it renders the page header, hands the student's
 * subjects to `PracticeConfigurator`, and turns the finished configuration into
 * the mock exam session. All setup state and UI live in the setup components.
 */
export default function PracticeSetup() {
  const navigate = useNavigate();
  const setupExam = useExamStore((state) => state.setupExam);
  const { user } = useUser();

  // The authenticated/student layouts resolve the user before rendering this
  // route, so the subject list is always available here.
  if (!user) return null;

  const handleStart = (configuration: PracticeConfiguration) => {
    // Local mock flow. When the Practice API exists this is where the
    // configuration would be submitted instead of generating questions locally.
    const examConfig: ExamConfig = {
      ...configuration,
      exitPath: PRACTICE_EXIT_PATH,
    };

    setupExam(examConfig, generateMockExam(examConfig));
    navigate("/practice/exam");
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