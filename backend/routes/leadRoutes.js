import express from "express";
import {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  bulkUploadLeads,
  getLeadById
} from "../controllers/leadController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// View single lead details (Admin & Staff)
router.get("/:id", getLeadById);

// Update lead (Admin & Staff)
router.put("/:id", updateLead);

// Admin-only lead management
router.post("/bulk-upload", authorize("admin"), bulkUploadLeads);
router.post("/", authorize("admin"), createLead);
router.get("/", authorize("admin"), getLeads);
router.delete("/:id", authorize("admin"), deleteLead);

export default router;
