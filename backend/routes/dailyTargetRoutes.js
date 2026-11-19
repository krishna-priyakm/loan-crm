
import express from "express";
import {
  setDailyTarget,
  getMyDailyTarget,
  getAllDailyPerformance
} from "../controllers/dailyTargetController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Admin routes
router.post("/", authorize("admin"), setDailyTarget);
router.get("/performance", authorize("admin"), getAllDailyPerformance);

// Staff route
router.get("/my-target", authorize("staff"), getMyDailyTarget);

export default router;
