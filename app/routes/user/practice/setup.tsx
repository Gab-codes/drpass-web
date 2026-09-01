import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_SUBJECTS, generateMockExam } from "@/data/mock-exam";
import { useExamStore } from "@/store/exam-store";
import { cn } from "@/lib/utils";

export default function PracticeSetup() {
  const navigate = useNavigate();
  const setupExam = useExamStore((state) => state.setupExam);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState<number>(10);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(15);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return prev; // Already have 2, no-op
    });
  };

  const handleStart = () => {
    if (selectedSubjects.length === 0) return;
    const config = {
      subjects: selectedSubjects,
      questionsPerSubject,
      totalTimeMinutes,
    };
    const questions = generateMockExam(config);
    setupExam(config, questions);
    navigate("/practice/exam");
  };

  const totalQuestions = selectedSubjects.length * questionsPerSubject;

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto py-8">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground">
          Quick Practice
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure a focused practice session to prepare for exam day.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr] items-start">
        {/* Configuration column */}
        <div className="space-y-8">
          {/* Subjects */}
          <section aria-labelledby="subjects-heading">
            <div className="mb-4">
              <h2
                id="subjects-heading"
                className="text-base font-medium text-foreground"
              >
                Select Subjects
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choose 1 or 2 subjects for this practice session.
              </p>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              role="group"
              aria-label="Subject selection"
            >
              {MOCK_SUBJECTS.map((subject) => {
                const isSelected = selectedSubjects.includes(subject.id);
                const isDisabled = !isSelected && selectedSubjects.length >= 2;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
                      isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer"
                    )}
                  >
                    {/* Checkbox indicator */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-accent-foreground" : "text-foreground"
                      )}
                    >
                      {subject.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedSubjects.length === 2 && (
              <p className="text-xs text-muted-foreground mt-2" role="status">
                Maximum of 2 subjects selected.
              </p>
            )}
          </section>

          {/* Session configuration */}
          <section aria-labelledby="config-heading">
            <div className="mb-4">
              <h2
                id="config-heading"
                className="text-base font-medium text-foreground"
              >
                Session Settings
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="questions-select" className="text-sm">
                  Questions per subject
                </Label>
                <Select
                  value={questionsPerSubject.toString()}
                  onValueChange={(v) => setQuestionsPerSubject(Number(v))}
                >
                  <SelectTrigger
                    id="questions-select"
                    className="h-11 w-full rounded-xl"
                  >
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                    <SelectItem value="30">30 questions</SelectItem>
                    <SelectItem value="40">40 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-select" className="text-sm">
                  Total time limit
                </Label>
                <Select
                  value={totalTimeMinutes.toString()}
                  onValueChange={(v) => setTotalTimeMinutes(Number(v))}
                >
                  <SelectTrigger
                    id="time-select"
                    className="h-11 w-full rounded-xl"
                  >
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Applies to the entire practice session.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Summary card */}
        <div>
          <Card className="sticky top-20 bg-surface-2 shadow-none rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Practice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-5">
              <div className="flex justify-between items-center text-sm py-2.5 border-b border-border/60">
                <span className="text-muted-foreground">Subjects</span>
                <span className="font-medium text-foreground">
                  {selectedSubjects.length === 0
                    ? "None"
                    : selectedSubjects.length === 1
                    ? "1 subject"
                    : "2 subjects"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2.5 border-b border-border/60">
                <span className="text-muted-foreground">Total Questions</span>
                <span className="font-medium text-foreground tabular-nums">
                  {totalQuestions}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2.5">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">
                  {totalTimeMinutes} min
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                size="lg"
                className="w-full rounded-xl"
                disabled={selectedSubjects.length === 0}
                onClick={handleStart}
              >
                Start Practice
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
