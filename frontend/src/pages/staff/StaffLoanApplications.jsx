import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  FileSpreadsheet,
  Plus,
  Building2,
  CheckCircle2,
  DollarSign
} from "lucide-react";

export function StaffLoanApplications() {
  const [applications, setApplications] = useState([]);
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [banks, setBanks] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [leadId, setLeadId] = useState("");
  const [bankId, setBankId] = useState("");
  const [schemeId, setSchemeId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, leadsRes, banksRes] = await Promise.all([
        api.getMyApplications(),
        api.getMyAssignedLeads(),
        api.getBanks()
      ]);

      setApplications(appsRes.applications || []);
      setAssignedLeads(leadsRes.leads || []);
      setBanks(banksRes.banks || []);
      setSchemes(banksRes.schemes || []);

      if (leadsRes.leads && leadsRes.leads.length > 0 && !leadId) {
        setLeadId(leadsRes.leads[0].id);
        setLoanAmount(leadsRes.leads[0].loan_amount || "");
      }
      if (banksRes.banks && banksRes.banks.length > 0 && !bankId) {
        setBankId(banksRes.banks[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createLoanApplication({
        lead_id: Number(leadId),
        bank_id: Number(bankId),
        scheme_id: schemeId ? Number(schemeId) : null,
        loan_amount: Number(loanAmount),
        remarks
      });

      setIsApplyOpen(false);
      setMessage(res.message);
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to submit loan application");
    }
  };

  const availableSchemes = schemes.filter(s => s.bank_id === Number(bankId));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit & Track Loan Applications</h1>
          <p className="page-subtitle">
            Submit interested customer files to partner banks and follow up on loan sanctions
          </p>
        </div>

        <div className="header-actions">
          <button onClick={() => setIsApplyOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Apply For Customer Loan</span>
          </button>
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
            My Submitted Applications ({applications.length})
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Customer Name</th>
                <th>Partner Bank</th>
                <th>Scheme</th>
                <th>Amount Applied</th>
                <th>Status</th>
                <th>Date Applied</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No loan applications submitted yet. Click "Apply For Customer Loan" above.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "0.85rem" }}>
                        {app.application_number}
                      </span>
                    </td>
                    <td>
                      <strong>{app.customer_name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{app.customer_phone}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{app.bank_name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{app.scheme_name || "General Scheme"}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        ₹{Number(app.loan_amount).toLocaleString()}
                      </div>
                      {app.approved_amount && (
                        <div style={{ fontSize: "0.75rem", color: "#166534" }}>
                          Approved: ₹{Number(app.approved_amount).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge status={app.status} />
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Loan Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Submit Customer Loan File to Bank"
        footer={
          <>
            <button onClick={() => setIsApplyOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleApply} className="btn btn-primary">Submit Application</button>
          </>
        }
      >
        <form onSubmit={handleApply}>
          <div className="form-group">
            <label className="form-label">Customer Lead *</label>
            <select
              className="form-select"
              required
              value={leadId}
              onChange={(e) => {
                setLeadId(e.target.value);
                const l = assignedLeads.find(x => x.id === Number(e.target.value));
                if (l && l.loan_amount) setLoanAmount(l.loan_amount);
              }}
            >
              <option value="">-- Select Customer --</option>
              {assignedLeads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.customer_name} ({l.phone}) - {l.loan_type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Partner Bank *</label>
              <select
                className="form-select"
                required
                value={bankId}
                onChange={(e) => {
                  setBankId(e.target.value);
                  setSchemeId("");
                }}
              >
                <option value="">-- Choose Bank --</option>
                {banks.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.bank_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bank Scheme</label>
              <select
                className="form-select"
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value)}
              >
                <option value="">-- Standard Rate --</option>
                {availableSchemes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.scheme_name} ({s.interest_rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Requested Loan Amount (₹) *</label>
            <input
              type="number"
              required
              className="form-input"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="e.g. 500000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Processing Remarks / Special Requests</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Documents collected and verified, customer has 780 CIBIL score..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
