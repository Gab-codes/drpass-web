import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/store/exam-store";

interface SubmitDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SubmitDialog({ open, onClose, onConfirm }: SubmitDialogProps) {
  const { questions, answers } = useExamStore();

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Submit practice?</DialogTitle>
          <DialogDescription className="mt-1">
            {unansweredCount > 0 ? (
              <>
                You still have{" "}
                <strong className="text-foreground font-medium">
                  {unansweredCount}{" "}
                  {unansweredCount === 1 ? "question" : "questions"}
                </strong>{" "}
                unanswered. Are you sure you want to submit?
              </>
            ) : (
              <>
                You have answered all {questions.length} questions. Are you
                ready to submit?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            aria-keyshortcuts="r"
          >
            Return to exam
            <kbd className="ml-2 text-xs text-muted-foreground font-mono opacity-60">
              R
            </kbd>
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto"
            aria-keyshortcuts="y"
          >
            Submit
            <kbd className="ml-2 text-xs text-primary-foreground/60 font-mono">
              Y
            </kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
