import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  LayoutDashboard,
  Users,
  Target,
  FileSpreadsheet,
  Menu,
  PhoneCall,
  Sparkles,
  Building2,
  FileCheck,
  Plus,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Wifi,
  Battery,
  Smartphone,
  Maximize2,
  Minimize2,
  CheckCircle2
} from "lucide-react";

export function MobileAdminPortal() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, leads, targets, loans, more
  const [fullscreen, setFullscreen] = useState(false);
  const [data, setData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modals
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({ customer_name: "", phone: "", loan_type: "Personal Loan", loan_amount: "" });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [dashRes, leadsRes, empRes, appsRes, docsRes] = await Promise.all([
        api.getAdminDashboardStats(),
        api.getLeads(),
        api.getEmployees(),
        api.getAllApplications(),
        api.getAllDocuments()
      ]);

      setData(dashRes);
      setLeads(leadsRes.leads || []);
      setEmployees(empRes.employees || []);
      setApplications(appsRes.applications || []);
      setDocuments(docsRes.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAutoDistribute = async () => {
    try {
      const res = await api.autoDistributeLeads();
      setMessage(res.message);
      loadAll();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to auto-distribute");
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await api.createLead(newLead);
      setIsAddLeadOpen(false);
      setNewLead({ customer_name: "", phone: "", loan_type: "Personal Loan", loan_amount: "" });
      setMessage("Lead added via Mobile Admin!");
      loadAll();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to create lead");
    }
  };

  const handleVerifyDoc = async (id, status) => {
    try {
      await api.verifyDocument(id, status);
      setMessage(`Document marked as ${status}!`);
      loadAll();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="mobile-simulator-wrapper" style={{ minHeight: "100vh", backgroundColor: fullscreen ? "#f8fafc" : "#0f172a" }}>
      {/* Viewport frame container */}
      <div 
        className="mobile-device-frame"
        style={fullscreen ? {
          width: "100%",
          maxWidth: "480px",
          height: "100vh",
          borderRadius: 0,
          boxShadow: "none",
          border: "none"
        } : {}}
      >
        {/* Mobile Status Bar */}
        <div style={{
          height: "36px",
          backgroundColor: "#1e293b",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          fontSize: "0.75rem",
          fontWeight: 600,
          zIndex: 30
        }}>
          <span>9:41 AM</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Wifi size={13} />
            <Battery size={15} />
            <button
              onClick={() => setFullscreen(!fullscreen)}
              style={{ background: "transparent", color: "white", padding: 2, marginLeft: 4 }}
              title="Toggle fullscreen / device frame"
            >
              {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Mobile Top App Bar */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "14px 18px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white"
            }}>
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                Loan CRM Admin
              </div>
              <div style={{ fontSize: "0.675rem", color: "#64748b" }}>Mobile App Edition</div>
            </div>
          </div>

          <div style={{
            fontSize: "0.7rem",
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "4px 8px",
            borderRadius: "9999px",
            fontWeight: 700
          }}>
            Admin Mode
          </div>
        </div>

        {/* Alert message */}
        {message && (
          <div style={{
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            padding: "8px 12px",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 600
          }}>
            <CheckCircle2 size={14} color="#059669" />
            <span>{message}</span>
          </div>
        )}

        {/* Main Scrollable Mobile Viewport */}
        <div className="mobile-screen-content" style={{ padding: "16px", paddingBottom: "80px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "0.85rem" }}>
              Loading mobile workspace...
            </div>
          ) : activeTab === "dashboard" ? (
            <div>
              {/* Morning Auto Distribute Banner */}
              {data?.leads?.unassigned_leads > 0 && (
                <div style={{
                  background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                  color: "white",
                  padding: "14px",
                  borderRadius: "12px",
                  marginBottom: "16px"
                }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>Action Required</div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", margin: "2px 0 8px" }}>
                    {data.leads.unassigned_leads} Unassigned Leads
                  </div>
                  <button
                    onClick={handleAutoDistribute}
                    className="btn"
                    style={{
                      background: "white",
                      color: "#1e3a8a",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      padding: "6px 12px",
                      width: "100%"
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Auto-Distribute to Team Now</span>
                  </button>
                </div>
              )}

              {/* Mobile Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div style={{ background: "white", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>TOTAL LEADS</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                    {data?.leads?.total_leads || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#10b981" }}>
                    {data?.leads?.interested_leads || 0} Interested
                  </div>
                </div>

                <div style={{ background: "white", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>CALLS TODAY</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563eb" }}>
                    {data?.team?.calls_today || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                    Target: {data?.team?.daily_team_target || 500}
                  </div>
                </div>

                <div style={{ background: "white", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>APPLICATIONS</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#8b5cf6" }}>
                    {data?.applications?.total_applications || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#059669" }}>
                    {data?.applications?.approved_count || 0} Approved
                  </div>
                </div>

                <div style={{ background: "white", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>TELECALLERS</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                    {data?.team?.active_employees || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                    100 calls target
                  </div>
                </div>
              </div>

              {/* Telecaller Target Achievement Leaderboard */}
              <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: "10px" }}>
                  100 Calls Target Tracker
                </div>
                {data?.team_performance?.map(emp => {
                  const target = emp.daily_target || 100;
                  const completed = emp.total_calls_today || 0;
                  const pct = Math.min(100, Math.round((completed / target) * 100));

                  return (
                    <div key={emp.id} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem", marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>{emp.employee_name} ({emp.employee_code})</span>
                        <span style={{ fontWeight: 700, color: "#2563eb" }}>{completed}/{target} ({pct}%)</span>
                      </div>
                      <div className="progress-container" style={{ height: 6 }}>
                        <div className="progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: "10px" }}>
                  Live Activity Log
                </div>
                {data?.recent_calls?.slice(0, 4).map(c => (
                  <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                      <span style={{ fontWeight: 700 }}>{c.customer_name}</span>
                      <Badge status={c.call_status} />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>
                      By {c.employee_name} • "{c.remarks || "No remarks"}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "leads" ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Customer Leads ({leads.length})</span>
                <button
                  onClick={() => setIsAddLeadOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={13} />
                  <span>Add Lead</span>
                </button>
              </div>

              {/* Leads Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {leads.map(lead => (
                  <div
                    key={lead.id}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{lead.customer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>📞 {lead.phone}</div>
                      </div>
                      <Badge status={lead.status} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: 6, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
                      <span>{lead.loan_type}</span>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        {lead.loan_amount ? `₹${Number(lead.loan_amount).toLocaleString()}` : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "targets" ? (
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "4px" }}>
                Daily Targets (100 Calls/Day)
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "14px" }}>
                Real-time telecaller performance tracking
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data?.team_performance?.map(emp => {
                  const target = emp.daily_target || 100;
                  const completed = emp.total_calls_today || 0;
                  const pct = Math.min(100, Math.round((completed / target) * 100));

                  return (
                    <div
                      key={emp.id}
                      style={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "14px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{emp.employee_name}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Code: {emp.employee_code}</div>
                        </div>
                        <Badge
                          status={pct >= 100 ? "approved" : pct >= 50 ? "interested" : "contacted"}
                          text={pct >= 100 ? "Goal Met" : `${completed}/${target}`}
                        />
                      </div>

                      <div className="progress-container" style={{ height: 8, margin: "8px 0" }}>
                        <div className="progress-bar" style={{ width: `${pct}%` }} />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b" }}>
                        <span>Leads Assigned: {emp.assigned_leads || 0}</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{pct}% complete</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === "loans" ? (
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "12px" }}>
                Loan Applications Pipeline
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {applications.map(app => (
                  <div
                    key={app.id}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#2563eb" }}>
                        {app.application_number}
                      </span>
                      <Badge status={app.status} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{app.customer_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Bank: {app.bank_name}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                      Requested: ₹{Number(app.loan_amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "14px" }}>
                Admin Operations
              </div>

              {/* Documents pending verification */}
              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "14px", marginBottom: "14px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
                  Document Verification Queue ({documents.filter(d => d.verification_status === "pending").length})
                </div>
                {documents.filter(d => d.verification_status === "pending").length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No pending documents to verify.</div>
                ) : (
                  documents.filter(d => d.verification_status === "pending").map(d => (
                    <div key={d.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{d.customer_name} - {d.document_name}</div>
                      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                        <button onClick={() => handleVerifyDoc(d.id, "verified")} className="btn btn-success btn-sm" style={{ padding: "3px 8px", fontSize: "0.7rem" }}>
                          Verify
                        </button>
                        <button onClick={() => handleVerifyDoc(d.id, "rejected")} className="btn btn-danger btn-sm" style={{ padding: "3px 8px", fontSize: "0.7rem" }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Active Employees List */}
              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "14px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
                  Team Directory ({employees.length})
                </div>
                {employees.map(emp => (
                  <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{emp.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{emp.employee_code} • {emp.designation}</div>
                    </div>
                    <Badge status={emp.is_active ? "approved" : "rejected"} text={emp.is_active ? "Active" : "Disabled"} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="mobile-bottom-nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "leads", label: "Leads", icon: Users },
            { id: "targets", label: "Targets", icon: Target },
            { id: "loans", label: "Loans", icon: FileSpreadsheet },
            { id: "more", label: "Operations", icon: Menu }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mobile-tab-btn ${active ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Lead Modal in Mobile */}
      <Modal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        title="Add Customer Lead (Mobile)"
        footer={
          <>
            <button onClick={() => setIsAddLeadOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreateLead} className="btn btn-primary">Save Lead</button>
          </>
        }
      >
        <form onSubmit={handleCreateLead}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={newLead.customer_name}
              onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              required
              className="form-input"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Loan Type</label>
            <select
              className="form-select"
              value={newLead.loan_type}
              onChange={(e) => setNewLead({ ...newLead, loan_type: e.target.value })}
            >
              <option value="Personal Loan">Personal Loan</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Loan Against Property">Loan Against Property</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={newLead.loan_amount}
              onChange={(e) => setNewLead({ ...newLead, loan_amount: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
