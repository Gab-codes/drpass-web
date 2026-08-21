import AdminDashboard from "@/pages/admin/dashboard";
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Admin Dashboard" },
  ];
}

export default function DashboardPage() {
  return <AdminDashboard />;
}
