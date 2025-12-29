import type { Metadata } from "next";
import TripSheetsPage from "../../(dashboard)/trip-sheets/page";

export const metadata: Metadata = {
  title: "Trip Sheets · MilesConnect",
};

export default function TripSheetsPageAlias() {
  return <TripSheetsPage />;
}
