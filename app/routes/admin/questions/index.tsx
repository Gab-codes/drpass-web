import * as React from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, AlertCircleIcon, Folder01Icon } from "@hugeicons/core-free-icons";

import { getAdminSubjects, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function SubjectsList() {
  const { data: subjects = [], isLoading, isError, error } = useQuery({
    queryKey: questionKeys.adminSubjects(),
    queryFn: getAdminSubjects,
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Questions</h1>
          <p className="text-sm text-muted-foreground">
            Select a subject to review and manage its question bank.
          </p>
        </div>
        <Button size="sm" render={<Link to="/admin/questions/new" />}>
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          New Question
        </Button>
      </div>

      <Separator className="my-4" />

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
          {getApiErrorMessage(error, "Unable to load subjects.")}
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions found in the database.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <Link
              key={sub.subject}
              to={`/admin/questions/${encodeURIComponent(sub.subject)}`}
              className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <HugeiconsIcon icon={Folder01Icon} className="h-4 w-4" />
                  </div>
                  <h2 className="font-semibold">{sub.subject}</h2>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {sub.total}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {sub.approved} approved
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {sub.pending} pending
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {sub.rejected} rejected
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
