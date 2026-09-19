import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useSyllabus } from "@/hooks/use-syllabus";
import { useUser } from "@/hooks/use-user";
import { SubjectList } from "@/components/student/syllabus/subject-list";
import { TopicList } from "@/components/student/syllabus/topic-list";
import { SyllabusSkeleton } from "@/components/student/syllabus/syllabus-skeleton";
import { SyllabusError } from "@/components/student/syllabus/syllabus-error";
import {
  SyllabusEmptyNoSubjects,
  SyllabusEmptyNoMatch,
} from "@/components/student/syllabus/syllabus-empty";
import { Badge } from "@/components/ui/badge";

const EXAM_KEY = "JAMB UTME";

export default function SyllabusPage() {
  const {
    data: syllabus,
    isPending: isSyllabusPending,
    isError,
    refetch,
  } = useSyllabus(EXAM_KEY);
  const { user, isLoading: isUserLoading } = useUser();

  const isLoading = isSyllabusPending || isUserLoading;

  // Filter and order syllabus subjects based on user's selected subjects
  const visibleSubjects = useMemo(() => {
    if (!syllabus || !user || !user.subjects) return [];

    const syllabusSubjectMap = new Map(
      syllabus.syllabusSubjects.map((ss) => [ss.subject.code, ss]),
    );

    // Maintain the order of user.subjects
    const filtered = user.subjects
      .map((userSubject) => syllabusSubjectMap.get(userSubject.code))
      .filter((ss): ss is NonNullable<typeof ss> => ss !== undefined);

    return filtered;
  }, [syllabus, user]);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(
    null,
  );

  // Auto-select the first visible subject when data becomes available
  useEffect(() => {
    if (visibleSubjects.length > 0 && !selectedSubjectCode) {
      setSelectedSubjectCode(visibleSubjects[0].subject.code);
    } else if (visibleSubjects.length > 0 && selectedSubjectCode) {
      // Ensure the selected subject is still in the visible list
      const isStillVisible = visibleSubjects.some(
        (ss) => ss.subject.code === selectedSubjectCode,
      );
      if (!isStillVisible) {
        setSelectedSubjectCode(visibleSubjects[0].subject.code);
      }
    }
  }, [visibleSubjects, selectedSubjectCode]);

  const activeSubject = useMemo(
    () =>
      visibleSubjects.find((s) => s.subject.code === selectedSubjectCode) ||
      null,
    [visibleSubjects, selectedSubjectCode],
  );

  if (isLoading) {
    return <SyllabusSkeleton />;
  }

  if (isError) {
    return <SyllabusError onRetry={() => refetch()} />;
  }

  if (!user?.subjects || user.subjects.length === 0) {
    return <SyllabusEmptyNoSubjects />;
  }

  if (visibleSubjects.length === 0) {
    return <SyllabusEmptyNoMatch exam={EXAM_KEY} />;
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
          <Badge
            variant="outline"
            className="text-xs uppercase tracking-wider font-semibold border-primary/20 text-primary bg-primary/5"
          >
            {syllabus?.exam || EXAM_KEY} {syllabus?.year}
          </Badge>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Curriculum
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          My Syllabus
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          Review the complete list of subjects and topics you need to master for
          your exam.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 shrink-0">
          <SubjectList
            subjects={visibleSubjects}
            activeSubjectCode={selectedSubjectCode}
            onSelect={setSelectedSubjectCode}
          />
        </div>

        <div className="flex-1 w-full">
          {activeSubject ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TopicList topics={activeSubject.topics} />
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              Please select a subject to view its syllabus.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
