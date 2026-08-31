import { motion, type Variants } from "motion/react";
import { DashboardHeader } from "@/components/student/dashboard-header";
import { PrimaryAction } from "@/components/student/primary-action";
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
    nextAction,
    focusArea,
    streakDays,
    recentActivity,
  } = MOCK_DASHBOARD_DATA;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-10 md:gap-14 max-w-5xl"
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <motion.div variants={itemVariants}>
          <DashboardHeader profile={profile} state={state} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <PrimaryAction
            nextAction={nextAction}
            state={state}
            profile={profile}
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <PreparationOverview metrics={metrics} state={state} />
      </motion.div>

      <div className="flex flex-col gap-10 md:grid md:gap-16 md:grid-cols-2">
        <motion.div variants={itemVariants} className="order-1 md:order-1">
          <FocusRecommendation focusArea={focusArea} state={state} />
        </motion.div>
        
        <motion.div variants={itemVariants} className="order-2 md:order-2">
          <SubjectPerformance subjectStats={subjectStats} state={state} />
        </motion.div>
        
        <motion.div variants={itemVariants} className="order-3 md:order-3 md:col-start-1">
          <StudyStreak
            streakDays={streakDays}
            recentActivity={recentActivity}
            state={state}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
