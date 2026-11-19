
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  verifyDocument
} from "../controllers/documentController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create uploads directory automatically
const uploadDir = "uploads/documents";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// Allow PDF, JPG, PNG and DOCX files
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, PNG and DOCX files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authenticate);

// Staff routes
router.post("/", authorize("staff"), upload.single("document"), uploadDocument);
router.get("/my-documents", authorize("staff"), getMyDocuments);

// Document listing (Admin sees all, Staff sees relevant)
router.get("/", getAllDocuments);
router.patch("/:id/verify", authorize("admin"), verifyDocument);

export default router;
