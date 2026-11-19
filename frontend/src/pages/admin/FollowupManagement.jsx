import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Clock, Phone, Calendar, Search, Filter, CheckCircle2 } from "lucide-react";

export function FollowupManagement() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const res = await api.getAllFollowups();
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

  const filtered = followups.filter(f => {
    if (filter !== "all" && f.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.customer_name?.toLowerCase().includes(q) ||
        f.phone?.includes(q) ||
        f.employee_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer & Follow-Up Management</h1>
          <p className="page-subtitle">
            Centralized monitoring of customer callback commitments across all telecallers
          </p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by customer, phone, or agent..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-group">
            <select
              className="select-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Follow-ups</option>
              <option value="pending">Pending Callbacks</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Assigned Agent</th>
                <th>Scheduled Date & Time</th>
                <th>Follow-up Remarks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Loading follow-ups...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No follow-ups found.
                  </td>
                </tr>
              ) : (
                filtered.map(f => {
                  const isOverdue = f.status === "pending" && new Date(f.scheduled_at) < new Date();
                  return (
                    <tr key={f.id}>
                      <td><strong>{f.customer_name}</strong></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Phone size={13} color="#64748b" />
                          <span>{f.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{f.employee_name}</span>
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
