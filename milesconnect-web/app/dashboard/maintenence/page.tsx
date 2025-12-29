import type { Metadata } from "next";
import VehicleMaintenancePage from "../maintenance/page";

export const metadata: Metadata = {
	title: "Vehicle Maintenance · MilesConnect",
};

export default function MaintenanceTypoAliasPage() {
	return <VehicleMaintenancePage />;
}
