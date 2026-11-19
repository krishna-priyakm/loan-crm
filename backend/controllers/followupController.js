
import pool from "../config/db.js";

// CREATE FOLLOW-UP (STAFF)
export const createFollowup = async (req, res) => {
  try {
    const { lead_id, scheduled_at, remarks } = req.body;

    if (!lead_id || !scheduled_at) {
      return res.status(400).json({
        message: "Lead ID and scheduled date/time are required"
      });
    }

    const date = new Date(scheduled_at);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid scheduled date/time"
      });
    }

    if (date <= new Date()) {
      return res.status(400).json({
        message: "Follow-up must be scheduled in the future"
      });
    }

    // Find logged-in employee
    const employeeResult = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Employee profile not found"
      });
    }

    const employee_id = employeeResult.rows[0].id;

    // Verify lead assignment
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

    const result = await pool.query(
      `INSERT INTO followups
       (lead_id, employee_id, scheduled_at, remarks, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [lead_id, employee_id, date, remarks || null]
    );

    res.status(201).json({
      message: "Follow-up scheduled successfully",
      followup: result.rows[0]
    });

  } catch (error) {
    console.error("Create follow-up error:", error);

    res.status(500).json({
      message: "Failed to schedule follow-up"
    });
  }
};


// STAFF: VIEW MY FOLLOW-UPS
export const getMyFollowups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         f.*,
         l.customer_name,
         l.phone,
         l.loan_type
       FROM followups f
       JOIN leads l ON f.lead_id = l.id
       JOIN employees e ON f.employee_id = e.id
       WHERE e.user_id = $1
       ORDER BY f.scheduled_at ASC`,
      [req.user.id]
    );

    res.status(200).json({
      total: result.rows.length,
      followups: result.rows
    });

  } catch (error) {
    console.error("Get follow-ups error:", error);

    res.status(500).json({
      message: "Failed to fetch follow-ups"
    });
  }
};


// STAFF: UPDATE FOLLOW-UP STATUS
export const updateFollowupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "completed",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid follow-up status"
      });
    }

    const result = await pool.query(
      `UPDATE followups f
       SET status = $1
       FROM employees e
       WHERE f.id = $2
         AND f.employee_id = e.id
         AND e.user_id = $3
       RETURNING f.*`,
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Follow-up not found or not assigned to you"
      });
    }

    res.status(200).json({
      message: "Follow-up status updated successfully",
      followup: result.rows[0]
    });

  } catch (error) {
    console.error("Update follow-up error:", error);

    res.status(500).json({
      message: "Failed to update follow-up"
    });
  }
};


// ADMIN: VIEW ALL FOLLOW-UPS
export const getAllFollowups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         f.*,
         l.customer_name,
         l.phone,
         u.name AS employee_name
       FROM followups f
       JOIN leads l ON f.lead_id = l.id
       JOIN employees e ON f.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       ORDER BY f.scheduled_at ASC`
    );

    res.status(200).json({
      total: result.rows.length,
      followups: result.rows
    });

  } catch (error) {
    console.error("Get all follow-ups error:", error);

    res.status(500).json({
      message: "Failed to fetch follow-ups"
    });
  }
};
