/**
 * DEPRECATED: This route has been replaced by the new bulk Topic Classification
 * workflow at /admin/questions/classification.
 *
 * This file is retained only to handle any existing bookmarks.
 * It redirects to the new classification setup page.
 */

import { Navigate } from "react-router";

export default function ClassifyRedirect() {
  return <Navigate to="/admin/questions/classification" replace />;
}
