import type { Metadata } from "next";
import DocumentsManagementPage from "../../(dashboard)/documents/page";

export const metadata: Metadata = {
  title: "Documents · MilesConnect",
};

export default function DocumentsPageAlias() {
  return <DocumentsManagementPage />;
}
