import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function SyllabusError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border rounded-2xl bg-destructive/5 shadow-sm px-6 max-w-lg mx-auto mt-8 border-destructive/20">
      <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-2">
        <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-destructive">
        Couldn't load your syllabus
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        There was a problem retrieving your curriculum data. Please try again.
      </p>
      <div className="mt-4">
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
