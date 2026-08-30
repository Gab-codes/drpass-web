import { motion, type Variants } from "motion/react";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { ContinueStudying } from "@/components/student/continue-studying";
import { PreparationOverview } from "@/components/student/preparation-overview";
import { SubjectPerformance } from "@/components/student/subject-performance";
import { FocusRecommendation } from "@/components/student/focus-recommendation";
import { StudyStreak } from "@/components/student/study-streak";

import { MOCK_DASHBOARD_DATA } from "@/data/student-dashboard-mock";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function StudentDashboardPage() {
  const {
    state,
    profile,
    metrics,
    subjectStats,
    continueSession,
    focusArea,
    streakDays,
    recentActivity,
  } = MOCK_DASHBOARD_DATA;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      <motion.div variants={itemVariants}>
        <DashboardHeader profile={profile} state={state} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ContinueStudying
          session={continueSession}
          state={state}
          profile={profile}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PreparationOverview metrics={metrics} state={state} />
      </motion.div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <motion.div variants={itemVariants}>
          <SubjectPerformance subjectStats={subjectStats} state={state} />
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div variants={itemVariants}>
            <FocusRecommendation focusArea={focusArea} state={state} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StudyStreak
              streakDays={streakDays}
              recentActivity={recentActivity}
              state={state}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
