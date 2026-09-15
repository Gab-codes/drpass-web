import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Tag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Page chrome for the classification job route: back link, title and job id.
 * Extracted so the route file stays focused on data/state orchestration.
 */
export function JobPageHeader({
  jobId,
  subject,
}: {
  jobId: string;
  subject?: string | null;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/admin/questions/classification" />}
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
          Classification
        </Button>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
          <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">
            {subject ? `${subject} — Classification Job` : "Classification Job"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
            {jobId}
          </p>
        </div>
      </div>

      <Separator />
    </>
  );
}