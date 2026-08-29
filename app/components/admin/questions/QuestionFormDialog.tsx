import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { QuestionForm } from "./QuestionForm";
import { questionFormSchema, type QuestionFormInput } from "@/validation/questions";
import { createQuestion, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";

export function QuestionFormDialog({
  defaultSubject,
  open,
  onOpenChange,
}: {
  defaultSubject?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      subject: defaultSubject || "",
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setErrorMsg("");
      reset({
        year: new Date().getFullYear(),
        subject: defaultSubject || "",
        text: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A",
      });
    }
  }, [open, defaultSubject, reset]);

  const mutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: QuestionFormInput) => {
    setErrorMsg("");
    toast.promise(mutation.mutateAsync(data), {
      loading: "Creating question...",
      success: "Question created successfully",
      error: (error) => {
        const msg = getApiErrorMessage(error, "Failed to create question");
        setErrorMsg(msg);
        return msg;
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New Question</DialogTitle>
          <DialogDescription>
            Create a new question entry. Pending questions must be approved before they can be activated.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            {errorMsg}
          </Alert>
        )}

        <QuestionForm
          register={register}
          errors={errors}
          isPending={mutation.isPending}
          submitLabel="Create Question"
          onSubmit={handleSubmit(onSubmit)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
