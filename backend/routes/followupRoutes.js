
import express from "express";

import {
  createFollowup,
  getMyFollowups,
  updateFollowupStatus,
  getAllFollowups
} from "../controllers/followupController.js";

import {
  authenticate,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("staff"), createFollowup);

router.get(
  "/my-followups",
  authorize("staff"),
  getMyFollowups
);

router.patch(
  "/:id/status",
  authorize("staff"),
  updateFollowupStatus
);

router.get("/", authorize("admin"), getAllFollowups);

export default router;
