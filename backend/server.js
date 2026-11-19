import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import followupRoutes from "./routes/followupRoutes.js";
import dailyTargetRoutes from "./routes/dailyTargetRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import loanApplicationRoutes from "./routes/loanApplicationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploaded documents
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/followups", followupRoutes);
app.use("/api/daily-targets", dailyTargetRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/loan-applications", loanApplicationRoutes);
app.use("/api/reports", reportRoutes);

// Health check / Test route
app.get("/", (req, res) => {
  res.json({
    message: "Loan CRM API is running successfully",
    status: "online",
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
