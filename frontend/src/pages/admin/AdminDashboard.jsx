import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { MetricCard } from "../../components/MetricCard";
import { Badge } from "../../components/Badge";
import { useNavigate } from "react-router-dom";
import {
  Users,
  PhoneCall,
  UserPlus,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboardStats();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAutoDistribute = async () => {
    if (!window.confirm("Auto-distribute all unassigned leads evenly across active employees?")) return;
    try {
      setDistributing(true);
      const res = await api.autoDistributeLeads();
      setNotification(res.message);
      await loadDashboard();
      setTimeout(() => setNotification(""), 6000);
    } catch (err) {
      alert(err.message || "Auto-distribute failed");
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return <div className="page-container" style={{ padding: 40, textAlign: "center" }}>Loading dashboard analytics...</div>;
  }

  const { leads, team, applications, team_performance, lead_status_funnel, bank_distribution, recent_calls } = data || {};

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">
            Company Overview • 20 Agents • Daily Target: 100 Calls/Employee
          </p>
        </div>

        <div className="header-actions">
          {leads?.unassigned_leads > 0 && (
            <button
              onClick={handleAutoDistribute}
              disabled={distributing}
              className="btn btn-primary"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
            >
              <Sparkles size={16} />
              <span>{distributing ? "Distributing..." : `Auto-Distribute ${leads.unassigned_leads} Morning Leads`}</span>
            </button>
          )}

          <button
            onClick={() => navigate("/admin/leads")}
            className="btn btn-secondary"
          >
            <UserPlus size={16} />
            <span>Manage Leads</span>
          </button>
        </div>
      </div>

      {notification && (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#065f46",
          padding: "12px 16px",
          borderRadius: "10px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 500
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Leads"
          value={leads?.total_leads || 0}
          sub={`${leads?.unassigned_leads || 0} Unassigned Leads`}
          icon={Users}
          color="blue"
        />

        <MetricCard
          title="Team Calls Today"
          value={`${team?.calls_today || 0} / ${team?.daily_team_target || 500}`}
          sub={`${Math.round(((team?.calls_today || 0) / (team?.daily_team_target || 1)) * 100)}% Target Achieved`}
          icon={PhoneCall}
          color="amber"
        />

        <MetricCard
          title="Active Telecallers"
          value={team?.active_employees || 0}
          sub="Target: 100 calls/day each"
          icon={Target}
          color="green"
        />

        <MetricCard
          title="Loan Applications"
          value={applications?.total_applications || 0}
          sub={`${applications?.approved_count || 0} Approved • ${applications?.disbursed_count || 0} Disbursed`}
          icon={FileSpreadsheet}
          color="purple"
        />
      </div>

      {/* Team Performance & Target Tracking (100 calls/day) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Telecaller Daily Target Tracking (100 Calls)</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Live call counts vs daily target per employee</p>
            </div>
            <button
              onClick={() => navigate("/admin/targets")}
              className="btn btn-secondary btn-sm"
            >
              <span>View All Targets</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leads Assigned</th>
                  <th>Calls Today</th>
                  <th>Daily Target</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {team_performance?.map((emp) => {
                  const target = emp.daily_target || 100;
                  const completed = emp.total_calls_today || 0;
                  const pct = Math.min(100, Math.round((completed / target) * 100));

                  return (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.employee_name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{emp.employee_code}</div>
                      </td>
                      <td>{emp.assigned_leads || 0}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: "#2563eb" }}>{completed}</span> calls
                      </td>
                      <td>{target}</td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        {pct >= 100 ? (
                          <Badge status="approved" text="Target Met" />
                        ) : pct >= 50 ? (
                          <Badge status="interested" text="On Track" />
                        ) : (
                          <Badge status="contacted" text="In Progress" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Status Funnel */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lead Status Funnel</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {lead_status_funnel?.map((item) => (
              <div
                key={item.status}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9"
                }}
              >
                <Badge status={item.status} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bank Distribution & Recent Calls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Partner Banks Portfolio */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Partner Banks Portfolio</h2>
            <button onClick={() => navigate("/admin/banks")} className="btn btn-secondary btn-sm">
              Manage Banks
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {bank_distribution?.map((bank) => (
              <div
                key={bank.bank_name}
                style={{
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Building2 size={20} color="#2563eb" />
                  <span style={{ fontWeight: 600 }}>{bank.bank_name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    {bank.application_count} {bank.application_count === 1 ? "app" : "apps"}
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ₹{Number(bank.volume || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Calling Activity Stream */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Telecalling Activity</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recent_calls && recent_calls.length > 0 ? (
              recent_calls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600 }}>{call.customer_name}</span>
                    <Badge status={call.call_status} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#475569", margin: "4px 0" }}>
                    "{call.remarks || "No remarks logged"}"
                  </p>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    Caller: {call.employee_name} • {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                No calls recorded today yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
