import * as React from "react";
import { Link } from "react-router";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionFormInput } from "@/validation/questions";

export function QuestionForm({
  register,
  errors,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  register: UseFormRegister<QuestionFormInput>;
  errors: FieldErrors<QuestionFormInput>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onCancel?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            min={1970}
            max={2100}
            {...register("year", { valueAsNumber: true })}
          />
          {errors.year && (
            <p className="text-sm text-destructive">{errors.year.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="e.g. Chemistry"
            {...register("subject")}
          />
          {errors.subject && (
            <p className="text-sm text-destructive">{errors.subject.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="text">Question Text</Label>
        <Textarea id="text" rows={4} {...register("text")} />
        {errors.text && (
          <p className="text-sm text-destructive">{errors.text.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["A", "B", "C", "D"] as const).map((key) => {
          const field = `option${key}` as const;
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={field}>Option {key}</Label>
              <Input id={field} {...register(field)} />
              {errors[field] && (
                <p className="text-sm text-destructive">
                  {errors[field]?.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="correctAnswer">Correct Answer</Label>
        <select
          id="correctAnswer"
          {...register("correctAnswer")}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
        {errors.correctAnswer && (
          <p className="text-sm text-destructive">
            {errors.correctAnswer.message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button variant="outline" render={<Link to="/admin/questions" />}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
