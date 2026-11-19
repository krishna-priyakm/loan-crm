import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  TrendingUp
} from "lucide-react";

export function LoanApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // Action Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionType, setActionType] = useState(""); // 'approve', 'disburse', 'reject', 'close'
  const [approvedAmount, setApprovedAmount] = useState("");
  const [disbursedAmount, setDisbursedAmount] = useState("");
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await api.getAllApplications(params.toString());
      setApplications(res.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, search]);

  const handleOpenAction = (app, type) => {
    setSelectedApp(app);
    setActionType(type);
    setApprovedAmount(app.loan_amount || "");
    setDisbursedAmount(app.approved_amount || app.loan_amount || "");
    setRemarks(app.remarks || "");
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status:
          actionType === "approve" ? "approved" :
          actionType === "disburse" ? "disbursed" :
          actionType === "reject" ? "rejected" :
          "closed",
        remarks
      };

      if (actionType === "approve") {
        payload.approved_amount = Number(approvedAmount);
      } else if (actionType === "disburse") {
        payload.disbursed_amount = Number(disbursedAmount);
        payload.disbursement_date = disbursementDate;
      }

      const res = await api.updateApplicationStatus(selectedApp.id, payload);
      setSelectedApp(null);
      setMessage(res.message);
      loadApplications();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to update loan status");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Application Tracking & Approval</h1>
          <p className="page-subtitle">
            Coordinate with partner banks, track stages from submission to disbursement and closure
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

      {/* Applications Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by app #, customer name, phone, bank..."
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
              <option value="">All Pipeline Stages</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="disbursed">Disbursed</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Customer</th>
                <th>Partner Bank & Scheme</th>
                <th>Requested / Approved</th>
                <th>Agent</th>
                <th>Pipeline Status</th>
                <th>Date Applied</th>
                <th style={{ textAlign: "right" }}>Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No loan applications found.
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
                      <div style={{ fontWeight: 600 }}>{app.bank_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {app.scheme_name || "Standard Scheme"} ({app.interest_rate ? `${app.interest_rate}%` : ""})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        ₹{Number(app.loan_amount || 0).toLocaleString()}
                      </div>
                      {app.approved_amount && (
                        <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>
                          Approved: ₹{Number(app.approved_amount).toLocaleString()}
                        </div>
                      )}
                      {app.disbursed_amount && (
                        <div style={{ fontSize: "0.75rem", color: "#0f766e", fontWeight: 600 }}>
                          Disbursed: ₹{Number(app.disbursed_amount).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{app.employee_name || "—"}</span>
                    </td>
                    <td>
                      <Badge status={app.status} />
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        {app.status === "submitted" || app.status === "under_review" ? (
                          <>
                            <button
                              onClick={() => handleOpenAction(app, "approve")}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleOpenAction(app, "reject")}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : app.status === "approved" ? (
                          <button
                            onClick={() => handleOpenAction(app, "disburse")}
                            className="btn btn-primary btn-sm"
                            style={{ background: "#059669" }}
                          >
                            <DollarSign size={13} />
                            <span>Disburse Loan</span>
                          </button>
                        ) : app.status === "disbursed" ? (
                          <button
                            onClick={() => handleOpenAction(app, "close")}
                            className="btn btn-secondary btn-sm"
                          >
                            <span>Close Loan</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{app.status}</span>
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

      {/* Lifecycle Action Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={
          actionType === "approve" ? "Bank Loan Approval" :
          actionType === "disburse" ? "Record Bank Disbursement" :
          actionType === "reject" ? "Reject Application" :
          "Close Loan Account"
        }
        footer={
          <>
            <button onClick={() => setSelectedApp(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleConfirmAction} className="btn btn-primary">
              Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </button>
          </>
        }
      >
        {selectedApp && (
          <form onSubmit={handleConfirmAction}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ fontWeight: 700 }}>{selectedApp.customer_name} ({selectedApp.application_number})</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Bank: {selectedApp.bank_name} • Requested: ₹{Number(selectedApp.loan_amount).toLocaleString()}
              </div>
            </div>

            {actionType === "approve" && (
              <div className="form-group">
                <label className="form-label">Approved Loan Amount (₹) *</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                />
              </div>
            )}

            {actionType === "disburse" && (
              <>
                <div className="form-group">
                  <label className="form-label">Disbursed Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={disbursedAmount}
                    onChange={(e) => setDisbursedAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Disbursement Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={disbursementDate}
                    onChange={(e) => setDisbursementDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Remarks / Bank Reference Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Bank reference number or approval comments..."
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
