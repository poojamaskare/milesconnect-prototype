import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
	title: "Command Center · MilesConnect",
};

export default function DashboardPage() {
	return <DashboardClient />;
}
