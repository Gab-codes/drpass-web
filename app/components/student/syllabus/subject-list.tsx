import type { SyllabusSubject } from "@/types/syllabus";
import { cn } from "@/lib/utils";

interface SubjectListProps {
  subjects: SyllabusSubject[];
  activeSubjectCode: string | null;
  onSelect: (code: string) => void;
}

export function SubjectList({ subjects, activeSubjectCode, onSelect }: SubjectListProps) {
  return (
    <div className="flex flex-col gap-1 w-full relative">
      {/* Mobile view: Horizontal scrolling tabs */}
      <div className="flex md:hidden w-full items-center gap-2 overflow-x-auto no-scrollbar pb-4 -mb-4 snap-x border-b border-border">
        {subjects.map((ss) => {
          const isActive = ss.subject.code === activeSubjectCode;
          return (
            <button
              key={ss.id}
              onClick={() => onSelect(ss.subject.code)}
              className={cn(
                "relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors hover:text-foreground rounded-full snap-start whitespace-nowrap",
                isActive 
                  ? "bg-primary text-primary-foreground hover:text-primary-foreground" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
              aria-pressed={isActive}
            >
              {ss.subject.name}
            </button>
          );
        })}
      </div>

      {/* Desktop view: Vertical navigation list */}
      <div className="hidden md:flex flex-col gap-1 w-full">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/70 uppercase mb-2 pl-3">
          Subjects
        </h2>
        {subjects.map((ss) => {
          const isActive = ss.subject.code === activeSubjectCode;
          const topicCount = ss.topics?.length || 0;
          return (
            <button
              key={ss.id}
              onClick={() => onSelect(ss.subject.code)}
              className={cn(
                "flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl transition-all text-left w-full border border-transparent",
                isActive 
                  ? "bg-primary/5 text-primary border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              aria-pressed={isActive}
            >
              <span className="text-sm font-medium">
                {ss.subject.name}
              </span>
              <span className={cn(
                "text-xs",
                isActive ? "text-primary/70" : "text-muted-foreground/70"
              )}>
                {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
