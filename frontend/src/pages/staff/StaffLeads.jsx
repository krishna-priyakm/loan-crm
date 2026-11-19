import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import { useNavigate } from "react-router-dom";
import {
  PhoneCall,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FolderOpen,
  FileSpreadsheet
} from "lucide-react";

export function StaffLeads() {
  const [leads, setLeads] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Call Logging Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [callStatus, setCallStatus] = useState("interested");
  const [remarks, setRemarks] = useState("");
  const [callDuration, setCallDuration] = useState("60");

  // Follow-up scheduling sub-fields if callStatus === 'follow_up'
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("11:00");
  const [followupRemarks, setFollowupRemarks] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, targetRes] = await Promise.all([
        api.getMyAssignedLeads(),
        api.getMyDailyTarget()
      ]);

      setLeads(leadsRes.leads || []);
      setDailyTarget(targetRes.target || { call_target: 100, calls_completed: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Default follow-up date to tomorrow
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setFollowupDate(tmrw.toISOString().split("T")[0]);
  }, []);

  const handleOpenCallModal = (lead) => {
    setSelectedLead(lead);
    setCallStatus(lead.status === "interested" ? "interested" : "contacted");
    setRemarks("");
  };

  const handleRecordCall = async (e) => {
    e.preventDefault();
    try {
      // 1. Record Call
      await api.recordCall({
        lead_id: selectedLead.id,
        call_status: callStatus,
        remarks: remarks || `Call marked as ${callStatus}`,
        call_duration: Number(callDuration) || 60
      });

      // 2. If follow_up chosen, automatically create scheduled follow-up
      if (callStatus === "follow_up") {
        if (!followupDate || !followupTime) {
          alert("Please specify follow-up date and time");
          return;
        }
        const scheduledDateTime = new Date(`${followupDate}T${followupTime}:00`);
        await api.createFollowup({
          lead_id: selectedLead.id,
          scheduled_at: scheduledDateTime.toISOString(),
          remarks: followupRemarks || remarks || "Customer callback requested"
        });
      }

      setMessage(`Call successfully logged for ${selectedLead.customer_name}!`);
      setSelectedLead(null);
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to log call");
    }
  };

  const filtered = leads.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.customer_name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.loan_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const callsCompleted = dailyTarget?.calls_completed || 0;
  const targetGoal = dailyTarget?.call_target || 100;
  const targetPct = Math.min(100, Math.round((callsCompleted / targetGoal) * 100));

  return (
    <div className="page-container">
      {/* Sticky Daily Call Goal Progress Bar */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>TODAY'S TARGET MONITOR</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
            {callsCompleted} / {targetGoal} Calls Completed ({targetPct}%)
          </div>
        </div>

        <div style={{ width: 240 }}>
          <div className="progress-container" style={{ height: 10 }}>
            <div className="progress-bar" style={{ width: `${targetPct}%` }} />
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">My Assigned Customer Leads</h1>
          <p className="page-subtitle">
            Call customers, introduce loan schemes, log call outcomes, and schedule follow-ups
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

      {/* Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search leads by customer, phone, city..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-group">
            <select
              className="select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Assigned Leads ({leads.length})</option>
              <option value="assigned">Pending First Call</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow Up</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Loan Requirement</th>
                <th>Status</th>
                <th>Assigned On</th>
                <th style={{ textAlign: "right" }}>Telecalling Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>Loading your assigned leads...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.customer_name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Source: {lead.source || "Website"}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} color="#2563eb" />
                        <a href={`tel:${lead.phone}`} style={{ color: "#2563eb", fontWeight: 700 }}>
                          {lead.phone}
                        </a>
                      </div>
                    </td>
                    <td>{lead.city || "—"}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.loan_type}</div>
                      <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>
                        {lead.loan_amount ? `₹${Number(lead.loan_amount).toLocaleString()}` : "—"}
                      </div>
                    </td>
                    <td>
                      <Badge status={lead.status} />
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {lead.assigned_at ? new Date(lead.assigned_at).toLocaleDateString() : "Today"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenCallModal(lead)}
                          className="btn btn-primary btn-sm"
                        >
                          <PhoneCall size={13} />
                          <span>Log Call</span>
                        </button>

                        {lead.status === "interested" && (
                          <>
                            <button
                              onClick={() => navigate("/staff/documents")}
                              className="btn btn-secondary btn-sm"
                              title="Upload customer documents"
                            >
                              <FolderOpen size={13} />
                            </button>
                            <button
                              onClick={() => navigate("/staff/applications")}
                              className="btn btn-secondary btn-sm"
                              title="Submit loan application"
                            >
                              <FileSpreadsheet size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Call Modal */}
      <Modal
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={`Log Call with ${selectedLead?.customer_name}`}
        maxWidth="620px"
        footer={
          <>
            <button onClick={() => setSelectedLead(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleRecordCall} className="btn btn-primary">Save Call Log</button>
          </>
        }
      >
        {selectedLead && (
          <form onSubmit={handleRecordCall}>
            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#1e3a8a" }}>{selectedLead.customer_name}</div>
                <div style={{ fontSize: "0.85rem", color: "#2563eb" }}>📞 {selectedLead.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "#1e3a8a", fontWeight: 600 }}>{selectedLead.loan_type}</span>
                <div style={{ fontWeight: 800, color: "#1e3a8a" }}>₹{Number(selectedLead.loan_amount || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Outcome Selection Buttons */}
            <div className="form-group">
              <label className="form-label">Call Outcome / Customer Response *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { id: "interested", label: "✅ Interested", desc: "Wants loan, proceed to docs" },
                  { id: "follow_up", label: "⏰ Schedule Follow-up", desc: "Callback requested" },
                  { id: "not_interested", label: "❌ Not Interested", desc: "Declined loan offer" },
                  { id: "no_answer", label: "📵 No Answer / Busy", desc: "Will retry later" },
                  { id: "converted", label: "🎉 Converted", desc: "Ready for bank submission" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCallStatus(opt.id)}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: callStatus === opt.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: callStatus === opt.id ? "#eff6ff" : "white",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: callStatus === opt.id ? "#1d4ed8" : "#0f172a" }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Fields if Schedule Follow-up */}
            {callStatus === "follow_up" && (
              <div style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e", marginBottom: "8px" }}>
                  Schedule Callback Date & Time
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Date</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Time</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={followupTime}
                      onChange={(e) => setFollowupTime(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>Callback Note</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Call after 4 PM, salary slips will be ready"
                    value={followupRemarks}
                    onChange={(e) => setFollowupRemarks(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Call Duration (seconds)</label>
              <input
                type="number"
                className="form-input"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="60"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Call Notes / Discussion Remarks</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Introduced HDFC and SBI personal loan schemes. Customer inquired about processing fees..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
