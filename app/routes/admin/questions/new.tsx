import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { createQuestion, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QuestionForm } from "@/components/admin/questions/QuestionForm";
import { Separator } from "@/components/ui/separator";
import {
  questionFormSchema,
  type QuestionFormInput,
  type QuestionFormValues,
} from "@/validation/questions";

export default function NewQuestion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      subject: "",
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createQuestion,
    onSuccess: (question) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
      navigate(`/admin/questions/${question.id}/edit`);
    },
    onError: (error) => {
      setErrorMsg(getApiErrorMessage(error, "Unable to create question."));
    },
  });

  function onSubmit(values: QuestionFormValues) {
    setErrorMsg("");
    mutate(values);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-1"
        onClick={() => navigate(-1)}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
        Questions
      </Button>

      <div>
        <h1 className="text-lg font-semibold">New Question</h1>
        <p className="text-sm text-muted-foreground">
          Create a pending, inactive question for review.
        </p>
      </div>

      <Separator className="my-2" />

      {errorMsg && (
        <Alert variant="destructive" className="mb-3">
          {errorMsg}
        </Alert>
      )}

      <QuestionForm
        register={register}
        errors={errors}
        isPending={isPending}
        submitLabel="Create Question"
        onSubmit={handleSubmit(onSubmit)}
      />
    </>
  );
}
