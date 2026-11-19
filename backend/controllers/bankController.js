import pool from "../config/db.js";

// GET ALL BANKS WITH THEIR SCHEMES
export const getBanks = async (req, res) => {
  try {
    const banksResult = await pool.query(
      "SELECT * FROM banks ORDER BY id ASC"
    );

    const schemesResult = await pool.query(
      `SELECT ls.*, b.bank_name 
       FROM loan_schemes ls
       JOIN banks b ON ls.bank_id = b.id
       ORDER BY ls.id ASC`
    );

    const banks = banksResult.rows.map(bank => {
      return {
        ...bank,
        schemes: schemesResult.rows.filter(s => s.bank_id === bank.id)
      };
    });

    res.json({
      banks,
      schemes: schemesResult.rows
    });
  } catch (error) {
    console.error("Get banks error:", error);
    res.status(500).json({ message: "Failed to fetch banks" });
  }
};

// CREATE NEW BANK (ADMIN)
export const createBank = async (req, res) => {
  try {
    const { bank_name, contact_person, phone, email } = req.body;

    if (!bank_name) {
      return res.status(400).json({ message: "Bank name is required" });
    }

    const result = await pool.query(
      `INSERT INTO banks (bank_name, contact_person, phone, email, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [bank_name, contact_person || null, phone || null, email || null]
    );

    res.status(201).json({
      message: "Bank created successfully",
      bank: result.rows[0]
    });
  } catch (error) {
    console.error("Create bank error:", error);
    res.status(500).json({ message: "Failed to create bank" });
  }
};

// UPDATE BANK (ADMIN)
export const updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, contact_person, phone, email, is_active } = req.body;

    const result = await pool.query(
      `UPDATE banks
       SET bank_name = COALESCE($1, bank_name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [bank_name, contact_person, phone, email, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bank not found" });
    }

    res.json({
      message: "Bank updated successfully",
      bank: result.rows[0]
    });
  } catch (error) {
    console.error("Update bank error:", error);
    res.status(500).json({ message: "Failed to update bank" });
  }
};

// CREATE LOAN SCHEME (ADMIN)
export const createScheme = async (req, res) => {
  try {
    const { bank_id, scheme_name, loan_type, interest_rate, min_amount, max_amount } = req.body;

    if (!bank_id || !scheme_name || !interest_rate) {
      return res.status(400).json({ message: "Bank, scheme name, and interest rate are required" });
    }

    const result = await pool.query(
      `INSERT INTO loan_schemes 
       (bank_id, scheme_name, loan_type, interest_rate, min_amount, max_amount, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [bank_id, scheme_name, loan_type || 'Personal Loan', interest_rate, min_amount || 0, max_amount || 10000000]
    );

    res.status(201).json({
      message: "Loan scheme created successfully",
      scheme: result.rows[0]
    });
  } catch (error) {
    console.error("Create scheme error:", error);
    res.status(500).json({ message: "Failed to create scheme" });
  }
};

// UPDATE LOAN SCHEME (ADMIN)
export const updateScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheme_name, loan_type, interest_rate, min_amount, max_amount, is_active } = req.body;

    const result = await pool.query(
      `UPDATE loan_schemes
       SET scheme_name = COALESCE($1, scheme_name),
           loan_type = COALESCE($2, loan_type),
           interest_rate = COALESCE($3, interest_rate),
           min_amount = COALESCE($4, min_amount),
           max_amount = COALESCE($5, max_amount),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [scheme_name, loan_type, interest_rate, min_amount, max_amount, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    res.json({
      message: "Loan scheme updated successfully",
      scheme: result.rows[0]
    });
  } catch (error) {
    console.error("Update scheme error:", error);
    res.status(500).json({ message: "Failed to update scheme" });
  }
};

// DELETE SCHEME
export const deleteScheme = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM loan_schemes WHERE id = $1", [id]);
    res.json({ message: "Loan scheme deleted successfully" });
  } catch (error) {
    console.error("Delete scheme error:", error);
    res.status(500).json({ message: "Failed to delete scheme" });
  }
};
