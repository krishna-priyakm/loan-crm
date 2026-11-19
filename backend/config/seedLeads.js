import pool from './db.js';

async function seedLeads() {
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
    ['Naveen Kumar', '9810011232', 'naveen.k@gmail.com', 'Lucknow', 'Personal Loan', 150000, 'SMS Campaign', 'new'],
    ['Deepika Sengupta', '9810011233', 'deepika.s@gmail.com', 'Kolkata', 'Personal Loan', 600000, 'Website', 'new'],
    ['Alok Tandon', '9810011234', 'alok.t@gmail.com', 'Noida', 'Business Loan', 4500000, 'Walk-in', 'new'],
    ['Preeti Nair', '9810011235', 'preeti.n@gmail.com', 'Coimbatore', 'Home Loan', 5200000, 'Referral', 'new']
  ];

  const client = await pool.connect();
  try {
    const adminUser = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = adminUser.rows[0]?.id || 1;

    for (const lead of sampleLeads) {
      const exists = await client.query("SELECT id FROM leads WHERE phone = $1", [lead[1]]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO leads (customer_name, phone, email, city, loan_type, loan_amount, source, status, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [...lead, adminId]);
      }
    }

    // Assign a few leads to Arun (emp 1)
    const emp1 = (await client.query("SELECT id FROM employees ORDER BY id ASC LIMIT 1")).rows[0]?.id;
    const emp2 = (await client.query("SELECT id FROM employees ORDER BY id ASC OFFSET 1 LIMIT 1")).rows[0]?.id;
    const leads = (await client.query("SELECT id FROM leads ORDER BY id ASC")).rows;

    if (emp1 && leads.length >= 6) {
      for (let i = 0; i < 4; i++) {
        await client.query(`
          INSERT INTO lead_assignments (lead_id, employee_id, assigned_by, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT DO NOTHING
        `, [leads[i].id, emp1, adminId]);
      }
    }
    if (emp2 && leads.length >= 8) {
      for (let i = 4; i < 7; i++) {
        await client.query(`
          INSERT INTO lead_assignments (lead_id, employee_id, assigned_by, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT DO NOTHING
        `, [leads[i].id, emp2, adminId]);
      }
    }

    console.log("Seeded leads and assignments successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedLeads();
