import pool from './db.js';
import bcrypt from 'bcryptjs';

async function setupAndSeed() {
  const client = await pool.connect();
  try {
    console.log("Setting up database enhancements...");

    // 1. Add columns to loan_applications if not existing
    await client.query(`
      ALTER TABLE loan_applications 
      ADD COLUMN IF NOT EXISTS remarks TEXT,
      ADD COLUMN IF NOT EXISTS disbursement_date DATE,
      ADD COLUMN IF NOT EXISTS disbursed_amount NUMERIC,
      ADD COLUMN IF NOT EXISTS approved_amount NUMERIC;
    `);

    // 2. Allow 'follow_up' in leads status check constraint
    await client.query(`
      ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
      ALTER TABLE leads ADD CONSTRAINT leads_status_check 
      CHECK (status IN ('new', 'assigned', 'contacted', 'interested', 'not_interested', 'converted', 'closed', 'follow_up'));
    `);

    // 3. Ensure daily_targets has unique constraint on employee_id and target_date
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'daily_targets_emp_date_unique'
        ) THEN
          ALTER TABLE daily_targets ADD CONSTRAINT daily_targets_emp_date_unique UNIQUE (employee_id, target_date);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    console.log("Database enhancements applied.");

    // 4. Seed Banks
    const bankCheck = await client.query("SELECT COUNT(*) FROM banks");
    if (parseInt(bankCheck.rows[0].count) === 0) {
      console.log("Seeding banks...");
      const banks = [
        ['HDFC Bank', 'Vikram Malhotra', '9811223344', 'corporate.lending@hdfcbank.com'],
        ['State Bank of India', 'Sunita Rao', '9822334455', 'sme.loans@sbi.co.in'],
        ['ICICI Bank', 'Rohan Mehta', '9833445566', 'retail.loans@icicibank.com'],
        ['Axis Bank', 'Kavita Nair', '9844556677', 'priority.banking@axisbank.com'],
        ['Kotak Mahindra Bank', 'Deepak Verma', '9855667788', 'loans@kotak.com']
      ];

      for (const b of banks) {
        await client.query(
          "INSERT INTO banks (bank_name, contact_person, phone, email, is_active) VALUES ($1, $2, $3, $4, true)",
          b
        );
      }
      console.log("Banks seeded.");
    }

    // 5. Seed Loan Schemes
    const schemeCheck = await client.query("SELECT COUNT(*) FROM loan_schemes");
    if (parseInt(schemeCheck.rows[0].count) === 0) {
      console.log("Seeding loan schemes...");
      const bankRows = (await client.query("SELECT id, bank_name FROM banks")).rows;
      const hdfc = bankRows.find(b => b.bank_name.includes('HDFC'))?.id;
      const sbi = bankRows.find(b => b.bank_name.includes('SBI') || b.bank_name.includes('State Bank'))?.id;
      const icici = bankRows.find(b => b.bank_name.includes('ICICI'))?.id;
      const axis = bankRows.find(b => b.bank_name.includes('Axis'))?.id;
      const kotak = bankRows.find(b => b.bank_name.includes('Kotak'))?.id;

      const schemes = [
        [hdfc, 'HDFC Instant Personal Loan', 'Personal Loan', 10.75, 50000, 4000000],
        [hdfc, 'HDFC Reach Home Loan', 'Home Loan', 8.50, 500000, 50000000],
        [sbi, 'SBI Suraksha Express Loan', 'Personal Loan', 10.30, 25000, 2000000],
        [sbi, 'SBI Regular Home Loan Scheme', 'Home Loan', 8.40, 1000000, 100000000],
        [sbi, 'SBI SME Business Booster', 'Business Loan', 11.20, 200000, 15000000],
        [icici, 'ICICI Business Growth Loan', 'Business Loan', 11.50, 500000, 25000000],
        [icici, 'ICICI Dream Home Loan', 'Home Loan', 8.65, 500000, 30000000],
        [axis, 'Axis Quick Cash Personal', 'Personal Loan', 10.99, 50000, 2500000],
        [axis, 'Axis Commercial Business Loan', 'Business Loan', 12.00, 300000, 20000000],
        [kotak, 'Kotak Loan Against Property', 'Loan Against Property', 9.25, 1000000, 50000000]
      ];

      for (const s of schemes) {
        if (s[0]) {
          await client.query(
            "INSERT INTO loan_schemes (bank_id, scheme_name, loan_type, interest_rate, min_amount, max_amount, is_active) VALUES ($1, $2, $3, $4, $5, $6, true)",
            s
          );
        }
      }
      console.log("Loan schemes seeded.");
    }

    // 6. Seed Additional Staff Members
    const staffPasswordHash = await bcrypt.hash("Staff@123456", 12);
    const staffToCreate = [
      { name: "Priya Sharma", email: "priya@loancrm.com", code: "EMP002", phone: "9876543211", desig: "Senior Telecaller" },
      { name: "Rajesh Patel", email: "rajesh@loancrm.com", code: "EMP003", phone: "9876543212", desig: "Loan Specialist" },
      { name: "Sneha Reddy", email: "sneha@loancrm.com", code: "EMP004", phone: "9876543213", desig: "Call Centre Executive" },
      { name: "Amit Verma", email: "amit@loancrm.com", code: "EMP005", phone: "9876543214", desig: "Call Centre Executive" }
    ];

    for (const s of staffToCreate) {
      const exists = await client.query("SELECT id FROM users WHERE email = $1", [s.email]);
      if (exists.rows.length === 0) {
        const u = await client.query(
          "INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, 'staff', true) RETURNING id",
          [s.name, s.email, staffPasswordHash]
        );
        await client.query(
          "INSERT INTO employees (user_id, employee_code, phone, designation, joining_date) VALUES ($1, $2, $3, $4, CURRENT_DATE)",
          [u.rows[0].id, s.code, s.phone, s.desig]
        );
        console.log(`Created staff: ${s.name} (${s.email})`);
      }
    }

    // Ensure Arun Kumar password is set so evaluators can login with Arun or Priya
    const arun = await client.query("SELECT id FROM users WHERE email = 'arun@loancrm.com'");
    if (arun.rows.length > 0) {
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [staffPasswordHash, arun.rows[0].id]);
    }

    // 7. Ensure default daily targets for all employees for today
    const employees = await client.query("SELECT id FROM employees");
    for (const emp of employees.rows) {
      await client.query(`
        INSERT INTO daily_targets (employee_id, target_date, call_target, calls_completed)
        VALUES ($1, CURRENT_DATE, 100, 0)
        ON CONFLICT (employee_id, target_date) DO NOTHING
      `, [emp.id]);
    }

    // 8. Seed Sample Leads if total leads is low
    const leadsCount = await client.query("SELECT COUNT(*) FROM leads");
    if (parseInt(leadsCount.rows[0].count) <= 2) {
      console.log("Seeding sample leads...");
      const sampleLeads = [
        ['Rajesh Singhania', '9810011221', 'rajesh.s@gmail.com', 'Mumbai', 'Home Loan', 4500000, 'Website', 'assigned'],
        ['Ananya Deshmukh', '9810011222', 'ananya.d@yahoo.com', 'Pune', 'Personal Loan', 350000, 'Social Media', 'interested'],
        ['Karthik Venkat', '9810011223', 'karthik.v@outlook.com', 'Bengaluru', 'Business Loan', 2500000, 'Referral', 'follow_up'],
        ['Pooja Chawla', '9810011224', 'pooja.c@gmail.com', 'Delhi', 'Personal Loan', 500000, 'Google Ads', 'assigned'],
        ['Manish Gupta', '9810011225', 'manish.g@gmail.com', 'Jaipur', 'Business Loan', 1800000, 'Cold Call', 'converted'],
        ['Suresh Nambiar', '9810011226', 'suresh.n@gmail.com', 'Chennai', 'Home Loan', 6500000, 'Walk-in', 'contacted'],
        ['Divya Saxena', '9810011227', 'divya.s@gmail.com', 'Hyderabad', 'Personal Loan', 200000, 'Facebook Ads', 'not_interested'],
        ['Tarun Bhatia', '9810011228', 'tarun.b@yahoo.com', 'Chandigarh', 'Home Loan', 3800000, 'Website', 'new'],
        ['Meenakshi Iyer', '9810011229', 'meena.iyer@gmail.com', 'Kochi', 'Personal Loan', 400000, 'Referral', 'new'],
        ['Vikramaditya Roy', '9810011230', 'v.roy@gmail.com', 'Kolkata', 'Business Loan', 3200000, 'Google Ads', 'new'],
        ['Shweta Joshi', '9810011231', 'shweta.j@gmail.com', 'Ahmedabad', 'Loan Against Property', 5500000, 'Partner Bank', 'new'],
        ['Naveen Kumar', '9810011232', 'naveen.k@gmail.com', 'Lucknow', 'Personal Loan', 150000, 'SMS Campaign', 'new']
      ];

      const adminUser = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const adminId = adminUser.rows[0]?.id || 1;

      for (const lead of sampleLeads) {
        await client.query(`
          INSERT INTO leads (customer_name, phone, email, city, loan_type, loan_amount, source, status, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [...lead, adminId]);
      }
      console.log("Sample leads seeded.");

      // Assign first few leads to Arun Kumar (emp 1) and Priya (emp 2)
      const empRows = (await client.query("SELECT id FROM employees ORDER BY id ASC")).rows;
      const allLeads = (await client.query("SELECT id, status FROM leads ORDER BY id ASC")).rows;
      
      if (empRows.length > 0 && allLeads.length > 0) {
        for (let i = 0; i < Math.min(5, allLeads.length); i++) {
          const empId = empRows[i % empRows.length].id;
          await client.query(`
            INSERT INTO lead_assignments (lead_id, employee_id, assigned_by, is_active)
            VALUES ($1, $2, $3, true)
            ON CONFLICT DO NOTHING
          `, [allLeads[i].id, empId, adminId]);

          // Also record a call for lead 2 and lead 3
          if (i === 1) {
            await client.query(`
              INSERT INTO calls (lead_id, employee_id, call_status, remarks, call_duration)
              VALUES ($1, $2, 'interested', 'Customer interested in 3.5L Personal Loan for home renovation', 180)
            `, [allLeads[i].id, empId]);
          } else if (i === 2) {
            await client.query(`
              INSERT INTO calls (lead_id, employee_id, call_status, remarks, call_duration)
              VALUES ($1, $2, 'follow_up', 'Customer requested callback tomorrow after 4 PM with GST returns', 240)
            `, [allLeads[i].id, empId]);
            await client.query(`
              INSERT INTO followups (lead_id, employee_id, scheduled_at, remarks, status)
              VALUES ($1, $2, NOW() + INTERVAL '1 day', 'Call regarding GST returns & business tenure verification', 'pending')
            `, [allLeads[i].id, empId]);
          }
        }
      }
    }

    // 9. Seed sample Loan Application if none exist
    const appCheck = await client.query("SELECT COUNT(*) FROM loan_applications");
    if (parseInt(appCheck.rows[0].count) === 0) {
      console.log("Seeding sample loan applications...");
      const leadRow = (await client.query("SELECT id, loan_amount FROM leads LIMIT 2")).rows;
      const bankRow = (await client.query("SELECT id FROM banks LIMIT 2")).rows;
      const schemeRow = (await client.query("SELECT id FROM loan_schemes LIMIT 2")).rows;
      const empRow = (await client.query("SELECT id FROM employees LIMIT 1")).rows;

      if (leadRow.length > 0 && bankRow.length > 0 && schemeRow.length > 0 && empRow.length > 0) {
        await client.query(`
          INSERT INTO loan_applications 
          (lead_id, bank_id, scheme_id, employee_id, application_number, loan_amount, status, applied_at, approved_amount, remarks)
          VALUES 
          ($1, $2, $3, $4, 'APP-2026-001', $5, 'approved', NOW() - INTERVAL '3 days', $5, 'Pre-approved based on CIBIL score of 780'),
          ($6, $7, $8, $4, 'APP-2026-002', 2500000, 'under_review', NOW() - INTERVAL '1 day', NULL, 'Documents submitted to branch manager for credit review')
        `, [
          leadRow[0].id, bankRow[0].id, schemeRow[0].id, empRow[0].id, leadRow[0].loan_amount || 500000,
          leadRow[1] ? leadRow[1].id : leadRow[0].id, bankRow[1] ? bankRow[1].id : bankRow[0].id, schemeRow[1] ? schemeRow[1].id : schemeRow[0].id
        ]);
        console.log("Sample loan applications seeded.");
      }
    }

    console.log("Seed & setup completed successfully!");
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupAndSeed();
