import type { Metadata } from "next";
import TripSheetsClient from "./trip-sheets-client";

export const metadata: Metadata = {
  title: "Trip Sheets · MilesConnect",
};
export default function TripSheetsPage() {
  return <TripSheetsClient />;
}
