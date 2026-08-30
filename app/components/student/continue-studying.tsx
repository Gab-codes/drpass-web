import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  PlayIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import type {
  ContinueSession,
  DashboardState,
  StudentProfile,
} from "@/data/student-dashboard-mock";

interface ContinueStudyingProps {
  session: ContinueSession;
  state: DashboardState;
  profile: StudentProfile;
}

export function ContinueStudying({
  session,
  state,
  profile,
}: ContinueStudyingProps) {
  // ── New student: guide toward first session ──────────────────────────────
  if (state === "new" || !session) {
    return (
      <section aria-labelledby="next-action-heading">
        <div className="rounded-2xl bg-card ring-1 ring-foreground/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon
                icon={BookOpen01Icon}
                className="size-5 text-primary"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="next-action-heading"
                className="text-base font-medium text-foreground"
              >
                Start your first session
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {state === "new"
                  ? `Pick a subject from your ${profile.subjects.length} UTME subjects and work through a set of practice questions.`
                  : "No session in progress. Start a new practice session."}
              </p>
              <div className="mt-4">
                <Button size="sm" className="gap-1.5" disabled>
                  <HugeiconsIcon icon={PlayIcon} className="size-4" />
                  Start practising
                  <span className="sr-only">
                    (Practice sessions coming soon)
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Active session: resume prompt ────────────────────────────────────────
  return (
    <section aria-labelledby="continue-heading">
      <div className="rounded-2xl bg-card ring-1 ring-foreground/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <HugeiconsIcon icon={PlayIcon} className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Continue where you left off
            </p>
            <h2
              id="continue-heading"
              className="text-base font-medium text-foreground"
            >
              {session.topic}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {session.subject} &middot; {session.questionsRemaining} questions
              remaining
            </p>

            {/* Progress bar */}
            <div className="mt-4 space-y-1.5">
              <Progress
                value={session.progressPercent}
                aria-label={`${session.progressPercent}% complete`}
                className="gap-0"
              >
                <ProgressTrack className="h-1.5">
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
              <p className="text-xs text-muted-foreground">
                {session.progressPercent}% complete
              </p>
            </div>

            <div className="mt-4">
              <Button size="sm" className="gap-1.5" disabled>
                Resume session
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

