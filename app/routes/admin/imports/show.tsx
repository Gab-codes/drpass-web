import ShowImport from "@/pages/admin/imports/show";
import type { Route } from "./+types/show";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Import Details" },
    { name: "description", content: "View Import Details" },
  ];
}

export default function ShowImportPage() {
  return <ShowImport />;
}
