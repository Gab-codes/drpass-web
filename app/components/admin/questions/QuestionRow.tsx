import { useMemo } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CheckmarkCircle01Icon,
  PauseIcon,
  PlayIcon,
  ViewIcon,
  Edit01Icon,
  AlertCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { truncate, formatDate, statusVariant } from "@/constants/questions";
import type { AdminQuestion } from "@/types/questions";

type ActionType = "approve" | "reject" | "activate" | "deactivate";

interface QuestionRowProps {
  question: AdminQuestion;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  busy: boolean;
  onAction: (action: ActionType) => void;
}

export function QuestionRow({
  question,
  selected,
  onSelect,
  busy,
  onAction,
}: QuestionRowProps) {
  const icon = question.status === "pending" ? ViewIcon : Edit01Icon;

  return (
    <tr className={`hover:bg-muted/30 ${selected ? "bg-muted/20" : ""}`}>
      <td className="px-3 py-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label="Select row"
        />
      </td>
      <td className="max-w-136 px-3 py-2">
        <div className="space-y-0.5">
          <p className="font-medium leading-snug">{truncate(question.text)}</p>
          <p className="text-xs text-muted-foreground">{question.subject}</p>
        </div>
      </td>
      <td className="px-3 py-2 text-xs font-medium tabular-nums">
        {question.year}
      </td>
      <td className="px-3 py-2">
        <Badge variant={statusVariant(question.status)}>
          {question.status}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <Badge variant={question.isActive ? "default" : "outline"}>
          {question.isActive ? "active" : "inactive"}
        </Badge>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {formatDate(question.createdAt)}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            render={<Link to={`/admin/questions/${question.id}/edit`} />}
            aria-label="View and edit question"
            title="View and edit"
          >
            <HugeiconsIcon icon={icon} />
          </Button>
          {question.status !== "approved" && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onAction("approve")}
              disabled={busy}
              aria-label="Approve question"
              title="Approve"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} />
            </Button>
          )}
          {question.status !== "rejected" && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onAction("reject")}
              disabled={busy}
              aria-label="Reject question"
              title="Reject"
              className="text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          )}
          {question.status === "approved" &&
            (question.isActive ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onAction("deactivate")}
                disabled={busy}
                aria-label="Deactivate question"
                title="Deactivate"
              >
                <HugeiconsIcon icon={PauseIcon} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onAction("activate")}
                disabled={busy}
                aria-label="Activate question"
                title="Activate"
              >
                <HugeiconsIcon icon={PlayIcon} />
              </Button>
            ))}
          {question.status !== "approved" && question.status !== "rejected" && (
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="mx-1 h-3.5 w-3.5 text-muted-foreground"
            />
          )}
        </div>
      </td>
    </tr>
  );
}
