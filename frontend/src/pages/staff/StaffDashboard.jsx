import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { MetricCard } from "../../components/MetricCard";
import { Badge } from "../../components/Badge";
import { useNavigate } from "react-router-dom";
import {
  PhoneCall,
  Target,
  Users,
  Clock,
  FolderOpen,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Calendar
} from "lucide-react";

export function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getStaffPerformanceStats();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container" style={{ padding: 40, textAlign: "center" }}>Loading your telecalling workspace...</div>;
  }

  const { target, lead_stats, pending_followups, applications } = data || {};
  const callTarget = target?.call_target || 100;
  const callsCompleted = target?.calls_completed || 0;
  const targetPct = Math.min(100, Math.round((callsCompleted / callTarget) * 100));

  return (
    <div className="page-container">
      {/* Daily Target Progress Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
        color: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
              Today's Performance Target
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "4px 0" }}>
              {callsCompleted} of {callTarget} Calls Completed ({targetPct}%)
            </h1>
          </div>

          <button
            onClick={() => navigate("/staff/leads")}
            className="btn"
            style={{ backgroundColor: "white", color: "#1e3a8a", fontWeight: 700, padding: "10px 20px" }}
          >
            <PhoneCall size={18} />
            <span>Start Calling Leads</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ background: "rgba(255, 255, 255, 0.25)", height: "12px", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${targetPct}%`,
              height: "100%",
              background: "#10b981",
              borderRadius: "9999px",
              transition: "width 0.4s ease"
            }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="My Assigned Leads"
          value={lead_stats?.total_assigned || 0}
          sub={`${lead_stats?.pending_first_call || 0} pending initial call`}
          icon={Users}
          color="blue"
        />

        <MetricCard
          title="Interested Customers"
          value={lead_stats?.interested || 0}
          sub="Potential loan conversions"
          icon={CheckCircle2}
          color="green"
        />

        <MetricCard
          title="Scheduled Follow-ups"
          value={pending_followups?.length || 0}
          sub="Callbacks awaiting attention"
          icon={Clock}
          color="amber"
        />

        <MetricCard
          title="Loans Applied"
          value={applications?.total_applications || 0}
          sub={`${applications?.approved_count || 0} approved by banks`}
          icon={FileSpreadsheet}
          color="purple"
        />
      </div>

      {/* Quick Workflows & Upcoming Follow-ups */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Upcoming Followups */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pending Callbacks Today</h2>
            <button onClick={() => navigate("/staff/followups")} className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div>
            {!pending_followups || pending_followups.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                No scheduled callbacks pending. Good job!
              </p>
            ) : (
              pending_followups.slice(0, 5).map(f => (
                <div
                  key={f.id}
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{f.customer_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      📞 {f.phone} • 📅 {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {f.remarks && (
                      <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: 2 }}>
                        "{f.remarks}"
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate("/staff/leads")}
                    className="btn btn-primary btn-sm"
                  >
                    Call Now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              onClick={() => navigate("/staff/leads")}
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: 10, background: "#eff6ff", borderRadius: 8, color: "#2563eb" }}>
                  <PhoneCall size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Open Calling Queue</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Log remarks, mark interest, or schedule callbacks</div>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>

            <div
              onClick={() => navigate("/staff/documents")}
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: 10, background: "#ecfdf5", borderRadius: 8, color: "#10b981" }}>
                  <FolderOpen size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Upload Customer KYC & Docs</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Upload PAN, Aadhaar, salary slip for verification</div>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>

            <div
              onClick={() => navigate("/staff/applications")}
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: 10, background: "#f5f3ff", borderRadius: 8, color: "#8b5cf6" }}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>Submit Loan Application</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Apply for bank loan on customer's behalf</div>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
