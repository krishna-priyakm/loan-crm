import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";

export function LeadManagement() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentLeadDetail, setCurrentLeadDetail] = useState(null);

  // Form states
  const [newLead, setNewLead] = useState({
    customer_name: "",
    phone: "",
    email: "",
    city: "",
    loan_type: "Personal Loan",
    loan_amount: "",
    source: "Website"
  });

  const [bulkCsvText, setBulkCsvText] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const [leadsRes, empRes] = await Promise.all([
        api.getLeads(params.toString()),
        api.getEmployees()
      ]);

      setLeads(leadsRes.leads || []);
      setEmployees(empRes.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  // Handle single lead creation
  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await api.createLead(newLead);
      setIsAddOpen(false);
      setNewLead({
        customer_name: "",
        phone: "",
        email: "",
        city: "",
        loan_type: "Personal Loan",
        loan_amount: "",
        source: "Website"
      });
      setActionMessage("Lead created successfully!");
      loadData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to create lead");
    }
  };

  // Handle Bulk Upload
  const handleBulkUpload = async () => {
    try {
      if (!bulkCsvText.trim()) {
        alert("Please paste CSV data or use the sample format.");
        return;
      }

      // Parse lines
      const lines = bulkCsvText.trim().split("\n");
      const parsedLeads = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().startsWith("customer_name") || line.toLowerCase().startsWith("name")) continue;
        const [customer_name, phone, email, city, loan_type, loan_amount, source] = line.split(",").map(s => s?.trim());
        if (customer_name && phone) {
          parsedLeads.push({
            customer_name,
            phone,
            email: email || undefined,
            city: city || undefined,
            loan_type: loan_type || "Personal Loan",
            loan_amount: loan_amount ? Number(loan_amount) : undefined,
            source: source || "Bulk Upload"
          });
        }
      }

      if (parsedLeads.length === 0) {
        alert("No valid leads parsed from CSV. Expected format: Name,Phone,Email,City,LoanType,Amount,Source");
        return;
      }

      const res = await api.bulkUploadLeads(parsedLeads);
      setIsBulkOpen(false);
      setBulkCsvText("");
      setActionMessage(res.message);
      loadData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Bulk upload failed");
    }
  };

  // Bulk Assign
  const handleBulkAssign = async () => {
    if (!targetEmployeeId || selectedLeadIds.length === 0) {
      alert("Please select an employee and at least one lead.");
      return;
    }
    try {
      const res = await api.bulkAssignLeads({
        lead_ids: selectedLeadIds,
        employee_id: Number(targetEmployeeId)
      });
      setIsAssignOpen(false);
      setSelectedLeadIds([]);
      setActionMessage(res.message);
      loadData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to assign leads");
    }
  };

  // Auto Distribute
  const handleAutoDistribute = async () => {
    if (!window.confirm("Auto-distribute all unassigned leads evenly among active employees?")) return;
    try {
      const res = await api.autoDistributeLeads();
      setActionMessage(res.message);
      loadData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to auto-distribute");
    }
  };

  // View Lead details
  const handleViewDetail = async (id) => {
    try {
      const res = await api.getLeadById(id);
      setCurrentLeadDetail(res);
      setIsDetailOpen(true);
    } catch (err) {
      alert(err.message || "Failed to fetch lead details");
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadSampleCsv = () => {
    setBulkCsvText(
`Amitabh Bachchan,9820011111,amitabh@sample.com,Mumbai,Home Loan,8000000,Referral
Smriti Irani,9820011112,smriti@sample.com,Delhi,Personal Loan,500000,Website
Vijay Mallya,9820011113,vijay@sample.com,Bengaluru,Business Loan,10000000,Walk-in
Ratan Tata,9820011114,ratan@sample.com,Pune,Loan Against Property,15000000,Branch
Sunil Gavaskar,9820011115,sunil@sample.com,Mumbai,Personal Loan,350000,Social Media`
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Management</h1>
          <p className="page-subtitle">
            Upload, manage, and assign customer leads to telecallers
          </p>
        </div>

        <div className="header-actions">
          <button onClick={handleAutoDistribute} className="btn btn-primary" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            <Sparkles size={16} />
            <span>Morning Auto-Distribute</span>
          </button>

          <button onClick={() => setIsBulkOpen(true)} className="btn btn-secondary">
            <Upload size={16} />
            <span>Bulk CSV Upload</span>
          </button>

          <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {actionMessage && (
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
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search leads by name, phone, email, city..."
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
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="follow_up">Follow Up</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
            </select>

            {selectedLeadIds.length > 0 && (
              <button
                onClick={() => setIsAssignOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <UserCheck size={14} />
                <span>Assign ({selectedLeadIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Customer</th>
                <th>Contact</th>
                <th>City</th>
                <th>Loan Requirement</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>Loading leads data...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    No leads found matching your criteria. Click "New Lead" or "Bulk CSV Upload" to add leads.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{lead.customer_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Source: {lead.source || "Direct"}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.825rem" }}>
                        <Phone size={13} color="#64748b" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#64748b" }}>
                          <Mail size={13} color="#94a3b8" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.825rem" }}>{lead.city || "—"}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.loan_type}</div>
                      <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>
                        {lead.loan_amount ? `₹${Number(lead.loan_amount).toLocaleString()}` : "Not specified"}
                      </div>
                    </td>
                    <td>
                      <Badge status={lead.status} />
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => handleViewDetail(lead.id)}
                          className="btn btn-secondary btn-sm"
                          title="View lead history & details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Lead */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Customer Lead"
        footer={
          <>
            <button onClick={() => setIsAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreateLead} className="btn btn-primary">Create Lead</button>
          </>
        }
      >
        <form onSubmit={handleCreateLead}>
          <div className="form-group">
            <label className="form-label">Customer Full Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={newLead.customer_name}
              onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                required
                className="form-input"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="customer@gmail.com"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                <option value="Vehicle Loan">Vehicle Loan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Desired Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                value={newLead.loan_amount}
                onChange={(e) => setNewLead({ ...newLead, loan_amount: e.target.value })}
                placeholder="e.g. 500000"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={newLead.city}
                onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                placeholder="e.g. Mumbai"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select
                className="form-select"
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              >
                <option value="Website">Website Form</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Social Media">Social Media</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Partner Bank">Partner Bank</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk CSV Upload */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Upload Customer Leads (CSV)"
        footer={
          <>
            <button onClick={loadSampleCsv} className="btn btn-secondary">Load Sample Data</button>
            <button onClick={handleBulkUpload} className="btn btn-primary">Upload Leads</button>
          </>
        }
      >
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
            Paste comma-separated lead records (one per line):
          </p>
          <div style={{
            fontSize: "0.75rem",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "8px 12px",
            borderRadius: "6px",
            fontFamily: "monospace",
            color: "#475569",
            marginBottom: "12px"
          }}>
            Format: Name,Phone,Email,City,LoanType,LoanAmount,Source
          </div>

          <textarea
            className="form-textarea"
            rows={8}
            placeholder={`Aarav Sharma,9811223344,aarav@gmail.com,Mumbai,Home Loan,5000000,Website\nDiya Patel,9822334455,diya@gmail.com,Ahmedabad,Personal Loan,300000,Ads`}
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal: Bulk Assign to Telecaller */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Assign ${selectedLeadIds.length} Selected Leads`}
        footer={
          <>
            <button onClick={() => setIsAssignOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleBulkAssign} className="btn btn-primary">Confirm Assignment</button>
          </>
        }
      >
        <div>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "16px" }}>
            Select the telecaller employee to assign these leads to. The employee will see them immediately on their Call Centre portal.
          </p>

          <div className="form-group">
            <label className="form-label">Select Employee</label>
            <select
              className="form-select"
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
            >
              <option value="">-- Choose Employee --</option>
              {employees.filter(e => e.is_active).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code}) - {emp.designation}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal: View Lead Details & Complete History */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Customer Profile & Activity History"
        maxWidth="720px"
        footer={<button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">Close</button>}
      >
        {currentLeadDetail && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "10px",
              marginBottom: "20px"
            }}>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px" }}>
                  {currentLeadDetail.lead.customer_name}
                </h4>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  📞 {currentLeadDetail.lead.phone} • ✉️ {currentLeadDetail.lead.email || "No email"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 4 }}>
                  📍 {currentLeadDetail.lead.city || "Location not given"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 6 }}>
                  <Badge status={currentLeadDetail.lead.status} />
                </div>
                <div style={{ fontWeight: 700, color: "#2563eb", fontSize: "1.1rem" }}>
                  {currentLeadDetail.lead.loan_type} • ₹{Number(currentLeadDetail.lead.loan_amount || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                  Assigned To: {currentLeadDetail.lead.assigned_employee_name || "Unassigned"}
                </div>
              </div>
            </div>

            {/* Calls History */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>
                Call History ({currentLeadDetail.calls.length})
              </h4>
              {currentLeadDetail.calls.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No calls logged for this customer yet.</p>
              ) : (
                currentLeadDetail.calls.map(c => (
                  <div key={c.id} style={{ padding: "10px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Caller: {c.employee_name}</span>
                      <Badge status={c.call_status} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#475569" }}>"{c.remarks || "No remarks"}"</p>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            {/* Followups */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>
                Scheduled Follow-ups ({currentLeadDetail.followups.length})
              </h4>
              {currentLeadDetail.followups.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No follow-ups scheduled.</p>
              ) : (
                currentLeadDetail.followups.map(f => (
                  <div key={f.id} style={{ padding: "10px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        📅 Scheduled: {new Date(f.scheduled_at).toLocaleString()}
                      </span>
                      <Badge status={f.status} />
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: 4 }}>Note: {f.remarks}</p>
                  </div>
                ))
              )}
            </div>

            {/* Documents */}
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>
                Customer Documents ({currentLeadDetail.documents.length})
              </h4>
              {currentLeadDetail.documents.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No documents uploaded yet.</p>
              ) : (
                currentLeadDetail.documents.map(d => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "6px" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{d.document_name}</span>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Uploaded by {d.uploaded_by_name}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Badge status={d.verification_status} />
                      <a href={`http://localhost:5000/${d.file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        View File
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
