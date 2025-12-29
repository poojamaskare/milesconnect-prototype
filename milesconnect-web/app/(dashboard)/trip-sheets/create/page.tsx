import type { Metadata } from "next";
import CreateTripSheetClient from "./create-client";

export const metadata: Metadata = {
  title: "Create Trip Sheet · MilesConnect",
};

export default function CreateTripSheetPage() {
  return <CreateTripSheetClient />;
}
