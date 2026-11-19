import express from "express";
import {
  createEmployee,
  getEmployees,
  updateEmployee
} from "../controllers/employeeController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

// Admin routes for employee management
router.post("/", createEmployee);
router.get("/", getEmployees);
router.put("/:id", updateEmployee);

export default router;
