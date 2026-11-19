
import express from "express";

import {
  recordCall,
  getMyCallHistory,
  getAllCalls
} from "../controllers/callController.js";

import {
  authenticate,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Staff routes
router.post("/", authorize("staff"), recordCall);

router.get(
  "/my-history",
  authorize("staff"),
  getMyCallHistory
);

// Admin route
router.get("/", authorize("admin"), getAllCalls);

export default router;
