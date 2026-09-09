import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  buildSummary,
  parseFile,
  revalidateQuestions,
} from "@/lib/import-parser";
import { MOCK_QUESTIONS, MOCK_SUMMARY } from "@/lib/import-mock-data";
import { importQuestions, questionKeys } from "@/api/questions";
import { getApiErrorMessage } from "@/lib/api-error";
import { useImportDraftStore } from "@/store/import-draft-store";
import type {
  ImportFormat,
  ImportStatus,
  ParsedQuestion,
  ParseSummary,
} from "@/types/import-types";
import type { ImportQuestionsResult } from "@/types/questions";
import { applyFilters } from "@/components/admin/imports/ImportFilters";

export function useImportWorkflow() {
  const queryClient = useQueryClient();

  // ── Draft store ───────────────────────────────────────────────────────────
  const draftStore = useImportDraftStore();
  const { saveDraft, hasDraft, clearDraft, ...draft } = draftStore;

  // ── Upload state ──────────────────────────────────────────────────────────
  const [format, setFormat] = React.useState<ImportFormat>("xlsx");
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<ImportStatus>("idle");
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [importResult, setImportResult] =
    React.useState<ImportQuestionsResult | null>(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [questions, setQuestions] = React.useState<ParsedQuestion[]>([]);
  const [summary, setSummary] = React.useState<ParseSummary | null>(null);

  // ── Source state ──────────────────────────────────────────────────────────
  const [detectedSource, setDetectedSource] = React.useState<string | null>(null);
  const [importSource, setImportSource] = React.useState<string | null>(null);

  // ── Draft guard state ─────────────────────────────────────────────────────
  const [showUploadGuard, setShowUploadGuard] = React.useState(false);
  const [draftHandled, setDraftHandled] = React.useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [yearFilter, setYearFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [reviewQuestion, setReviewQuestion] =
    React.useState<ParsedQuestion | null>(null);
  const [editQuestion, setEditQuestion] = React.useState<ParsedQuestion | null>(
    null,
  );
  const [duplicateQuestion, setDuplicateQuestion] =
    React.useState<ParsedQuestion | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredQuestions = React.useMemo(
    () => applyFilters(questions, yearFilter, statusFilter, search),
    [questions, yearFilter, statusFilter, search],
  );

  const activeQuestions = React.useMemo(
    () => questions.filter((q) => q.duplicateResolution !== "remove"),
    [questions],
  );

  const liveSummary = React.useMemo(() => {
    if (!summary) return null;
    return buildSummary(activeQuestions, summary.contextRowCount);
  }, [activeQuestions, summary]);

  const duplicateMatch = React.useMemo(() => {
    if (!duplicateQuestion?.possibleDuplicateOf) return null;
    return (
      questions.find(
        (q) => q._clientId === duplicateQuestion.possibleDuplicateOf,
      ) ?? null
    );
  }, [duplicateQuestion, questions]);

  const keptDuplicates = activeQuestions.filter(
    (q) => q.status === "duplicate" && q.duplicateResolution === "keep",
  ).length;
  const removedCount = questions.filter(
    (q) => q.duplicateResolution === "remove",
  ).length;
  const remainingErrors = liveSummary?.errorCount ?? 0;

  const importMutation = useMutation({
    mutationFn: importQuestions,
    onSuccess: (result) => {
      setSubmitError(null);
      setImportResult(result);
      setStatus("submitted");
      clearDraft();
      queryClient.invalidateQueries({ queryKey: questionKeys.admin() });
    },
    onError: (error) => {
      setSubmitError(
        getApiErrorMessage(error, "Unable to submit questions for import."),
      );
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleFileSelected(f: File | null) {
    setFile(f);
    setParseError(null);
    if (!f) return;
  }

  async function doProcessFile() {
    setStatus("processing");
    setParseError(null);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 200);

    try {
      const result = await parseFile(file!, format);
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      setQuestions(result.questions);
      setSummary(result.summary);
      setDetectedSource(result.detectedSource);
      setImportSource(result.detectedSource);
      setStatus("preview");
    } catch (err) {
      clearInterval(progressInterval);
      setParseError(
        err instanceof Error ? err.message : "Failed to parse file",
      );
      setStatus("error");
    }
  }

  async function handleProcess() {
    if (!file) return;

    if (hasDraft() && !draftHandled) {
      setShowUploadGuard(true);
      return;
    }

    await doProcessFile();
  }

  async function handleUseMockData() {
    setStatus("processing");
    setParseError(null);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 20, 85));
    }, 150);

    await new Promise((r) => setTimeout(r, 900));
    clearInterval(progressInterval);
    setProgress(100);
    await new Promise((r) => setTimeout(r, 200));

    setQuestions(MOCK_QUESTIONS);
    setSummary(MOCK_SUMMARY);
    setDetectedSource("JAMB");
    setImportSource("JAMB");
    setStatus("preview");
  }

  function handleReset() {
    setFile(null);
    setStatus("idle");
    setParseError(null);
    setSubmitError(null);
    setProgress(0);
    setQuestions([]);
    setSummary(null);
    setImportResult(null);
    setDetectedSource(null);
    setImportSource(null);
    setDraftHandled(false);
    setYearFilter("all");
    setStatusFilter("all");
    setSearch("");
  }

  function handleEditQuestion(q: ParsedQuestion) {
    setEditQuestion(q);
  }

  function handleSaveEdit(updated: ParsedQuestion) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) => (q._clientId === updated._clientId ? updated : q)),
      ),
    );
    setEditQuestion(null);
  }

  function handleRemoveQuestion(clientId: string) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) =>
          q._clientId === clientId
            ? { ...q, duplicateResolution: "remove" as const }
            : q,
        ),
      ),
    );
  }

  function handleUndoRemove(clientId: string) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) =>
          q._clientId === clientId
            ? { ...q, duplicateResolution: "keep" as const }
            : q,
        ),
      ),
    );
  }

  function handleKeepDuplicate(clientId: string) {
    setQuestions((prev) =>
      revalidateQuestions(
        prev.map((q) =>
          q._clientId === clientId
            ? { ...q, duplicateResolution: "keep" as const }
            : q,
        ),
      ),
    );
  }

  async function handleSubmit() {
    if (!importSource) return;

    const questionsWithSource = activeQuestions.map((q) => ({
      ...q,
      source: importSource,
    }));

    const selectedQuestions = questionsWithSource.map((q) => ({
      _clientId: q._clientId,
      rowIndex: q.rowIndex,
      year: q.year,
      subject: q.subject,
      text: q.text,
      hasImage: q.hasImage,
      options: q.options,
      correctAnswer: q.correctAnswer,
      source: q.source,
      type: q.type,
      difficulty: q.difficulty,
      explanation: q.explanation,
      status:
        q.status === "duplicate" && q.duplicateResolution === "keep"
          ? ("warning" as const)
          : q.status,
      statusReason: q.statusReason,
    }));

    setSubmitError(null);
    importMutation.mutate({ questions: selectedQuestions });
  }

  // ── Draft actions ─────────────────────────────────────────────────────────

  function handleSaveDraft() {
    saveDraft({ importSource, questions, summary });
  }

  function handleRestoreDraft() {
    setQuestions(draft.questions);
    setSummary(draft.summary);
    setImportSource(draft.importSource);
    setDetectedSource(null);
    setStatus("preview");
    setDraftHandled(true);
  }

  function handleDiscardDraft() {
    clearDraft();
    setDraftHandled(true);
  }

  async function handleGuardDiscardAndProcess() {
    clearDraft();
    setDraftHandled(true);
    setShowUploadGuard(false);
    await doProcessFile();
  }

  return {
    state: {
      format,
      file,
      status,
      parseError,
      submitError,
      progress,
      importResult,
      questions,
      summary,
      detectedSource,
      importSource,
      showUploadGuard,
      draftHandled,
      yearFilter,
      statusFilter,
      search,
      reviewQuestion,
      editQuestion,
      duplicateQuestion,
      filteredQuestions,
      activeQuestions,
      liveSummary,
      duplicateMatch,
      keptDuplicates,
      removedCount,
      remainingErrors,
      draft,
      draftExists: hasDraft(),
      isSubmitting: importMutation.isPending,
    },
    actions: {
      setFormat,
      setFile,
      setYearFilter,
      setStatusFilter,
      setSearch,
      setImportSource,
      setQuestions,
      setReviewQuestion,
      setEditQuestion,
      setDuplicateQuestion,
      setShowUploadGuard,
      handleFileSelected,
      handleProcess,
      handleUseMockData,
      handleReset,
      handleEditQuestion,
      handleSaveEdit,
      handleRemoveQuestion,
      handleUndoRemove,
      handleKeepDuplicate,
      handleSubmit,
      handleSaveDraft,
      handleRestoreDraft,
      handleDiscardDraft,
      handleGuardDiscardAndProcess,
    },
  };
}
