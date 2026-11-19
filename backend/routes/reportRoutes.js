import express from "express";
import {
  getAdminDashboardStats,
  getStaffPerformanceStats
} from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Admin dashboard stats
router.get("/admin-dashboard", authorize("admin"), getAdminDashboardStats);

// Staff personal performance stats
router.get("/staff-performance", authorize("staff"), getStaffPerformanceStats);

export default router;
