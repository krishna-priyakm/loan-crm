import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Clock, Phone, Calendar, CheckCircle, XCircle, CheckCircle2 } from "lucide-react";

export function StaffFollowups() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const res = await api.getMyFollowups();
      setFollowups(res.followups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateFollowupStatus(id, status);
      setMessage(`Follow-up marked as ${status}!`);
      loadFollowups();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to update follow-up");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Scheduled Callbacks & Follow-ups</h1>
          <p className="page-subtitle">
            Customers expecting a callback • Stay on top of your client commitments
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

      <div className="table-container">
        <div className="table-toolbar">
          <span style={{ fontWeight: 700, color: "#0f172a" }}>
            Scheduled Follow-ups ({followups.length})
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone Number</th>
                <th>Scheduled Date & Time</th>
                <th>Callback Notes</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Loading follow-ups...</td>
                </tr>
              ) : followups.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No scheduled follow-ups found. When calling leads, select "Schedule Follow-up" to add one.
                  </td>
                </tr>
              ) : (
                followups.map(f => {
                  const isOverdue = f.status === "pending" && new Date(f.scheduled_at) < new Date();
                  return (
                    <tr key={f.id}>
                      <td><strong>{f.customer_name}</strong></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Phone size={13} color="#2563eb" />
                          <a href={`tel:${f.phone}`} style={{ fontWeight: 700, color: "#2563eb" }}>
                            {f.phone}
                          </a>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={13} color={isOverdue ? "#dc2626" : "#64748b"} />
                          <span style={{ fontWeight: 600, color: isOverdue ? "#dc2626" : "inherit" }}>
                            {new Date(f.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        {isOverdue && (
                          <span style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 700 }}>OVERDUE</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <span style={{ fontSize: "0.85rem", color: "#475569" }}>{f.remarks || "—"}</span>
                      </td>
                      <td>
                        <Badge status={f.status} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {f.status === "pending" ? (
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => handleUpdateStatus(f.id, "completed")}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle size={13} />
                              <span>Complete</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(f.id, "cancelled")}
                              className="btn btn-secondary btn-sm"
                              style={{ color: "#ef4444" }}
                            >
                              <XCircle size={13} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
