import type { Metadata } from "next";

import DocumentsClient from "./documents-client";

export const metadata: Metadata = {
  title: "Documents · MilesConnect",
};

export default function DocumentsManagementPage() {
	return <DocumentsClient />;
}
