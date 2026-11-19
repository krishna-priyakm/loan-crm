import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { MetricCard } from "../../components/MetricCard";
import { Badge } from "../../components/Badge";
import {
  BarChart3,
  Download,
  Users,
  PhoneCall,
  DollarSign,
  TrendingUp,
  Building2,
  FileSpreadsheet
} from "lucide-react";

export function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Leads", data.leads?.total_leads || 0],
      ["Unassigned Leads", data.leads?.unassigned_leads || 0],
      ["Interested Leads", data.leads?.interested_leads || 0],
      ["Converted Leads", data.leads?.converted_leads || 0],
      ["Active Telecallers", data.team?.active_employees || 0],
      ["Calls Today", data.team?.calls_today || 0],
      ["Total Loan Applications", data.applications?.total_applications || 0],
      ["Approved Applications", data.applications?.approved_count || 0],
      ["Disbursed Applications", data.applications?.disbursed_count || 0],
      ["Total Disbursed Volume (INR)", data.applications?.total_disbursed_amount || 0]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loan_crm_executive_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="page-container" style={{ padding: 40, textAlign: "center" }}>Generating reports...</div>;
  }

  const { leads, team, applications, team_performance, bank_distribution, lead_status_funnel } = data || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Reports & Business Analytics</h1>
          <p className="page-subtitle">
            Funnel conversions, call target compliance, and partner bank lending volumes
          </p>
        </div>

        <div className="header-actions">
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Lead Volume"
          value={leads?.total_leads || 0}
          sub={`${leads?.converted_leads || 0} converted to loans`}
          icon={Users}
          color="blue"
        />

        <MetricCard
          title="Conversion Rate"
          value={`${leads?.total_leads > 0 ? Math.round(((leads?.converted_leads || 0) / leads.total_leads) * 100) : 0}%`}
          sub="Lead to Disbursement"
          icon={TrendingUp}
          color="green"
        />

        <MetricCard
          title="Total Disbursed"
          value={`₹${Number(applications?.total_disbursed_amount || 0).toLocaleString()}`}
          sub={`${applications?.disbursed_count || 0} loans closed`}
          icon={DollarSign}
          color="purple"
        />

        <MetricCard
          title="Team Call Compliance"
          value={`${Math.round(((team?.calls_today || 0) / (team?.daily_team_target || 500)) * 100)}%`}
          sub={`${team?.calls_today || 0} / ${team?.daily_team_target || 500} calls`}
          icon={PhoneCall}
          color="amber"
        />
      </div>

      {/* Conversion Funnel Table & Telecaller Leaderboard */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lead Pipeline Funnel</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {lead_status_funnel?.map(item => {
              const total = leads?.total_leads || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.status} style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Badge status={item.status} />
                    <span style={{ fontWeight: 700 }}>{item.count} leads ({pct}%)</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telecaller Productivity Ranking */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Agent Productivity Leaderboard</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Calls Today</th>
                  <th>Target (100)</th>
                  <th>Achievement</th>
                </tr>
              </thead>
              <tbody>
                {team_performance?.map(emp => {
                  const target = emp.daily_target || 100;
                  const completed = emp.total_calls_today || 0;
                  const pct = Math.min(100, Math.round((completed / target) * 100));

                  return (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.employee_name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{emp.employee_code}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "#2563eb" }}>{completed}</span>
                      </td>
                      <td>{target}</td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: pct >= 80 ? "#166534" : pct >= 40 ? "#b45309" : "#64748b"
                        }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
