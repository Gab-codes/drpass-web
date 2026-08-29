import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  PlayIcon,
  PauseIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

type ActionType = "approve" | "reject" | "activate" | "deactivate";

interface BulkActionBarProps {
  count: number;
  isBusy: boolean;
  onBulk: (action: ActionType) => void;
}

export function BulkActionBar({ count, isBusy, onBulk }: BulkActionBarProps) {
  const label = useMemo(
    () =>
      `${count} question${count > 1 ? "s" : ""} selected`,
    [count],
  );

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
      <span className="text-sm font-medium text-primary">{label}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulk("approve")}
          disabled={isBusy}
        >
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            className="mr-1 h-4 w-4"
          />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulk("reject")}
          disabled={isBusy}
          className="text-destructive hover:text-destructive"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="mr-1 h-4 w-4" />
          Reject
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulk("activate")}
          disabled={isBusy}
        >
          <HugeiconsIcon icon={PlayIcon} className="mr-1 h-4 w-4" />
          Activate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulk("deactivate")}
          disabled={isBusy}
        >
          <HugeiconsIcon icon={PauseIcon} className="mr-1 h-4 w-4" />
          Deactivate
        </Button>
      </div>
    </div>
  );
}
