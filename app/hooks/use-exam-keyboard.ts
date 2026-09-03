import { useEffect } from "react";

interface ExamKeyboardHandlers {
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmitStart: () => void;
  onSubmitConfirm: () => void;
  onSubmitCancel: () => void;
  isSubmitDialogOpen: boolean;
  /** While the exit-confirmation dialog is open, suppress all shortcuts. */
  isExitDialogOpen?: boolean;
  options: { label: string; id: string }[];
}

export function useExamKeyboard({
  onSelectOption,
  onNext,
  onPrev,
  onSubmitStart,
  onSubmitConfirm,
  onSubmitCancel,
  isSubmitDialogOpen,
  isExitDialogOpen,
  options,
}: ExamKeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Exit dialog handles its own keyboard interaction (Esc via the dialog)
      if (isExitDialogOpen) {
        return;
      }

      const key = e.key.toUpperCase();

      if (isSubmitDialogOpen) {
        if (key === "Y") {
          e.preventDefault();
          onSubmitConfirm();
        } else if (key === "R") {
          e.preventDefault();
          onSubmitCancel();
        }
        // Don't handle other shortcuts while dialog is open
        return;
      }

      switch (key) {
        case "A":
        case "B":
        case "C":
        case "D":
          const option = options.find((opt) => opt.label === key);
          if (option) {
            e.preventDefault();
            onSelectOption(option.id);
          }
          break;
        case "P":
          e.preventDefault();
          onPrev();
          break;
        case "N":
          e.preventDefault();
          onNext();
          break;
        case "S":
          e.preventDefault();
          onSubmitStart();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onSelectOption,
    onNext,
    onPrev,
    onSubmitStart,
    onSubmitConfirm,
    onSubmitCancel,
    isSubmitDialogOpen,
    isExitDialogOpen,
    options,
  ]);
}
