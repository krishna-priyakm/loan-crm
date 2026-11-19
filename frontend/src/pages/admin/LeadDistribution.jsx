import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import {
  UserPlus,
  Sparkles,
  Users,
  CheckCircle2,
  Phone,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export function LeadDistribution() {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [unassignedLeads, setUnassignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, assignRes, leadsRes] = await Promise.all([
        api.getEmployees(),
        api.getAssignments(),
        api.getLeads()
      ]);

      const activeEmps = empRes.employees || [];
      const allAssignments = assignRes.assignments || [];
      const allLeads = leadsRes.leads || [];

      // Calculate unassigned leads
      const assignedLeadIds = new Set(allAssignments.map(a => a.lead_id));
      const unassigned = allLeads.filter(l => !assignedLeadIds.has(l.id) || l.status === "new");

      setEmployees(activeEmps);
      setAssignments(allAssignments);
      setUnassignedLeads(unassigned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMorningAutoDistribute = async () => {
    try {
      setDistributing(true);
      const res = await api.autoDistributeLeads();
      setMessage(res.message);
      await loadData();
      setTimeout(() => setMessage(""), 6000);
    } catch (err) {
      alert(err.message || "Failed to distribute leads");
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Morning Lead Distribution</h1>
          <p className="page-subtitle">
            Assign unassigned customer leads to employees every morning (Daily target: 100 calls/employee)
          </p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleMorningAutoDistribute}
            disabled={distributing || unassignedLeads.length === 0}
            className="btn btn-primary"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              padding: "10px 20px"
            }}
          >
            <Sparkles size={18} />
            <span>{distributing ? "Distributing..." : `Auto-Distribute ${unassignedLeads.length} Leads Evenly`}</span>
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#065f46",
          padding: "14px 18px",
          borderRadius: "10px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 600
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <span>{message}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <span className="metric-label">Unassigned Leads Pool</span>
            <div className="metric-value" style={{ color: unassignedLeads.length > 0 ? "#2563eb" : "#059669" }}>
              {unassignedLeads.length}
            </div>
            <div className="metric-sub">Ready for morning distribution</div>
          </div>
          <div className="metric-icon-box" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <span className="metric-label">Active Telecaller Employees</span>
            <div className="metric-value">{employees.filter(e => e.is_active).length}</div>
            <div className="metric-sub">Ready to receive leads</div>
          </div>
          <div className="metric-icon-box" style={{ background: "#ecfdf5", color: "#10b981" }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <span className="metric-label">Leads Per Telecaller Share</span>
            <div className="metric-value">
              {employees.length > 0 ? Math.ceil(unassignedLeads.length / employees.length) : 0}
            </div>
            <div className="metric-sub">Average distribution quota</div>
          </div>
          <div className="metric-icon-box" style={{ background: "#fffbeb", color: "#f59e0b" }}>
            <UserPlus size={24} />
          </div>
        </div>
      </div>

      {/* Employees Quota Table */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <h2 className="card-title">Employee Load Distribution</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Staff Name</th>
                <th>Designation</th>
                <th>Active Leads Assigned</th>
                <th>Target (Calls/Day)</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const assignedCount = assignments.filter(a => a.employee_id === emp.id).length;
                return (
                  <tr key={emp.id}>
                    <td><strong>{emp.employee_code}</strong></td>
                    <td>{emp.name}</td>
                    <td>{emp.designation}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "0.95rem" }}>
                        {assignedCount}
                      </span> leads
                    </td>
                    <td>100 calls</td>
                    <td>
                      <Badge status={emp.is_active ? "approved" : "rejected"} text={emp.is_active ? "Active" : "Inactive"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Assignments Listing */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Lead Assignments</h2>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Total Active: {assignments.length}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Loan Requirement</th>
                <th>Assigned Agent</th>
                <th>Assigned Time</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No active assignments yet. Click "Auto-Distribute" above.
                  </td>
                </tr>
              ) : (
                assignments.slice(0, 15).map(a => (
                  <tr key={a.assignment_id}>
                    <td><strong>{a.customer_name}</strong></td>
                    <td>{a.phone}</td>
                    <td>
                      {a.loan_type} • ₹{Number(a.loan_amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.employee_name}</span> ({a.employee_code})
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {new Date(a.assigned_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
