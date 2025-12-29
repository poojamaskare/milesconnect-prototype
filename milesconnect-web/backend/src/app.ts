import express, { type NextFunction, type Request, type Response } from "express";
import shipmentRouter from "./routes/shipment.routes";
import vehicleRouter from "./routes/vehicle.routes";
import tripSheetRouter from "./routes/tripSheet.routes";
import driverRouter from "./routes/driver.routes";
import invoiceRouter from "./routes/invoice.routes";
import documentRouter from "./routes/document.routes";
import dashboardRouter from "./routes/dashboard.routes";
import fleetRouter from "./routes/fleet.routes";

const cors = require("cors");

type HttpError = Error & {
	statusCode?: number;
	code?: string;
};

// Allow Prisma BigInt fields (e.g., cents, bytes) to be returned via res.json().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function toJSON() {
	return this.toString();
};

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});

// API routes
app.use("/api/shipments", shipmentRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/trip-sheets", tripSheetRouter);
app.use("/api/drivers", driverRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/documents", documentRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/fleet", fleetRouter);

// Centralized error handler (must be last)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	const error = err as HttpError;
	const statusCode = error.statusCode ?? 500;
	const message = statusCode >= 500 ? "Internal Server Error" : error.message;

	res.status(statusCode).json({
		error: {
			message,
			code: error.code,
		},
	});
});

export default app;
