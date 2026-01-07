import express from "express";
import { listDocuments, createDocument } from "../controllers/document.controller";

const router = express.Router();

// Mounted at /api/documents
router.get("/", listDocuments);
router.post("/", createDocument);

export default router;
export { router as documentRouter };
