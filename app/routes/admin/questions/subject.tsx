import * as React from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CheckmarkCircle01Icon,
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
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionFormDialog } from "@/components/admin/questions/QuestionFormDialog";
import { QuestionRow } from "@/components/admin/questions/QuestionRow";
import { BulkActionBar } from "@/components/admin/questions/BulkActionBar";
import { QuestionFilters } from "@/components/admin/questions/QuestionFilters";
import { toast } from "sonner";
import type { AdminQuestionStatus } from "@/types/questions";

export default function SubjectQuestions() {
  const { subject } = useParams<{ subject: string }>();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = React.useState<
    AdminQuestionStatus | "all"
  >("all");
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(
    null,
  );
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: questionKeys.adminList(filters),
    queryFn: () => getAdminQuestions(filters),
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;

  React.useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, activeFilter, search]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const lifecycleMutation = useMutation({
    mutationFn: ({
      action,
      id,
    }: {
      action: "approve" | "reject" | "activate" | "deactivate";
      id: string;
    }) => {
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
    mutationFn: ({
      action,
    }: {
      action: "approve" | "reject" | "activate" | "deactivate";
    }) => {
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
    },
  });

  const allSelected =
    questions.length > 0 && selectedIds.size === questions.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < questions.length;

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

  const handleAction = (
    id: string,
    action: "approve" | "reject" | "activate" | "deactivate",
  ) => {
    setPendingActionId(id);

    const messages = {
      approve: {
        loading: "Approving question...",
        success: "Question approved",
        error: "Failed to approve question",
      },
      reject: {
        loading: "Rejecting question...",
        success: "Question rejected",
        error: "Failed to reject question",
      },
      activate: {
        loading: "Activating question...",
        success: "Question activated",
        error: "Failed to activate question",
      },
      deactivate: {
        loading: "Deactivating question...",
        success: "Question deactivated",
        error: "Failed to deactivate question",
      },
    };

    toast.promise(lifecycleMutation.mutateAsync({ id, action }), {
      loading: messages[action].loading,
      success: messages[action].success,
      error: (err) => getApiErrorMessage(err, messages[action].error),
      finally: () => setPendingActionId(null),
    });
  };

  const handleBulk = (
    action: "approve" | "reject" | "activate" | "deactivate",
  ) => {
    const messages = {
      approve: {
        loading: `Approving ${selectedIds.size} questions...`,
        success: `${selectedIds.size} questions approved`,
        error: "Failed to approve questions",
      },
      reject: {
        loading: `Rejecting ${selectedIds.size} questions...`,
        success: `${selectedIds.size} questions rejected`,
        error: "Failed to reject questions",
      },
      activate: {
        loading: `Activating ${selectedIds.size} questions...`,
        success: `${selectedIds.size} questions activated`,
        error: "Failed to activate questions",
      },
      deactivate: {
        loading: `Deactivating ${selectedIds.size} questions...`,
        success: `${selectedIds.size} questions deactivated`,
        error: "Failed to deactivate questions",
      },
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
      error: (err) =>
        getApiErrorMessage(err, "Failed to approve pending questions"),
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setApproveAllOpen(true)}
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="mr-1 h-4 w-4"
                />
                Approve all pending ({pendingCount})
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve All Pending</DialogTitle>
                  <DialogDescription>
                    Approve all {pendingCount} pending {subject} questions? This
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setApproveAllOpen(false)}
                    disabled={approveAllMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApproveAll}
                    disabled={approveAllMutation.isPending}
                  >
                    {approveAllMutation.isPending
                      ? "Approving..."
                      : "Approve All"}
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
        <BulkActionBar
          count={selectedIds.size}
          isBusy={isBulkBusy}
          onBulk={handleBulk}
        />
      )}

      <QuestionFilters
        search={search}
        statusFilter={statusFilter}
        activeFilter={activeFilter}
        page={page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total ?? 0}
        isLoading={isLoading}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onActiveChange={setActiveFilter}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() =>
          setPage((p) => Math.min(meta?.totalPages ?? 1, p + 1))
        }
      />

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
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-62.5" />
                      <Skeleton className="h-3 w-25" />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : questions.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  <p>No questions match the current filters.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setStatusFilter("all");
                      setActiveFilter("all");
                      setSearch("");
                    }}
                    className="mt-2 h-auto p-0"
                  >
                    Clear filters
                  </Button>
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
