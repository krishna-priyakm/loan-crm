import express from "express";
import {
  getBanks,
  createBank,
  updateBank,
  createScheme,
  updateScheme,
  deleteScheme
} from "../controllers/bankController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// View banks and schemes (accessible by both Admin and Staff)
router.get("/", getBanks);

// Admin-only management
router.post("/", authorize("admin"), createBank);
router.put("/:id", authorize("admin"), updateBank);

router.post("/schemes", authorize("admin"), createScheme);
router.put("/schemes/:id", authorize("admin"), updateScheme);
router.delete("/schemes/:id", authorize("admin"), deleteScheme);

export default router;
