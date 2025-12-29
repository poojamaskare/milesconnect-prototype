export type VehicleStatus = "Active" | "Idle" | "Maintenance";

export type VehicleType =
	| "Truck"
	| "Van"
	| "Trailer"
	| "Reefer"
	| "Container"
	| "Pickup"
	| "Other";

export interface Vehicle {
	id: string;
	registrationNumber: string;
	type: VehicleType;
	status: VehicleStatus;
	assignedDriverId: string | null;
	currentShipmentId: string | null;
	lastServiceDate: string;
	nextServiceDue: string;
	maintenanceRiskScore: number;
}
