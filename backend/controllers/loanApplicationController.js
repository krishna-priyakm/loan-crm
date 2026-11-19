import pool from "../config/db.js";

// CREATE NEW LOAN APPLICATION (Staff or Admin)
export const createLoanApplication = async (req, res) => {
  const client = await pool.connect();
  try {
    const { lead_id, bank_id, scheme_id, loan_amount, remarks } = req.body;

    if (!lead_id || !bank_id || !loan_amount) {
      return res.status(400).json({
        message: "Lead, Bank and Loan Amount are required"
      });
    }

    // Resolve employee_id if staff
    let employeeId = null;
    if (req.user.role === "staff") {
      const empRes = await client.query("SELECT id FROM employees WHERE user_id = $1", [req.user.id]);
      if (empRes.rows.length === 0) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      employeeId = empRes.rows[0].id;
    } else {
      // If admin, find if lead has an active assigned employee, else assign to first active employee or null
      const assignRes = await client.query(
        "SELECT employee_id FROM lead_assignments WHERE lead_id = $1 AND is_active = true LIMIT 1",
        [lead_id]
      );
      if (assignRes.rows.length > 0) {
        employeeId = assignRes.rows[0].employee_id;
      } else {
        const anyEmp = await client.query("SELECT id FROM employees LIMIT 1");
        employeeId = anyEmp.rows[0]?.id || null;
      }
    }

    // Generate unique application number
    const appNumber = "APP-" + Date.now().toString().slice(-6) + "-" + Math.floor(Math.random() * 900 + 100);

    const result = await client.query(
      `INSERT INTO loan_applications 
       (lead_id, bank_id, scheme_id, employee_id, application_number, loan_amount, status, applied_at, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW(), $7)
       RETURNING *`,
      [lead_id, bank_id, scheme_id || null, employeeId, appNumber, loan_amount, remarks || null]
    );

    // Update lead status to interested / converted if not already
    await client.query(
      "UPDATE leads SET status = 'interested', updated_at = NOW() WHERE id = $1 AND status NOT IN ('converted', 'closed')",
      [lead_id]
    );

    res.status(201).json({
      message: "Loan application created successfully",
      application: result.rows[0]
    });
  } catch (error) {
    console.error("Create loan application error:", error);
    res.status(500).json({ message: "Failed to create loan application" });
  } finally {
    client.release();
  }
};

// GET ALL APPLICATIONS (Admin)
export const getAllApplications = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        la.*,
        l.customer_name,
        l.phone AS customer_phone,
        l.email AS customer_email,
        l.city AS customer_city,
        b.bank_name,
        ls.scheme_name,
        ls.interest_rate,
        u.name AS employee_name
      FROM loan_applications la
      JOIN leads l ON la.lead_id = l.id
      JOIN banks b ON la.bank_id = b.id
      LEFT JOIN loan_schemes ls ON la.scheme_id = ls.id
      LEFT JOIN employees e ON la.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND la.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        la.application_number ILIKE $${params.length} OR 
        l.customer_name ILIKE $${params.length} OR 
        l.phone ILIKE $${params.length} OR 
        b.bank_name ILIKE $${params.length}
      )`;
    }

    query += " ORDER BY la.applied_at DESC";

    const result = await pool.query(query, params);
    res.json({
      total: result.rows.length,
      applications: result.rows
    });
  } catch (error) {
    console.error("Get all applications error:", error);
    res.status(500).json({ message: "Failed to fetch loan applications" });
  }
};

// GET STAFF APPLICATIONS
export const getMyApplications = async (req, res) => {
  try {
    const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [req.user.id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const employeeId = empRes.rows[0].id;

    const result = await pool.query(
      `SELECT 
        la.*,
        l.customer_name,
        l.phone AS customer_phone,
        b.bank_name,
        ls.scheme_name,
        ls.interest_rate
      FROM loan_applications la
      JOIN leads l ON la.lead_id = l.id
      JOIN banks b ON la.bank_id = b.id
      LEFT JOIN loan_schemes ls ON la.scheme_id = ls.id
      WHERE la.employee_id = $1
      ORDER BY la.applied_at DESC`,
      [employeeId]
    );

    res.json({
      total: result.rows.length,
      applications: result.rows
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    res.status(500).json({ message: "Failed to fetch your loan applications" });
  }
};

// UPDATE APPLICATION STATUS / APPROVAL / CLOSURE
export const updateApplicationStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, approved_amount, disbursed_amount, disbursement_date, remarks } = req.body;

    const allowedStatuses = ["submitted", "under_review", "approved", "rejected", "disbursed", "closed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }

    await client.query("BEGIN");

    const currentApp = await client.query("SELECT * FROM loan_applications WHERE id = $1", [id]);
    if (currentApp.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found" });
    }

    const app = currentApp.rows[0];

    const updated = await client.query(
      `UPDATE loan_applications
       SET status = COALESCE($1, status),
           approved_amount = COALESCE($2, approved_amount),
           disbursed_amount = COALESCE($3, disbursed_amount),
           disbursement_date = COALESCE($4, disbursement_date),
           remarks = COALESCE($5, remarks),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        status,
        approved_amount !== undefined ? approved_amount : null,
        disbursed_amount !== undefined ? disbursed_amount : null,
        disbursement_date || null,
        remarks,
        id
      ]
    );

    // If application status changed to disbursed -> lead status becomes converted
    if (status === "disbursed") {
      await client.query("UPDATE leads SET status = 'converted', updated_at = NOW() WHERE id = $1", [app.lead_id]);
    } else if (status === "closed") {
      await client.query("UPDATE leads SET status = 'closed', updated_at = NOW() WHERE id = $1", [app.lead_id]);
    }

    await client.query("COMMIT");

    res.json({
      message: "Application updated successfully",
      application: updated.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update application error:", error);
    res.status(500).json({ message: "Failed to update loan application" });
  } finally {
    client.release();
  }
};
