import { Outlet } from "react-router";

export default function ExamLayout() {
  return (
    <div className="min-h-svh bg-background flex flex-col font-sans">
      <Outlet />
    </div>
  );
}
