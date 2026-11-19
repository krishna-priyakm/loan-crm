import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { MetricCard } from "../../components/MetricCard";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  Target,
  PhoneCall,
  CheckCircle2,
  Clock,
  Edit2,
  Calendar,
  AlertCircle
} from "lucide-react";

export function DailyTargets() {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [newTarget, setNewTarget] = useState(100);
  const [message, setMessage] = useState("");

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.getAllDailyPerformance();
      setPerformance(res.performance || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setNewTarget(emp.call_target || 100);
    setIsEditOpen(true);
  };

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    try {
      await api.setDailyTarget({
        employee_id: editingEmp.employee_id,
        target_date: selectedDate,
        call_target: Number(newTarget)
      });
      setIsEditOpen(false);
      setMessage(`Target updated to ${newTarget} calls for ${editingEmp.employee_name}!`);
      loadPerformance();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to set target");
    }
  };

  const totalCalls = performance.reduce((sum, p) => sum + (Number(p.calls_completed) || 0), 0);
  const totalTarget = performance.reduce((sum, p) => sum + (Number(p.call_target) || 100), 0);
  const avgAchievement = totalTarget > 0 ? Math.round((totalCalls / totalTarget) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Call Targets & Performance Tracking</h1>
          <p className="page-subtitle">
            Target benchmark: 100 calls/day per employee • Live tracking & completion rates
          </p>
        </div>
      </div>

      {message && (
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
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{message}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Team Calls Today"
          value={totalCalls}
          sub={`Goal: ${totalTarget} calls`}
          icon={PhoneCall}
          color="blue"
        />

        <MetricCard
          title="Team Target Achievement"
          value={`${avgAchievement}%`}
          sub="Company daily completion pace"
          icon={Target}
          color="green"
        />

        <MetricCard
          title="Total Telecallers"
          value={performance.length}
          sub="100 calls standard quota"
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Target Tracking Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <span style={{ fontWeight: 700, color: "#0f172a" }}>
            Performance Tracking for Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Daily Call Target</th>
                <th>Calls Completed</th>
                <th>Progress (%)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>Loading performance logs...</td>
                </tr>
              ) : performance.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No daily targets found.
                  </td>
                </tr>
              ) : (
                performance.map(emp => {
                  const target = Number(emp.call_target) || 100;
                  const completed = Number(emp.calls_completed) || 0;
                  const pct = Math.min(100, Math.round((completed / target) * 100));

                  return (
                    <tr key={emp.employee_id}>
                      <td>
                        <span style={{
                          padding: "3px 8px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "0.8rem"
                        }}>
                          {emp.employee_code}
                        </span>
                      </td>
                      <td><strong>{emp.employee_name}</strong></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{target}</span> calls/day
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "0.95rem" }}>
                          {completed}
                        </span> calls
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        {pct >= 100 ? (
                          <Badge status="approved" text="Completed" />
                        ) : pct >= 50 ? (
                          <Badge status="interested" text="On Track" />
                        ) : (
                          <Badge status="contacted" text="In Progress" />
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit2 size={13} />
                          <span>Adjust Target</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Adjustment Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Set Daily Call Target: ${editingEmp?.employee_name}`}
        footer={
          <>
            <button onClick={() => setIsEditOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveTarget} className="btn btn-primary">Save Target</button>
          </>
        }
      >
        <form onSubmit={handleSaveTarget}>
          <div className="form-group">
            <label className="form-label">Employee Code</label>
            <input
              type="text"
              disabled
              className="form-input"
              value={editingEmp?.employee_code || ""}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Daily Call Quota (Calls)</label>
            <input
              type="number"
              min={1}
              required
              className="form-input"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="100"
            />
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
              Default standard company target is 100 calls per day.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
