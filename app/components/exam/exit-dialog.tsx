import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExitDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Confirmation guard before abandoning an in-progress practice session.
export function ExitDialog({ open, onClose, onConfirm }: ExitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Leave practice?</DialogTitle>
          <DialogDescription className="mt-1">
            Your current practice session will end. Your answers and progress
            will not be saved.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            autoFocus
            className="w-full sm:w-auto"
          >
            Keep Practicing
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Leave Practice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
