
import pool from "../config/db.js";

// CREATE NEW LEAD
export const createLead = async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      email,
      city,
      loan_type,
      loan_amount,
      source
    } = req.body;

    if (!customer_name || !phone) {
      return res.status(400).json({
        message: "Customer name and phone are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO leads
       (customer_name, phone, email, city, loan_type,
        loan_amount, source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        customer_name,
        phone,
        email || null,
        city || null,
        loan_type || null,
        loan_amount || null,
        source || null,
        req.user.id
      ]
    );

    res.status(201).json({
      message: "Lead created successfully",
      lead: result.rows[0]
    });

  } catch (error) {
    console.error("Create lead error:", error);

    res.status(500).json({
      message: "Failed to create lead"
    });
  }
};


// GET ALL LEADS + SEARCH + FILTER
export const getLeads = async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = `
      SELECT
        l.*,
        u.name AS created_by_name
      FROM leads l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE 1=1
    `;

    const values = [];

    if (search) {
      values.push(`%${search}%`);
      query += `
        AND (
          l.customer_name ILIKE $${values.length}
          OR l.phone ILIKE $${values.length}
          OR l.email ILIKE $${values.length}
          OR l.city ILIKE $${values.length}
        )
      `;
    }

    if (status) {
      values.push(status);
      query += ` AND l.status = $${values.length}`;
    }

    query += " ORDER BY l.created_at DESC";

    const result = await pool.query(query, values);

    res.status(200).json({
      total: result.rows.length,
      leads: result.rows
    });

  } catch (error) {
    console.error("Get leads error:", error);

    res.status(500).json({
      message: "Failed to fetch leads"
    });
  }
};


// UPDATE LEAD
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "customer_name",
      "phone",
      "email",
      "city",
      "loan_type",
      "loan_amount",
      "source",
      "status"
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        values.push(req.body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update"
      });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE leads
       SET ${updates.join(", ")},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead: result.rows[0]
    });

  } catch (error) {
    console.error("Update lead error:", error);

    res.status(500).json({
      message: "Failed to update lead"
    });
  }
};


// DELETE LEAD
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM leads
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    res.status(200).json({
      message: "Lead deleted successfully"
    });

  } catch (error) {
    console.error("Delete lead error:", error);

    res.status(500).json({
      message: "Failed to delete lead"
    });
  }
};

// BULK UPLOAD LEADS (ADMIN)
export const bulkUploadLeads = async (req, res) => {
  const client = await pool.connect();
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "Invalid or empty leads array" });
    }

    await client.query("BEGIN");
    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < leads.length; i++) {
      const item = leads[i];
      if (!item.customer_name || !item.phone) {
        errors.push(`Row ${i + 1}: Name and phone are required`);
        continue;
      }

      await client.query(
        `INSERT INTO leads 
         (customer_name, phone, email, city, loan_type, loan_amount, source, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8)`,
        [
          item.customer_name,
          String(item.phone),
          item.email || null,
          item.city || null,
          item.loan_type || "Personal Loan",
          item.loan_amount ? Number(item.loan_amount) : null,
          item.source || "Bulk Upload",
          req.user.id
        ]
      );
      insertedCount++;
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: `Successfully uploaded ${insertedCount} leads`,
      count: insertedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Bulk upload leads error:", error);
    res.status(500).json({ message: "Failed to bulk upload leads" });
  } finally {
    client.release();
  }
};

// GET SINGLE LEAD WITH DETAILS (Calls, followups, documents, applications)
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const leadRes = await pool.query(
      `SELECT l.*, u.name AS created_by_name, e.employee_code, ue.name AS assigned_employee_name, e.id AS assigned_employee_id
       FROM leads l
       LEFT JOIN users u ON l.created_by = u.id
       LEFT JOIN lead_assignments la ON la.lead_id = l.id AND la.is_active = TRUE
       LEFT JOIN employees e ON la.employee_id = e.id
       LEFT JOIN users ue ON e.user_id = ue.id
       WHERE l.id = $1`,
      [id]
    );

    if (leadRes.rows.length === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Call history
    const calls = await pool.query(
      `SELECT c.*, u.name AS employee_name
       FROM calls c
       JOIN employees e ON c.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE c.lead_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    // Followups
    const followups = await pool.query(
      `SELECT f.*, u.name AS employee_name
       FROM followups f
       JOIN employees e ON f.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE f.lead_id = $1
       ORDER BY f.scheduled_at DESC`,
      [id]
    );

    // Documents
    const documents = await pool.query(
      `SELECT d.*, u.name AS uploaded_by_name
       FROM documents d
       LEFT JOIN employees e ON d.uploaded_by = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE d.lead_id = $1
       ORDER BY d.uploaded_at DESC`,
      [id]
    );

    // Loan applications
    const applications = await pool.query(
      `SELECT la.*, b.bank_name, ls.scheme_name
       FROM loan_applications la
       JOIN banks b ON la.bank_id = b.id
       LEFT JOIN loan_schemes ls ON la.scheme_id = ls.id
       WHERE la.lead_id = $1
       ORDER BY la.applied_at DESC`,
      [id]
    );

    res.json({
      lead: leadRes.rows[0],
      calls: calls.rows,
      followups: followups.rows,
      documents: documents.rows,
      applications: applications.rows
    });
  } catch (error) {
    console.error("Get lead by ID error:", error);
    res.status(500).json({ message: "Failed to fetch lead details" });
  }
};

