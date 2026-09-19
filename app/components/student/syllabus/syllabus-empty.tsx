import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SyllabusEmptyNoSubjects() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border rounded-2xl bg-card shadow-sm px-6 max-w-lg mx-auto mt-8">
      <div className="p-4 rounded-full bg-primary/10 text-primary mb-2">
        <HugeiconsIcon icon={BookOpen01Icon} className="size-8" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        No Subjects Selected
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        We don't know which subjects you are preparing for yet. Update your subject combination to view your syllabus.
      </p>
      <div className="mt-4">
        <Link to="/dashboard/settings/subjects" className={cn(buttonVariants())}>
          Update Subjects
        </Link>
      </div>
    </div>
  );
}

export function SyllabusEmptyNoMatch({ exam }: { exam: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border rounded-2xl bg-card shadow-sm px-6 max-w-lg mx-auto mt-8">
      <div className="p-4 rounded-full bg-accent text-muted-foreground mb-2">
        <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        No Syllabus Content
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        We don't have the {exam} syllabus content for any of your selected subjects yet. Please check back later.
      </p>
    </div>
  );
}
