import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/dashboard.tsx"),
    route("admin/subjects", "routes/admin/subjects.tsx"),
    route("admin/questions", "routes/admin/questions/index.tsx"),
    route("admin/questions/new", "routes/admin/questions/new.tsx"),
    route("admin/questions/:questionId/edit", "routes/admin/questions/edit.tsx"),
    route("admin/question-sets", "routes/admin/question-sets.tsx"),
    route("admin/imports", "routes/admin/imports/index.tsx"),
    route("admin/imports/:importId", "routes/admin/imports/show.tsx"),
    route("admin/exams", "routes/admin/exams.tsx"),
    route("admin/mock-exams", "routes/admin/mock-exams.tsx"),
    route("admin/results", "routes/admin/results.tsx"),
    route("admin/users", "routes/admin/users.tsx"),
    route("admin/roles", "routes/admin/roles.tsx"),
    route("admin/subscriptions", "routes/admin/subscriptions.tsx"),
    route("admin/payments", "routes/admin/payments.tsx"),
    route("admin/settings", "routes/admin/settings.tsx"),
    route("admin/activity", "routes/admin/activity.tsx"),
  ])
] satisfies RouteConfig;
