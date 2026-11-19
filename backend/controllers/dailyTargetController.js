
import pool from "../config/db.js";

// Admin: Set daily target for an employee
export const setDailyTarget = async (req, res) => {
  try {
    const { employee_id, target_date, call_target } = req.body;

    if (!employee_id || !target_date || !call_target || call_target <= 0) {
      return res.status(400).json({
        message: "Employee ID, target date and valid call target are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO daily_targets
       (employee_id, target_date, call_target, calls_completed)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (employee_id, target_date)
       DO UPDATE SET call_target = EXCLUDED.call_target
       RETURNING *`,
      [employee_id, target_date, call_target]
    );

    res.status(201).json({
      message: "Daily target assigned successfully",
      target: result.rows[0]
    });
  } catch (error) {
    console.error("Set daily target error:", error);
    res.status(500).json({ message: "Failed to set daily target" });
  }
};

// Staff: View own daily target and performance
export const getMyDailyTarget = async (req, res) => {
  try {
    const employeeResult = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const employeeId = employeeResult.rows[0].id;

    const result = await pool.query(
      `SELECT
         dt.id,
         dt.target_date,
         dt.call_target,
         COUNT(c.id)::int AS calls_completed,
         CASE
           WHEN dt.call_target > 0
           THEN ROUND(COUNT(c.id) * 100.0 / dt.call_target, 2)
           ELSE 0
         END AS achievement_percentage
       FROM daily_targets dt
       LEFT JOIN calls c
         ON c.employee_id = dt.employee_id
         AND DATE(c.created_at) = dt.target_date
       WHERE dt.employee_id = $1
         AND dt.target_date = CURRENT_DATE
       GROUP BY dt.id`,
      [employeeId]
    );

    res.json({
      target: result.rows[0] || null
    });
  } catch (error) {
    console.error("Get daily target error:", error);
    res.status(500).json({ message: "Failed to fetch daily target" });
  }
};

// Admin: View all employees' daily performance
export const getAllDailyPerformance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         e.id AS employee_id,
         e.employee_code,
         u.name AS employee_name,
         dt.target_date,
         dt.call_target,
         COUNT(c.id)::int AS calls_completed,
         CASE
           WHEN dt.call_target > 0
           THEN ROUND(COUNT(c.id) * 100.0 / dt.call_target, 2)
           ELSE 0
         END AS achievement_percentage
       FROM daily_targets dt
       JOIN employees e ON e.id = dt.employee_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN calls c
         ON c.employee_id = dt.employee_id
         AND DATE(c.created_at) = dt.target_date
       GROUP BY e.id, e.employee_code, u.name,
                dt.target_date, dt.call_target
       ORDER BY dt.target_date DESC, employee_name`,
    );

    res.json({ performance: result.rows });
  } catch (error) {
    console.error("Get daily performance error:", error);
    res.status(500).json({ message: "Failed to fetch performance" });
  }
};
