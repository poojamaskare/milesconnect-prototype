import express from "express";
import { getInvoice, listInvoices } from "../controllers/invoice.controller";

const router = express.Router();

// Mounted at /api/invoices
router.get("/", listInvoices);
router.get("/:id", getInvoice);

export default router;
export { router as invoiceRouter };
