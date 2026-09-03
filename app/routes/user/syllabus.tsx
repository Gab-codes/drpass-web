import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { getMockSyllabus } from "@/data/syllabus/syllabus.mock";
import { SubjectSelector } from "@/components/student/syllabus/subject-selector";
import { TopicTree } from "@/components/student/syllabus/topic-tree";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";

export default function SyllabusPage() {
  // Simulating data fetching. In the future, this will be replaced with:
  // const syllabus = await getActiveSyllabus();
  const syllabus = getMockSyllabus();

  const [activeSubjectId, setActiveSubjectId] = useState(
    syllabus?.syllabusSubjects?.[0]?.id || ""
  );

  const activeSubject = useMemo(
    () => syllabus?.syllabusSubjects.find((s) => s.id === activeSubjectId),
    [syllabus, activeSubjectId]
  );

  if (!syllabus) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Loading curriculum...</p>
      </div>
    );
  }

  if (syllabus.syllabusSubjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4 border rounded-2xl bg-card shadow-sm p-8 max-w-lg mx-auto">
        <div className="p-4 rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={BookOpen01Icon} className="size-8" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          No Syllabus Available
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          There are currently no subjects mapped to the {syllabus.exam}{" "}
          {syllabus.year} syllabus.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-8 pb-12"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/20 text-primary bg-primary/5">
            {syllabus.exam} {syllabus.year}
          </Badge>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Curriculum
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          My Syllabus
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          Review the complete list of subjects and topics you need to master for your exam.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <SubjectSelector
          subjects={syllabus.syllabusSubjects}
          activeSubjectId={activeSubjectId}
          onSelect={setActiveSubjectId}
        />

        {activeSubject ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TopicTree topics={activeSubject.topics} />
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            Please select a subject to view its syllabus.
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Ensure Badge is imported (was missing above)
import { Badge } from "@/components/ui/badge";
