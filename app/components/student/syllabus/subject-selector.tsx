import type { SyllabusSubject } from "@/data/syllabus/syllabus.types";
import { cn } from "@/lib/utils";

interface SubjectSelectorProps {
  subjects: SyllabusSubject[];
  activeSubjectId: string;
  onSelect: (id: string) => void;
}

export function SubjectSelector({ subjects, activeSubjectId, onSelect }: SubjectSelectorProps) {
  return (
    <div className="relative w-full overflow-hidden border-b border-border/60">
      <div className="flex w-full items-center gap-1 overflow-x-auto no-scrollbar py-2">
        {subjects.map((ss) => {
          const isActive = ss.id === activeSubjectId;
          return (
            <button
              key={ss.id}
              onClick={() => onSelect(ss.id)}
              className={cn(
                "relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors hover:text-foreground rounded-full",
                isActive ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {ss.subject.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
