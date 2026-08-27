import * as React from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  PauseIcon,
  PlayIcon,
  ViewIcon,
  Cancel01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";

import {
  activateQuestion,
  approveQuestion,
  deactivateQuestion,
  getAdminQuestions,
  bulkAdminQuestionsAction,
  questionKeys,
  rejectQuestion,
} from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { AdminQuestion, AdminQuestionStatus } from "@/types/questions";

const STATUS_OPTIONS: Array<AdminQuestionStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
];

function statusVariant(status: AdminQuestionStatus) {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(text: string) {
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

export default function SubjectQuestions() {
  const { subject } = useParams<{ subject: string }>();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = React.useState<AdminQuestionStatus | "all">("all");
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = React.useState("");

  const filters = React.useMemo(
    () => ({
      subject,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(activeFilter !== "all" ? { isActive: activeFilter === "true" } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      page,
      pageSize,
    }),
    [subject, activeFilter, statusFilter, search, page, pageSize],
  );

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: questionKeys.adminList(filters),
    queryFn: () => getAdminQuestions(filters),
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;

  // Reset page and selection when filters change
  React.useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, activeFilter, search]);
  
  // Clear selection when page changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const lifecycleMutation = useMutation({
    mutationFn: ({ action, id }: { action: "approve" | "reject" | "activate" | "deactivate"; id: string }) => {
      if (action === "approve") return approveQuestion(id);
      if (action === "reject") return rejectQuestion(id);
      if (action === "activate") return activateQuestion(id);
      return deactivateQuestion(id);
    },
    onSuccess: () => {
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    },
    onError: (mutationError) => {
      setErrorMsg(getApiErrorMessage(mutationError, "Unable to update question state."));
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action }: { action: "approve" | "reject" | "activate" | "deactivate" }) => {
      return bulkAdminQuestionsAction({
        questionIds: Array.from(selectedIds),
        action,
      });
    },
    onSuccess: () => {
      setErrorMsg("");
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    },
    onError: (mutationError) => {
      setErrorMsg(getApiErrorMessage(mutationError, "Unable to perform bulk action. Please check if your selection mixes valid and invalid statuses for this action."));
    },
  });

  const allSelected = questions.length > 0 && selectedIds.size === questions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < questions.length;

  function handleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  }

  function handleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  const handleBulk = (action: "approve" | "reject" | "activate" | "deactivate") => {
    bulkMutation.mutate({ action });
  };

  const isBusy = lifecycleMutation.isPending || bulkMutation.isPending;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-1"
        render={<Link to="/admin/questions" />}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" />
        All Subjects
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{subject} Questions</h1>
          <p className="text-sm text-muted-foreground">
            Review, approve, and manage {subject} question entries.
          </p>
        </div>
        <Button size="sm" render={<Link to="/admin/questions/new" />}>
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          New Question
        </Button>
      </div>

      <Separator className="my-2" />

      {(errorMsg || isError) && (
        <Alert variant="destructive" className="mb-3">
          {errorMsg ||
            getApiErrorMessage(error, "Unable to load admin questions.")}
        </Alert>
      )}

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} question{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("approve")}
              disabled={isBusy}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("reject")}
              disabled={isBusy}
              className="text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("activate")}
              disabled={isBusy}
            >
              <HugeiconsIcon icon={PlayIcon} className="mr-1 h-4 w-4" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("deactivate")}
              disabled={isBusy}
            >
              <HugeiconsIcon icon={PauseIcon} className="mr-1 h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions..."
            aria-label="Search questions"
            className="h-8 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AdminQuestionStatus | "all")
            }
            aria-label="Filter by review status"
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
            aria-label="Filter by active state"
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All activity</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  disabled={questions.length === 0}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Question
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Year
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Active
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Created
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  Loading questions...
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  No questions match the current filters.
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  selected={selectedIds.has(question.id)}
                  onSelect={() => handleSelect(question.id)}
                  busy={isBusy}
                  onAction={(action) =>
                    lifecycleMutation.mutate({ id: question.id, action })
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function QuestionRow({
  question,
  selected,
  onSelect,
  busy,
  onAction,
}: {
  question: AdminQuestion;
  selected: boolean;
  onSelect: () => void;
  busy: boolean;
  onAction: (action: "approve" | "reject" | "activate" | "deactivate") => void;
}) {
  return (
    <tr className={`hover:bg-muted/30 ${selected ? "bg-muted/20" : ""}`}>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      <td className="max-w-[34rem] px-3 py-2">
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
            <HugeiconsIcon
              icon={question.status === "pending" ? ViewIcon : Edit01Icon}
            />
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
