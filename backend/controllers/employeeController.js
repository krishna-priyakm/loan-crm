
import pool from "../config/db.js";
import bcrypt from "bcryptjs";

// CREATE STAFF ACCOUNT
export const createEmployee = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      email,
      password,
      employee_code,
      phone,
      designation,
      joining_date
    } = req.body;

    if (!name || !email || !password || !employee_code) {
      return res.status(400).json({
        message: "Name, email, password and employee code are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'staff')
       RETURNING id, name, email, role`,
      [name, email, hashedPassword]
    );

    const user = userResult.rows[0];

    const employeeResult = await client.query(
      `INSERT INTO employees
       (user_id, employee_code, phone, designation, joining_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        user.id,
        employee_code,
        phone || null,
        designation || "Call Centre Executive",
        joining_date || null
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Employee created successfully",
      employee: {
        ...employeeResult.rows[0],
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create employee error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email or employee code already exists"
      });
    }

    return res.status(500).json({
      message: "Failed to create employee"
    });

  } finally {
    client.release();
  }
};


// GET ALL EMPLOYEES
export const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.employee_code,
         e.phone,
         e.designation,
         e.joining_date,
         u.name,
         u.email,
         u.is_active
       FROM employees e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.id DESC`
    );

    res.status(200).json({
      employees: result.rows
    });

  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      message: "Failed to fetch employees"
    });
  }
};

// UPDATE EMPLOYEE / ACCESS CONTROL (ADMIN)
export const updateEmployee = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, phone, designation, is_active, password } = req.body;

    await client.query("BEGIN");

    const empRes = await client.query("SELECT user_id FROM employees WHERE id = $1", [id]);
    if (empRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Employee not found" });
    }

    const userId = empRes.rows[0].user_id;

    if (name !== undefined || is_active !== undefined || password) {
      const userUpdates = [];
      const userValues = [];
      if (name !== undefined) {
        userValues.push(name);
        userUpdates.push(`name = $${userValues.length}`);
      }
      if (is_active !== undefined) {
        userValues.push(is_active);
        userUpdates.push(`is_active = $${userValues.length}`);
      }
      if (password && password.length >= 8) {
        const hash = await bcrypt.hash(password, 12);
        userValues.push(hash);
        userUpdates.push(`password_hash = $${userValues.length}`);
      }

      if (userUpdates.length > 0) {
        userValues.push(userId);
        await client.query(
          `UPDATE users SET ${userUpdates.join(", ")} WHERE id = $${userValues.length}`,
          userValues
        );
      }
    }

    if (phone !== undefined || designation !== undefined) {
      const empUpdates = [];
      const empValues = [];
      if (phone !== undefined) {
        empValues.push(phone);
        empUpdates.push(`phone = $${empValues.length}`);
      }
      if (designation !== undefined) {
        empValues.push(designation);
        empUpdates.push(`designation = $${empValues.length}`);
      }
      if (empUpdates.length > 0) {
        empValues.push(id);
        await client.query(
          `UPDATE employees SET ${empUpdates.join(", ")} WHERE id = $${empValues.length}`,
          empValues
        );
      }
    }

    await client.query("COMMIT");

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update employee error:", error);
    res.status(500).json({ message: "Failed to update employee" });
  } finally {
    client.release();
  }
};

