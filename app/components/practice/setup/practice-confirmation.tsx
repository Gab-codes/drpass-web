import { useState, type ReactElement } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { PracticeSummaryData } from "@/types/practice";
import { PracticeConfirmationContent } from "./practice-confirmation-content";

interface PracticeConfirmationProps {
  /** Desktop confirms in a Dialog, mobile in a Drawer. */
  variant: "dialog" | "drawer";
  /** The button that opens the confirmation. */
  trigger: ReactElement;
  summary: PracticeSummaryData;
  onStart: () => void;
}

const CONFIRMATION_TITLE = "Practice Summary";
const CONFIRMATION_DESCRIPTION =
  "Check the questions and time limit before you begin.";

/**
 * Responsive confirmation wrapper. Each variant is rendered by the summary it
 * belongs to and shown through CSS breakpoints, so no viewport detection is
 * needed. Both variants render the same `PracticeConfirmationContent`.
 */
export function PracticeConfirmation({
  variant,
  trigger,
  summary,
  onStart,
}: PracticeConfirmationProps) {
  const [open, setOpen] = useState(false);

  const content = (
    <PracticeConfirmationContent
      summary={summary}
      onEdit={() => setOpen(false)}
      onStart={onStart}
    />
  );

  if (variant === "drawer") {
    return (
      <Drawer
        open={open}
        onOpenChange={(isOpen) => setOpen(isOpen)}
        swipeDirection="down"
      >
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{CONFIRMATION_TITLE}</DrawerTitle>
            <DrawerDescription>{CONFIRMATION_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{CONFIRMATION_TITLE}</DialogTitle>
          <DialogDescription>{CONFIRMATION_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}