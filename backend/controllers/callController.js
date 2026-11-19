
import pool from "../config/db.js";

// RECORD A CUSTOMER CALL (STAFF)
export const recordCall = async (req, res) => {
  try {
    const { lead_id, call_status, remarks } = req.body;

    if (!lead_id || !call_status) {
      return res.status(400).json({
        message: "Lead ID and call status are required"
      });
    }

    const allowedStatuses = [
      "interested",
      "not_interested",
      "follow_up",
      "no_answer",
      "busy",
      "converted"
    ];

    if (!allowedStatuses.includes(call_status)) {
      return res.status(400).json({
        message: "Invalid call status"
      });
    }

    // Find the logged-in employee
    const employeeResult = await pool.query(
      `SELECT id FROM employees WHERE user_id = $1`,
      [req.user.id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Employee profile not found"
      });
    }

    const employee_id = employeeResult.rows[0].id;

    // Verify that this lead is assigned to this employee
    const assignment = await pool.query(
      `SELECT id FROM lead_assignments
       WHERE lead_id = $1
         AND employee_id = $2
         AND is_active = TRUE`,
      [lead_id, employee_id]
    );

    if (assignment.rows.length === 0) {
      return res.status(403).json({
        message: "This lead is not assigned to you"
      });
    }

    // Record call
    const result = await pool.query(
      `INSERT INTO calls
       (lead_id, employee_id, call_status, remarks)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [lead_id, employee_id, call_status, remarks || null]
    );

    // Update lead status
    await pool.query(
      `UPDATE leads
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [
        call_status === "interested" ? "interested" :
        call_status === "not_interested" ? "not_interested" :
        call_status === "converted" ? "converted" :
        call_status === "follow_up" ? "follow_up" :
        "contacted",
        lead_id
      ]
    );

    res.status(201).json({
      message: "Call recorded successfully",
      call: result.rows[0]
    });

  } catch (error) {
    console.error("Record call error:", error);

    res.status(500).json({
      message: "Failed to record call"
    });
  }
};


// GET CALL HISTORY FOR LOGGED-IN STAFF
export const getMyCallHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.*,
         l.customer_name,
         l.phone
       FROM calls c
       JOIN leads l ON c.lead_id = l.id
       JOIN employees e ON c.employee_id = e.id
       WHERE e.user_id = $1
       ORDER BY c.id DESC`,
      [req.user.id]
    );

    res.status(200).json({
      total: result.rows.length,
      calls: result.rows
    });

  } catch (error) {
    console.error("Call history error:", error);

    res.status(500).json({
      message: "Failed to fetch call history"
    });
  }
};


// ADMIN: VIEW ALL CALL RECORDS
export const getAllCalls = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.*,
         l.customer_name,
         l.phone,
         u.name AS employee_name
       FROM calls c
       JOIN leads l ON c.lead_id = l.id
       JOIN employees e ON c.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       ORDER BY c.id DESC`
    );

    res.status(200).json({
      total: result.rows.length,
      calls: result.rows
    });

  } catch (error) {
    console.error("All calls error:", error);

    res.status(500).json({
      message: "Failed to fetch calls"
    });
  }
};
