
import pool from "../config/db.js";

// Staff: Upload customer document
export const uploadDocument = async (req, res) => {
  try {
    const { lead_id, document_name } = req.body;

    if (!lead_id || !document_name || !req.file) {
      return res.status(400).json({
        message: "Lead ID, document name and file are required"
      });
    }

    const employeeResult = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Employee profile not found"
      });
    }

    const employeeId = employeeResult.rows[0].id;

    const assignment = await pool.query(
      `SELECT id FROM lead_assignments
       WHERE lead_id = $1 AND employee_id = $2 AND is_active = TRUE`,
      [lead_id, employeeId]
    );

    if (assignment.rows.length === 0) {
      return res.status(403).json({
        message: "You are not assigned to this lead"
      });
    }

    const result = await pool.query(
      `INSERT INTO documents
       (lead_id, document_name, file_path, verification_status, uploaded_by)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING *`,
      [lead_id, document_name, req.file.path, employeeId]
    );

    res.status(201).json({
      message: "Document uploaded successfully",
      document: result.rows[0]
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: "Document upload failed" });
  }
};

// Staff: View documents uploaded by them
export const getMyDocuments = async (req, res) => {
  try {
    const employeeResult = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Employee profile not found"
      });
    }

    const result = await pool.query(
      `SELECT * FROM documents
       WHERE uploaded_by = $1
       ORDER BY uploaded_at DESC`,
      [employeeResult.rows[0].id]
    );

    res.json({ documents: result.rows });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// View uploaded documents (Admin sees all, Staff sees their own or assigned lead's)
export const getAllDocuments = async (req, res) => {
  try {
    const { lead_id, status } = req.query;

    let query = `
      SELECT d.*, l.customer_name, u.name AS uploaded_by_name, v.name AS verified_by_name
      FROM documents d
      LEFT JOIN leads l ON l.id = d.lead_id
      LEFT JOIN employees e ON e.id = d.uploaded_by
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN users v ON v.id = d.verified_by
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === "staff") {
      const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [req.user.id]);
      const empId = empRes.rows[0]?.id;
      if (empId) {
        params.push(empId);
        query += ` AND (d.uploaded_by = $${params.length} OR EXISTS (
          SELECT 1 FROM lead_assignments la WHERE la.lead_id = d.lead_id AND la.employee_id = $${params.length} AND la.is_active = TRUE
        ))`;
      }
    }

    if (lead_id) {
      params.push(lead_id);
      query += ` AND d.lead_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND d.verification_status = $${params.length}`;
    }

    query += ` ORDER BY d.uploaded_at DESC`;

    const result = await pool.query(query, params);
    res.json({ documents: result.rows });
  } catch (error) {
    console.error("Get all documents error:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// Admin: Verify or reject document
export const verifyDocument = async (req, res) => {
  try {
    const { status } = req.body;
    const documentId = req.params.id;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be verified or rejected"
      });
    }

    const result = await pool.query(
      `UPDATE documents
       SET verification_status = $1,
           verified_by = $2
       WHERE id = $3
       RETURNING *`,
      [status, req.user.id, documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      message: `Document ${status} successfully`,
      document: result.rows[0]
    });
  } catch (error) {
    console.error("Verify document error:", error);
    res.status(500).json({ message: "Document verification failed" });
  }
};
