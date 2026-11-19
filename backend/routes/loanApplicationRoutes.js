import express from "express";
import {
  createLoanApplication,
  getAllApplications,
  getMyApplications,
  updateApplicationStatus
} from "../controllers/loanApplicationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Staff routes
router.post("/", createLoanApplication);
router.get("/my-applications", authorize("staff"), getMyApplications);

// Admin routes
router.get("/", authorize("admin"), getAllApplications);
router.patch("/:id/status", updateApplicationStatus);

export default router;
