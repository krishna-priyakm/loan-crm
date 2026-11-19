
import pool from "../config/db.js";

// ASSIGN LEAD TO EMPLOYEE (ADMIN)
export const assignLead = async (req, res) => {
  const client = await pool.connect();

  try {
    const { lead_id, employee_id } = req.body;

    if (!lead_id || !employee_id) {
      return res.status(400).json({
        message: "Lead ID and employee ID are required"
      });
    }

    await client.query("BEGIN");

    // Check whether lead exists
    const lead = await client.query(
      "SELECT id FROM leads WHERE id = $1",
      [lead_id]
    );

    if (lead.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    // Check whether employee exists and is active
    const employee = await client.query(
      `SELECT e.id, u.name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1 AND u.is_active = TRUE`,
      [employee_id]
    );

    if (employee.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Active employee not found"
      });
    }

    // Deactivate previous assignment, if any
    await client.query(
      `UPDATE lead_assignments
       SET is_active = FALSE
       WHERE lead_id = $1 AND is_active = TRUE`,
      [lead_id]
    );

    // Create new assignment
    const result = await client.query(
      `INSERT INTO lead_assignments
       (lead_id, employee_id, assigned_by, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [lead_id, employee_id, req.user.id]
    );

    // Update lead status
    await client.query(
      `UPDATE leads
       SET status = 'assigned',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [lead_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Lead assigned successfully",
      assignment: result.rows[0],
      employee: employee.rows[0].name
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Assign lead error:", error);

    res.status(500).json({
      message: "Failed to assign lead"
    });

  } finally {
    client.release();
  }
};


// GET ALL ACTIVE ASSIGNMENTS (ADMIN)
export const getAssignments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         la.id AS assignment_id,
         la.lead_id,
         la.employee_id,
         la.assigned_at,
         l.customer_name,
         l.phone,
         l.loan_type,
         l.loan_amount,
         e.employee_code,
         u.name AS employee_name
       FROM lead_assignments la
       JOIN leads l ON la.lead_id = l.id
       JOIN employees e ON la.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE la.is_active = TRUE
       ORDER BY la.assigned_at DESC`
    );

    res.status(200).json({
      total: result.rows.length,
      assignments: result.rows
    });

  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      message: "Failed to fetch assignments"
    });
  }
};


// GET LOGGED-IN STAFF MEMBER'S ASSIGNED LEADS
export const getMyAssignedLeads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         la.id AS assignment_id,
         la.assigned_at,
         l.*
       FROM employees e
       JOIN lead_assignments la ON e.id = la.employee_id
       JOIN leads l ON la.lead_id = l.id
       WHERE e.user_id = $1
         AND la.is_active = TRUE
       ORDER BY la.assigned_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      total: result.rows.length,
      leads: result.rows
    });

  } catch (error) {
    console.error("Get staff leads error:", error);

    res.status(500).json({
      message: "Failed to fetch assigned leads"
    });
  }
};

// BULK ASSIGN LEADS TO AN EMPLOYEE (ADMIN)
export const bulkAssignLeads = async (req, res) => {
  const client = await pool.connect();
  try {
    const { lead_ids, employee_id } = req.body;

    if (!Array.isArray(lead_ids) || lead_ids.length === 0 || !employee_id) {
      return res.status(400).json({ message: "lead_ids array and employee_id are required" });
    }

    await client.query("BEGIN");

    // Deactivate previous assignments
    await client.query(
      `UPDATE lead_assignments
       SET is_active = FALSE
       WHERE lead_id = ANY($1::int[]) AND is_active = TRUE`,
      [lead_ids]
    );

    // Insert new assignments
    for (const id of lead_ids) {
      await client.query(
        `INSERT INTO lead_assignments (lead_id, employee_id, assigned_by, is_active)
         VALUES ($1, $2, $3, TRUE)`,
        [id, employee_id, req.user.id]
      );
    }

    // Update lead status
    await client.query(
      `UPDATE leads 
       SET status = 'assigned', updated_at = NOW()
       WHERE id = ANY($1::int[])`,
      [lead_ids]
    );

    await client.query("COMMIT");

    res.json({
      message: `Successfully assigned ${lead_ids.length} leads`,
      assigned_count: lead_ids.length
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Bulk assign error:", error);
    res.status(500).json({ message: "Failed to bulk assign leads" });
  } finally {
    client.release();
  }
};

// AUTO-DISTRIBUTE UNASSIGNED LEADS EVENLY AMONG ACTIVE EMPLOYEES (ADMIN)
export const autoDistributeLeads = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find active employees
    const employees = await client.query(
      `SELECT e.id, u.name 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE u.is_active = TRUE 
       ORDER BY e.id ASC`
    );

    if (employees.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No active employees found to distribute leads to" });
    }

    // Find all unassigned leads or leads with status 'new'
    const unassignedLeads = await client.query(
      `SELECT l.id FROM leads l
       WHERE NOT EXISTS (
         SELECT 1 FROM lead_assignments la WHERE la.lead_id = l.id AND la.is_active = TRUE
       ) OR l.status = 'new'
       ORDER BY l.id ASC`
    );

    if (unassignedLeads.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(200).json({
        message: "No unassigned leads available for distribution",
        distributed_count: 0
      });
    }

    const empCount = employees.rows.length;
    let distributed = 0;

    for (let i = 0; i < unassignedLeads.rows.length; i++) {
      const leadId = unassignedLeads.rows[i].id;
      const targetEmp = employees.rows[i % empCount];

      // Deactivate any old active assignment
      await client.query(
        "UPDATE lead_assignments SET is_active = FALSE WHERE lead_id = $1 AND is_active = TRUE",
        [leadId]
      );

      // Insert new assignment
      await client.query(
        `INSERT INTO lead_assignments (lead_id, employee_id, assigned_by, is_active)
         VALUES ($1, $2, $3, TRUE)`,
        [leadId, targetEmp.id, req.user.id]
      );

      // Update lead status
      await client.query(
        "UPDATE leads SET status = 'assigned', updated_at = NOW() WHERE id = $1",
        [leadId]
      );

      distributed++;
    }

    await client.query("COMMIT");

    res.json({
      message: `Successfully auto-distributed ${distributed} leads among ${empCount} employees`,
      distributed_count: distributed,
      employees_count: empCount
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Auto distribute error:", error);
    res.status(500).json({ message: "Failed to auto-distribute leads" });
  } finally {
    client.release();
  }
};

