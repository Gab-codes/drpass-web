import * as React from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import {
  getAdminQuestion,
  questionKeys,
  updateQuestion,
  activateQuestion,
  deactivateQuestion,
} from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionForm } from "@/components/admin/questions/QuestionForm";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  questionFormSchema,
  type QuestionFormInput,
  type QuestionFormValues,
} from "@/validation/questions";

export default function EditQuestion() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = React.useState("");

  const {
    data: question,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: questionKeys.adminDetail(questionId!),
    queryFn: () => getAdminQuestion(questionId!),
    enabled: !!questionId,
  });

  const {
    register,
    reset,
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

  React.useEffect(() => {
    if (!question) return;
    reset({
      year: question.year,
      subject: question.subject,
      text: question.text,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
    });
  }, [question, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: QuestionFormValues) =>
      updateQuestion({ id: questionId ?? "", input: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
      navigate("/admin/questions");
    },
    onError: (mutationError) => {
      setErrorMsg(
        getApiErrorMessage(mutationError, "Unable to update question."),
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (isActive) return activateQuestion(questionId ?? "");
      return deactivateQuestion(questionId ?? "");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    },
    onError: (mutationError) => {
      setErrorMsg(
        getApiErrorMessage(mutationError, "Unable to change active state."),
      );
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
        render={<Link to="/admin/questions" />}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
        Questions
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Edit Question</h1>
          <p className="text-sm text-muted-foreground">
            Update editable question fields. Review status and activity are
            managed separately.
          </p>
        </div>
        {question && (
          <div className="flex gap-2">
            <Badge variant="secondary">{question.status}</Badge>
            <Badge variant={question.isActive ? "default" : "outline"}>
              {question.isActive ? "active" : "inactive"}
            </Badge>
          </div>
        )}
      </div>

      <Separator className="my-2" />

      {(errorMsg || isError) && (
        <Alert variant="destructive" className="mb-3">
          {errorMsg ||
            getApiErrorMessage(error, "Unable to load question details.")}
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading question...</p>
      ) : !question ? (
        <p className="text-sm text-muted-foreground">
          Question <span className="font-mono">{questionId}</span> was not
          found.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="active-mode"
              checked={question.isActive}
              onCheckedChange={(checked) => {
                setErrorMsg("");
                toggleMutation.mutate(checked);
              }}
              disabled={
                question.status !== "approved" || toggleMutation.isPending
              }
            />
            <Label htmlFor="active-mode" className="flex flex-col">
              <span>Active State</span>
              <span className="font-normal text-muted-foreground text-xs">
                {question.status !== "approved"
                  ? "Only approved questions can be activated"
                  : "Turn on to make this question available in exams"}
              </span>
            </Label>
          </div>

          <QuestionForm
            register={register}
            errors={errors}
            isPending={isPending}
            submitLabel="Save Changes"
            onSubmit={handleSubmit(onSubmit)}
          />
        </div>
      )}
    </>
  );
}
