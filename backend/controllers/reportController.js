import pool from "../config/db.js";

// ADMIN DASHBOARD & OVERALL STATISTICS
export const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Leads overview
    const leadsCountRes = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_leads,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::int AS today_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END)::int AS new_leads,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END)::int AS assigned_leads,
        COUNT(CASE WHEN status = 'interested' THEN 1 END)::int AS interested_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END)::int AS converted_leads,
        COUNT(CASE WHEN status = 'follow_up' THEN 1 END)::int AS followup_leads
      FROM leads
    `);

    // 2. Unassigned leads
    const unassignedRes = await pool.query(`
      SELECT COUNT(*)::int AS unassigned_leads
      FROM leads l
      WHERE NOT EXISTS (
        SELECT 1 FROM lead_assignments la 
        WHERE la.lead_id = l.id AND la.is_active = TRUE
      )
    `);

    // 3. Employee & Call stats for today
    const employeeCountRes = await pool.query(
      "SELECT COUNT(*)::int AS total_employees FROM employees e JOIN users u ON e.user_id = u.id WHERE u.is_active = true"
    );

    const callsTodayRes = await pool.query(`
      SELECT 
        COUNT(*)::int AS calls_today,
        COUNT(CASE WHEN call_status = 'interested' THEN 1 END)::int AS interested_today,
        COUNT(CASE WHEN call_status = 'converted' THEN 1 END)::int AS converted_today
      FROM calls
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // 4. Loan applications pipeline & disbursed volume
    const appStatsRes = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_applications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int AS approved_count,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END)::int AS disbursed_count,
        COALESCE(SUM(CASE WHEN status = 'disbursed' THEN disbursed_amount ELSE 0 END), 0)::numeric AS total_disbursed_amount,
        COALESCE(SUM(loan_amount), 0)::numeric AS total_requested_amount
      FROM loan_applications
    `);

    // 5. Team performance ranking (Top performers)
    const teamPerformanceRes = await pool.query(`
      SELECT 
        e.id,
        u.name AS employee_name,
        e.employee_code,
        COUNT(DISTINCT c.id)::int AS total_calls_today,
        COUNT(DISTINCT CASE WHEN c.call_status = 'interested' THEN c.id END)::int AS interested_calls,
        COUNT(DISTINCT la.id)::int AS assigned_leads,
        COALESCE(dt.call_target, 100) AS daily_target
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN daily_targets dt ON dt.employee_id = e.id AND dt.target_date = CURRENT_DATE
      LEFT JOIN calls c ON c.employee_id = e.id AND DATE(c.created_at) = CURRENT_DATE
      LEFT JOIN lead_assignments la ON la.employee_id = e.id AND la.is_active = TRUE
      WHERE u.is_active = TRUE
      GROUP BY e.id, u.name, e.employee_code, dt.call_target
      ORDER BY total_calls_today DESC
    `);

    // 6. Lead status funnel
    const statusFunnelRes = await pool.query(`
      SELECT status, COUNT(*)::int AS count 
      FROM leads 
      GROUP BY status
    `);

    // 7. Bank-wise application distribution
    const bankDistributionRes = await pool.query(`
      SELECT b.bank_name, COUNT(la.id)::int AS application_count, COALESCE(SUM(la.loan_amount), 0)::numeric AS volume
      FROM banks b
      LEFT JOIN loan_applications la ON la.bank_id = b.id
      GROUP BY b.id, b.bank_name
      ORDER BY application_count DESC
    `);

    // 8. Recent activity stream
    const recentCalls = await pool.query(`
      SELECT c.id, c.call_status, c.remarks, c.created_at, l.customer_name, u.name AS employee_name
      FROM calls c
      JOIN leads l ON c.lead_id = l.id
      JOIN employees e ON c.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 8
    `);

    res.json({
      leads: {
        ...leadsCountRes.rows[0],
        unassigned_leads: unassignedRes.rows[0].unassigned_leads
      },
      team: {
        active_employees: employeeCountRes.rows[0].total_employees,
        daily_team_target: (employeeCountRes.rows[0].total_employees || 0) * 100,
        calls_today: callsTodayRes.rows[0].calls_today,
        interested_today: callsTodayRes.rows[0].interested_today,
        converted_today: callsTodayRes.rows[0].converted_today
      },
      applications: appStatsRes.rows[0],
      team_performance: teamPerformanceRes.rows,
      lead_status_funnel: statusFunnelRes.rows,
      bank_distribution: bankDistributionRes.rows,
      recent_calls: recentCalls.rows
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
};

// STAFF PERSONAL PERFORMANCE SUMMARY
export const getStaffPerformanceStats = async (req, res) => {
  try {
    const empRes = await pool.query("SELECT id FROM employees WHERE user_id = $1", [req.user.id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    const employeeId = empRes.rows[0].id;

    // Daily target & calls today
    const targetRes = await pool.query(`
      SELECT 
        COALESCE(dt.call_target, 100) AS call_target,
        COUNT(c.id)::int AS calls_completed,
        COUNT(CASE WHEN c.call_status = 'interested' THEN 1 END)::int AS interested_today,
        COUNT(CASE WHEN c.call_status = 'converted' THEN 1 END)::int AS converted_today
      FROM daily_targets dt
      LEFT JOIN calls c ON c.employee_id = dt.employee_id AND DATE(c.created_at) = dt.target_date
      WHERE dt.employee_id = $1 AND dt.target_date = CURRENT_DATE
      GROUP BY dt.call_target
    `, [employeeId]);

    const defaultTarget = targetRes.rows[0] || {
      call_target: 100,
      calls_completed: 0,
      interested_today: 0,
      converted_today: 0
    };

    // My Assigned Leads stats
    const leadsStatsRes = await pool.query(`
      SELECT 
        COUNT(l.id)::int AS total_assigned,
        COUNT(CASE WHEN l.status = 'assigned' THEN 1 END)::int AS pending_first_call,
        COUNT(CASE WHEN l.status = 'interested' THEN 1 END)::int AS interested,
        COUNT(CASE WHEN l.status = 'follow_up' THEN 1 END)::int AS follow_up,
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END)::int AS converted
      FROM lead_assignments la
      JOIN leads l ON la.lead_id = l.id
      WHERE la.employee_id = $1 AND la.is_active = TRUE
    `, [employeeId]);

    // Pending Follow-ups
    const followupsRes = await pool.query(`
      SELECT f.*, l.customer_name, l.phone
      FROM followups f
      JOIN leads l ON f.lead_id = l.id
      WHERE f.employee_id = $1 AND f.status = 'pending'
      ORDER BY f.scheduled_at ASC
      LIMIT 10
    `, [employeeId]);

    // My applications count
    const appsRes = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_applications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int AS approved_count,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END)::int AS disbursed_count
      FROM loan_applications
      WHERE employee_id = $1
    `, [employeeId]);

    res.json({
      target: defaultTarget,
      lead_stats: leadsStatsRes.rows[0],
      pending_followups: followupsRes.rows,
      applications: appsRes.rows[0]
    });
  } catch (error) {
    console.error("Staff stats error:", error);
    res.status(500).json({ message: "Failed to fetch staff performance" });
  }
};
