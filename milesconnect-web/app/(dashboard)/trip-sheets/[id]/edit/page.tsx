import type { Metadata } from "next";
import EditTripSheetClient from "./edit-client";

export const metadata: Metadata = {
  title: "Edit Trip Sheet · MilesConnect",
};

export default function EditTripSheetPage({ params }: { params: { id: string } }) {
  return <EditTripSheetClient tripSheetId={params.id} />;
}
