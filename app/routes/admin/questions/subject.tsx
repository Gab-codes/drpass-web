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
  getAdminSubjects,
  approveAllPendingInSubject,
} from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionFormDialog } from "@/components/questions/QuestionFormDialog";
import { toast } from "sonner";
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
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [approveAllOpen, setApproveAllOpen] = React.useState(false);

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

  const { data: subjectsData } = useQuery({
    queryKey: questionKeys.adminSubjects(),
    queryFn: getAdminSubjects,
  });

  const subjectSummary = subjectsData?.find((s) => s.subject === subject);
  const pendingCount = subjectSummary?.pending ?? 0;

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
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
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
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: (sub: string) => approveAllPendingInSubject(sub),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    }
  });

  const allSelected = questions.length > 0 && selectedIds.size === questions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < questions.length;

  function handleSelectAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  }

  function handleSelect(id: string, checked: boolean) {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  }

  const handleAction = (id: string, action: "approve" | "reject" | "activate" | "deactivate") => {
    setPendingActionId(id);
    
    const messages = {
      approve: { loading: "Approving question...", success: "Question approved", error: "Failed to approve question" },
      reject: { loading: "Rejecting question...", success: "Question rejected", error: "Failed to reject question" },
      activate: { loading: "Activating question...", success: "Question activated", error: "Failed to activate question" },
      deactivate: { loading: "Deactivating question...", success: "Question deactivated", error: "Failed to deactivate question" },
    };

    toast.promise(lifecycleMutation.mutateAsync({ id, action }), {
      loading: messages[action].loading,
      success: messages[action].success,
      error: (err) => getApiErrorMessage(err, messages[action].error),
      finally: () => setPendingActionId(null),
    });
  };

  const handleBulk = (action: "approve" | "reject" | "activate" | "deactivate") => {
    const messages = {
      approve: { loading: `Approving ${selectedIds.size} questions...`, success: `${selectedIds.size} questions approved`, error: "Failed to approve questions" },
      reject: { loading: `Rejecting ${selectedIds.size} questions...`, success: `${selectedIds.size} questions rejected`, error: "Failed to reject questions" },
      activate: { loading: `Activating ${selectedIds.size} questions...`, success: `${selectedIds.size} questions activated`, error: "Failed to activate questions" },
      deactivate: { loading: `Deactivating ${selectedIds.size} questions...`, success: `${selectedIds.size} questions deactivated`, error: "Failed to deactivate questions" },
    };

    toast.promise(bulkMutation.mutateAsync({ action }), {
      loading: messages[action].loading,
      success: messages[action].success,
      error: (err) => getApiErrorMessage(err, messages[action].error),
    });
  };

  const handleApproveAll = () => {
    if (!subject) return;
    toast.promise(approveAllMutation.mutateAsync(subject), {
      loading: `Approving all pending ${subject} questions...`,
      success: (data) => `${data.affected} questions approved`,
      error: (err) => getApiErrorMessage(err, "Failed to approve pending questions"),
      finally: () => setApproveAllOpen(false),
    });
  };

  const isBulkBusy = bulkMutation.isPending;

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
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Dialog open={approveAllOpen} onOpenChange={setApproveAllOpen}>
              <Button size="sm" variant="secondary" onClick={() => setApproveAllOpen(true)}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 h-4 w-4" />
                Approve all pending ({pendingCount})
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve All Pending</DialogTitle>
                  <DialogDescription>
                    Approve all {pendingCount} pending {subject} questions? This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApproveAllOpen(false)} disabled={approveAllMutation.isPending}>Cancel</Button>
                  <Button onClick={handleApproveAll} disabled={approveAllMutation.isPending}>
                    {approveAllMutation.isPending ? "Approving..." : "Approve All"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
            New Question
          </Button>
        </div>
      </div>

      <QuestionFormDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        defaultSubject={subject} 
      />

      <Separator className="my-2" />

      {isError && (
        <Alert variant="destructive" className="mb-3">
          {getApiErrorMessage(error, "Unable to load admin questions.")}
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
              disabled={isBulkBusy}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("reject")}
              disabled={isBulkBusy}
              className="text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("activate")}
              disabled={isBulkBusy}
            >
              <HugeiconsIcon icon={PlayIcon} className="mr-1 h-4 w-4" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk("deactivate")}
              disabled={isBulkBusy}
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
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as AdminQuestionStatus | "all")}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-1">
            <Select
              value={activeFilter}
              onValueChange={(val) => { if (val) setActiveFilter(val) }}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="All activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activity</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {activeFilter === "true" && (
          <p className="w-full text-xs text-muted-foreground mt-1">
            Note: Deactivated questions will immediately leave this view.
          </p>
        )}
        
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
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onCheckedChange={(c) => handleSelectAll(c as boolean)}
                  disabled={questions.length === 0}
                  aria-label="Select page"
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
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-3 py-3 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : questions.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  <p>No questions match the current filters.</p>
                  <Button variant="link" onClick={() => { setStatusFilter("all"); setActiveFilter("all"); setSearch(""); }} className="mt-2 h-auto p-0">Clear filters</Button>
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  selected={selectedIds.has(question.id)}
                  onSelect={(c) => handleSelect(question.id, c as boolean)}
                  busy={pendingActionId === question.id}
                  onAction={(action) => handleAction(question.id, action)}
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
  onSelect: (checked: boolean) => void;
  busy: boolean;
  onAction: (action: "approve" | "reject" | "activate" | "deactivate") => void;
}) {
  return (
    <tr className={`hover:bg-muted/30 ${selected ? "bg-muted/20" : ""}`}>
      <td className="px-3 py-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label="Select row"
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
