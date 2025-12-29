import "dotenv/config";

import prisma from "../src/prisma/client";

const ids = {
	users: {
		admin: "00000000-0000-0000-0000-000000000001",
		manager: "00000000-0000-0000-0000-000000000002",
		driver1: "00000000-0000-0000-0000-000000000011",
		driver2: "00000000-0000-0000-0000-000000000012",
		driver3: "00000000-0000-0000-0000-000000000013",
		driver4: "00000000-0000-0000-0000-000000000014",
	},
	drivers: {
		d1: "00000000-0000-0000-0000-00000001d001",
		d2: "00000000-0000-0000-0000-00000001d002",
		d3: "00000000-0000-0000-0000-00000001d003",
		d4: "00000000-0000-0000-0000-00000001d004",
	},
	vehicles: {
		v1: "00000000-0000-0000-0000-000000002001",
		v2: "00000000-0000-0000-0000-000000002002",
		v3: "00000000-0000-0000-0000-000000002003",
		v4: "00000000-0000-0000-0000-000000002004",
	},
	shipments: {
		s1: "00000000-0000-0000-0000-000000003001",
		s2: "00000000-0000-0000-0000-000000003002",
		s3: "00000000-0000-0000-0000-000000003003",
		s4: "00000000-0000-0000-0000-000000003004",
		s5: "00000000-0000-0000-0000-000000003005",
		s6: "00000000-0000-0000-0000-000000003006",
		s7: "00000000-0000-0000-0000-000000003007",
		s8: "00000000-0000-0000-0000-000000003008",
	},
	tripSheets: {
		ts1: "00000000-0000-0000-0000-000000004001",
		ts2: "00000000-0000-0000-0000-000000004002",
	},
	invoices: {
		i1: "00000000-0000-0000-0000-000000005001",
		i2: "00000000-0000-0000-0000-000000005002",
		i3: "00000000-0000-0000-0000-000000005003",
	},
	payments: {
		p1: "00000000-0000-0000-0000-000000006001",
		p2: "00000000-0000-0000-0000-000000006002",
	},
	documents: {
		d1: "00000000-0000-0000-0000-00000000dc01",
		d2: "00000000-0000-0000-0000-00000000dc02",
		d3: "00000000-0000-0000-0000-00000000dc03",
		d4: "00000000-0000-0000-0000-00000000dc04",
		d5: "00000000-0000-0000-0000-00000000dc05",
		d6: "00000000-0000-0000-0000-00000000dc06",
	},
};

function nowPlusHours(h: number) {
	const d = new Date();
	d.setHours(d.getHours() + h);
	return d;
}

function daysAgo(days: number) {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

async function main() {
	// Clear in dependency order
	await prisma.payment.deleteMany();
	await prisma.document.deleteMany();
	await prisma.invoice.deleteMany();
	await prisma.tripSheetShipment.deleteMany();
	await prisma.tripSheet.deleteMany();
	await prisma.shipment.deleteMany();
	await prisma.vehicle.deleteMany();
	await prisma.driver.deleteMany();
	await prisma.user.deleteMany();

	// Users
	await prisma.user.createMany({
		data: [
			{
				id: ids.users.admin,
				email: "admin@milesconnect.local",
				passwordHash: "sample_hash_admin",
				name: "System Admin",
				role: "ADMIN",
				isActive: true,
			},
			{
				id: ids.users.manager,
				email: "ops@milesconnect.local",
				passwordHash: "sample_hash_ops",
				name: "Ops Manager",
				role: "MANAGER",
				isActive: true,
			},
			{
				id: ids.users.driver1,
				email: "rohit.driver@milesconnect.local",
				passwordHash: "sample_hash_driver",
				name: "Rohit Sharma",
				role: "DRIVER",
				isActive: true,
			},
			{
				id: ids.users.driver2,
				email: "neha.driver@milesconnect.local",
				passwordHash: "sample_hash_driver",
				name: "Neha Verma",
				role: "DRIVER",
				isActive: true,
			},
			{
				id: ids.users.driver3,
				email: "imran.driver@milesconnect.local",
				passwordHash: "sample_hash_driver",
				name: "Imran Khan",
				role: "DRIVER",
				isActive: true,
			},
			{
				id: ids.users.driver4,
				email: "ananya.driver@milesconnect.local",
				passwordHash: "sample_hash_driver",
				name: "Ananya Iyer",
				role: "DRIVER",
				isActive: true,
			},
		],
	});

	// Drivers
	await prisma.driver.createMany({
		data: [
			{
				id: ids.drivers.d1,
				userId: ids.users.driver1,
				licenseNumber: "MH-LIC-10001",
				phone: "+91-90000-00001",
				address: "Mumbai, MH",
				isActive: true,
			},
			{
				id: ids.drivers.d2,
				userId: ids.users.driver2,
				licenseNumber: "KA-LIC-10002",
				phone: "+91-90000-00002",
				address: "Bengaluru, KA",
				isActive: true,
			},
			{
				id: ids.drivers.d3,
				userId: ids.users.driver3,
				licenseNumber: "DL-LIC-10003",
				phone: "+91-90000-00003",
				address: "Delhi, DL",
				isActive: true,
			},
			{
				id: ids.drivers.d4,
				userId: ids.users.driver4,
				licenseNumber: "TN-LIC-10004",
				phone: "+91-90000-00004",
				address: "Chennai, TN",
				isActive: true,
			},
		],
	});

	// Vehicles
	await prisma.vehicle.createMany({
		data: [
			{
				id: ids.vehicles.v1,
				registrationNumber: "MH 01 AB 9210",
				vin: "VIN-MH01AB9210",
				make: "Tata",
				model: "Ace Gold",
				capacityKg: 1200,
				status: "ACTIVE",
				primaryDriverId: ids.drivers.d1,
			},
			{
				id: ids.vehicles.v2,
				registrationNumber: "KA 05 CD 1142",
				vin: "VIN-KA05CD1142",
				make: "Mahindra",
				model: "Jeeto",
				capacityKg: 900,
				status: "ACTIVE",
				primaryDriverId: ids.drivers.d2,
			},
			{
				id: ids.vehicles.v3,
				registrationNumber: "DL 01 CX 9014",
				vin: "VIN-DL01CX9014",
				make: "Eicher",
				model: "Pro 3015",
				capacityKg: 3500,
				status: "MAINTENANCE",
				primaryDriverId: ids.drivers.d3,
			},
			{
				id: ids.vehicles.v4,
				registrationNumber: "TN 09 GH 2081",
				vin: "VIN-TN09GH2081",
				make: "Ashok Leyland",
				model: "Dost",
				capacityKg: 1500,
				status: "INACTIVE",
				primaryDriverId: ids.drivers.d4,
			},
		],
	});

	// Shipments (linked to drivers/vehicles)
	await prisma.shipment.createMany({
		data: [
			{
				id: ids.shipments.s1,
				referenceNumber: "SHP-48301",
				status: "IN_TRANSIT",
				originAddress: "Delhi (DEL), India",
				destinationAddress: "Mumbai (BOM), India",
				scheduledPickupAt: daysAgo(1),
				scheduledDropAt: nowPlusHours(8),
				actualPickupAt: daysAgo(1),
				weightKg: 1200,
				createdById: ids.users.manager,
				driverId: ids.drivers.d1,
				vehicleId: ids.vehicles.v1,
			},
			{
				id: ids.shipments.s2,
				referenceNumber: "SHP-48342",
				status: "PLANNED",
				originAddress: "Bengaluru (BLR), India",
				destinationAddress: "Hyderabad (HYD), India",
				scheduledPickupAt: nowPlusHours(2),
				scheduledDropAt: nowPlusHours(12),
				weightKg: 700,
				createdById: ids.users.manager,
				driverId: ids.drivers.d2,
				vehicleId: ids.vehicles.v2,
			},
			{
				id: ids.shipments.s3,
				referenceNumber: "SHP-48377",
				status: "DELIVERED",
				originAddress: "Pune (PNQ), India",
				destinationAddress: "Surat (STV), India",
				scheduledPickupAt: daysAgo(3),
				scheduledDropAt: daysAgo(2),
				actualPickupAt: daysAgo(3),
				actualDropAt: daysAgo(2),
				weightKg: 980,
				createdById: ids.users.manager,
				driverId: ids.drivers.d1,
				vehicleId: ids.vehicles.v1,
			},
			{
				id: ids.shipments.s4,
				referenceNumber: "SHP-48410",
				status: "DRAFT",
				originAddress: "Ahmedabad (AMD), India",
				destinationAddress: "Jaipur (JAI), India",
				weightKg: 500,
				createdById: ids.users.manager,
			},
			{
				id: ids.shipments.s5,
				referenceNumber: "SHP-48422",
				status: "CANCELLED",
				originAddress: "Chennai (MAA), India",
				destinationAddress: "Coimbatore (CJB), India",
				scheduledPickupAt: daysAgo(2),
				scheduledDropAt: daysAgo(1),
				weightKg: 640,
				createdById: ids.users.manager,
			},
			{
				id: ids.shipments.s6,
				referenceNumber: "SHP-48435",
				status: "IN_TRANSIT",
				originAddress: "Nagpur (NAG), India",
				destinationAddress: "Indore (IDR), India",
				scheduledPickupAt: daysAgo(1),
				scheduledDropAt: nowPlusHours(20),
				actualPickupAt: daysAgo(1),
				weightKg: 1300,
				createdById: ids.users.manager,
				driverId: ids.drivers.d2,
				vehicleId: ids.vehicles.v2,
			},
			{
				id: ids.shipments.s7,
				referenceNumber: "SHP-48448",
				status: "PLANNED",
				originAddress: "Noida (DEL-NCR), India",
				destinationAddress: "Lucknow (LKO), India",
				scheduledPickupAt: nowPlusHours(6),
				scheduledDropAt: nowPlusHours(16),
				weightKg: 900,
				createdById: ids.users.manager,
				driverId: ids.drivers.d3,
				vehicleId: ids.vehicles.v3,
			},
			{
				id: ids.shipments.s8,
				referenceNumber: "SHP-48460",
				status: "DRAFT",
				originAddress: "Kochi (COK), India",
				destinationAddress: "Thiruvananthapuram (TRV), India",
				weightKg: 420,
				createdById: ids.users.manager,
			},
		],
	});

	// Trip sheets + shipment linking
	await prisma.tripSheet.create({
		data: {
			id: ids.tripSheets.ts1,
			sheetNo: "TS-19001",
			status: "APPROVED",
			driverId: ids.drivers.d1,
			vehicleId: ids.vehicles.v1,
			createdById: ids.users.manager,
			startOdometerKm: 12050,
			endOdometerKm: 12230,
			startedAt: daysAgo(1),
			endedAt: daysAgo(1),
			shipments: {
				create: [
					{ shipmentId: ids.shipments.s3, sequence: 1 },
					{ shipmentId: ids.shipments.s1, sequence: 2 },
				],
			},
		},
	});

	await prisma.tripSheet.create({
		data: {
			id: ids.tripSheets.ts2,
			sheetNo: "TS-19002",
			status: "SUBMITTED",
			driverId: ids.drivers.d2,
			vehicleId: ids.vehicles.v2,
			createdById: ids.users.manager,
			startOdometerKm: 8040,
			startedAt: daysAgo(0),
			shipments: {
				create: [
					{ shipmentId: ids.shipments.s2, sequence: 1 },
					{ shipmentId: ids.shipments.s6, sequence: 2 },
				],
			},
		},
	});

	// Invoices (linked to shipments)
	await prisma.invoice.createMany({
		data: [
			{
				id: ids.invoices.i1,
				invoiceNumber: "INV-30218",
				status: "PAID",
				currency: "INR",
				subtotalCents: BigInt(40300_00),
				taxCents: BigInt(2000_00),
				totalCents: BigInt(42300_00),
				issuedAt: daysAgo(10),
				dueAt: daysAgo(2),
				paidAt: daysAgo(1),
				shipmentId: ids.shipments.s3,
				createdById: ids.users.manager,
				version: 1,
			},
			{
				id: ids.invoices.i2,
				invoiceNumber: "INV-30241",
				status: "ISSUED",
				currency: "INR",
				subtotalCents: BigInt(18000_00),
				taxCents: BigInt(950_00),
				totalCents: BigInt(18950_00),
				issuedAt: daysAgo(5),
				dueAt: nowPlusHours(72),
				shipmentId: ids.shipments.s1,
				createdById: ids.users.manager,
				version: 1,
			},
			{
				id: ids.invoices.i3,
				invoiceNumber: "INV-30255",
				status: "ISSUED",
				currency: "INR",
				subtotalCents: BigInt(30000_00),
				taxCents: BigInt(1600_00),
				totalCents: BigInt(31600_00),
				issuedAt: daysAgo(3),
				dueAt: daysAgo(1),
				shipmentId: ids.shipments.s6,
				createdById: ids.users.manager,
				version: 1,
			},
		],
	});

	// Payments (linked to invoices)
	await prisma.payment.createMany({
		data: [
			{
				id: ids.payments.p1,
				invoiceId: ids.invoices.i1,
				status: "SUCCEEDED",
				method: "UPI",
				currency: "INR",
				amountCents: BigInt(42300_00),
				idempotencyKey: "pay_inv_30218_1",
				provider: "paytm_sandbox",
				providerReference: "PAYTM_TXN_8F3A12",
				receivedAt: daysAgo(1),
				succeededAt: daysAgo(1),
				version: 1,
			},
			{
				id: ids.payments.p2,
				invoiceId: ids.invoices.i3,
				status: "FAILED",
				method: "CARD",
				currency: "INR",
				amountCents: BigInt(31600_00),
				idempotencyKey: "pay_inv_30255_1",
				provider: "paytm_sandbox",
				providerReference: "PAYTM_FAIL_17C09B",
				receivedAt: daysAgo(1),
				failedAt: daysAgo(1),
				version: 1,
			},
		],
	});

	// Documents (linked to shipments/vehicles/invoices)
	await prisma.document.createMany({
		data: [
			{
				id: ids.documents.d1,
				type: "POD",
				fileName: "POD - SHP-48377.pdf",
				mimeType: "application/pdf",
				sizeBytes: BigInt(128_000),
				url: "https://example.com/docs/pod-shp-48377",
				uploadedById: ids.users.manager,
				shipmentId: ids.shipments.s3,
			},
			{
				id: ids.documents.d2,
				type: "INVOICE",
				fileName: "Invoice - INV-30218.pdf",
				mimeType: "application/pdf",
				sizeBytes: BigInt(92_000),
				url: "https://example.com/docs/inv-30218",
				uploadedById: ids.users.manager,
				invoiceId: ids.invoices.i1,
				shipmentId: ids.shipments.s3,
			},
			{
				id: ids.documents.d3,
				type: "INSURANCE",
				fileName: "Insurance - MH 01 AB 9210.pdf",
				mimeType: "application/pdf",
				sizeBytes: BigInt(210_000),
				url: "https://example.com/docs/ins-mh01ab9210",
				uploadedById: ids.users.manager,
				vehicleId: ids.vehicles.v1,
			},
			{
				id: ids.documents.d4,
				type: "RC",
				fileName: "RC - KA 05 CD 1142.pdf",
				mimeType: "application/pdf",
				sizeBytes: BigInt(175_000),
				url: "https://example.com/docs/rc-ka05cd1142",
				uploadedById: ids.users.manager,
				vehicleId: ids.vehicles.v2,
			},
			{
				id: ids.documents.d5,
				type: "LICENSE",
				fileName: "License - Rohit Sharma.pdf",
				mimeType: "application/pdf",
				sizeBytes: BigInt(88_000),
				url: "https://example.com/docs/lic-rohit",
				uploadedById: ids.users.manager,
				driverId: ids.drivers.d1,
			},
			{
				id: ids.documents.d6,
				type: "OTHER",
				fileName: "E-way Permit - SHP-48342.pdf",
				mimeType: "application/pdf",
				sizeBytes: BigInt(61_000),
				url: "https://example.com/docs/permit-shp-48342",
				uploadedById: ids.users.manager,
				shipmentId: ids.shipments.s2,
			},
		],
	});
}

main()
	.then(async () => {
		await prisma.$disconnect();
		// eslint-disable-next-line no-console
		console.log("Seed completed");
	})
	.catch(async (e) => {
		// eslint-disable-next-line no-console
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
