import express from "express";
import {
  assignLead,
  bulkAssignLeads,
  autoDistributeLeads,
  getAssignments,
  getMyAssignedLeads
} from "../controllers/assignmentController.js";
import {
  authenticate,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Admin routes
router.post("/", authorize("admin"), assignLead);
router.post("/bulk", authorize("admin"), bulkAssignLeads);
router.post("/auto-distribute", authorize("admin"), autoDistributeLeads);
router.get("/", authorize("admin"), getAssignments);

// Staff route
router.get("/my-leads", authorize("staff"), getMyAssignedLeads);

export default router;
