import type { Metadata } from "next";

import MaintenanceClient from "./maintenance-client";

export const metadata: Metadata = {
	title: "Vehicle Maintenance · MilesConnect",
};
export default function VehicleMaintenancePage() {
	return <MaintenanceClient />;
}
