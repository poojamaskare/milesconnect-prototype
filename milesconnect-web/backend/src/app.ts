import express, { type NextFunction, type Request, type Response } from "express";
import shipmentRouter from "./routes/shipment.routes";
import vehicleRouter from "./routes/vehicle.routes";
import tripSheetRouter from "./routes/tripSheet.routes";
import driverRouter from "./routes/driver.routes";
import invoiceRouter from "./routes/invoice.routes";
import documentRouter from "./routes/document.routes";
import dashboardRouter from "./routes/dashboard.routes";
import fleetRouter from "./routes/fleet.routes";
import analyticsRouter from "./routes/analytics.routes";
import mlAnalyticsRouter from "./routes/mlAnalytics.routes";
import dispatchRouter from "./routes/dispatch.routes";
import routingRouter from "./routes/routing.routes";
import monitoringRouter from "./routes/monitoring.routes";
import complianceRouter from "./routes/compliance.routes";
import mlRouter from "./routes/ml.routes";
import maintenanceRouter from "./routes/maintenance.routes";
// Audit trail still requires migration
// import auditRouter from "./routes/audit.routes";

const cors = require("cors");
import helmet from "helmet";


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
app.use(helmet());

// Security: Audit Logger
app.use((req, res, next) => {
	const start = Date.now();
	const requestId = Math.random().toString(36).substring(7); // Simple ID
	res.on('finish', () => {
		const duration = Date.now() - start;
		// Log sensitive actions
		if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
			console.log(`[AUDIT] [${requestId}] ${req.method} ${req.originalUrl} - User: ${req.headers['x-user-id'] || 'Anon'} - Status: ${res.statusCode} (${duration}ms)`);
		}
	});
	next();
});

// Security: Input Sanitization (Handled via Zod in controllers)
// Middleware removed due to compatibility issues with Express 5 req.query immutability

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
app.use("/api/analytics", analyticsRouter);
app.use("/api/ml-analytics", mlAnalyticsRouter);
app.use("/api/dispatch", dispatchRouter);
app.use("/api/routing", routingRouter);
app.use("/api/monitoring", monitoringRouter);
app.use("/api/compliance", complianceRouter);
app.use("/api/ml", mlRouter);
app.use("/api/maintenance", maintenanceRouter);
// Audit trail still requires migration
// app.use("/api/audit", auditRouter);

// Centralized error handler (must be last)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	// eslint-disable-next-line no-console
	console.error("Unhandled Error:", err);
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
