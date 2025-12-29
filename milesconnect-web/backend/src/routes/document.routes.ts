import express from "express";
import { listDocuments } from "../controllers/document.controller";

const router = express.Router();

// Mounted at /api/documents
router.get("/", listDocuments);

export default router;
export { router as documentRouter };
