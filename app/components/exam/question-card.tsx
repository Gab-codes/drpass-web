import type { Question } from "@/data/mock-exam";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <div>
      {/* Subject label */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {question.subject}
      </p>

      {/* Question text */}
      <div
        id={`question-${questionNumber}`}
        className="text-base sm:text-lg leading-relaxed text-foreground font-normal"
      >
        <span className="text-muted-foreground font-medium mr-2 select-none">
          {questionNumber}.
        </span>
        {question.text}
      </div>
    </div>
  );
}
