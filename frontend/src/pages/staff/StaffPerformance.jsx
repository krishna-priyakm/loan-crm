import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { MetricCard } from "../../components/MetricCard";
import { Badge } from "../../components/Badge";
import {
  Target,
  PhoneCall,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
  Award
} from "lucide-react";

export function StaffPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="page-container" style={{ padding: 40, textAlign: "center" }}>Loading your personal scorecard...</div>;
  }

  const { target, lead_stats, applications } = data || {};
  const completed = target?.calls_completed || 0;
  const goal = target?.call_target || 100;
  const achievementRate = Math.min(100, Math.round((completed / goal) * 100));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Personal Performance Scorecard</h1>
          <p className="page-subtitle">
            Daily target achievement, calling efficiency, and loan conversion analytics
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Daily Calls Completed"
          value={completed}
          sub={`Target: ${goal} calls`}
          icon={PhoneCall}
          color="blue"
        />

        <MetricCard
          title="Target Achievement"
          value={`${achievementRate}%`}
          sub={achievementRate >= 100 ? "Goal Exceeded!" : "In progress"}
          icon={Target}
          color="green"
        />

        <MetricCard
          title="Interested Clients"
          value={lead_stats?.interested || 0}
          sub="Leads willing to apply"
          icon={CheckCircle2}
          color="amber"
        />

        <MetricCard
          title="Loan Sanctions"
          value={applications?.approved_count || 0}
          sub="Bank approved files"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Target Progress Bar Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">100 Daily Call Quota Progress</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Standard target for all intermediary call centre executives
            </p>
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb" }}>
            {completed} / {goal} Calls
          </span>
        </div>

        <div className="progress-container" style={{ height: "16px", borderRadius: "9999px" }}>
          <div
            className="progress-bar"
            style={{
              width: `${achievementRate}%`,
              background: achievementRate >= 100 ? "#10b981" : "linear-gradient(90deg, #3b82f6, #6366f1)"
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "0.8rem", color: "#64748b" }}>
          <span>0 Calls</span>
          <span>50 Calls (Halfway)</span>
          <span>100 Calls (Daily Goal)</span>
        </div>
      </div>
    </div>
  );
}
