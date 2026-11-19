import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2
} from "lucide-react";

export function DocumentVerification() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getAllDocuments(statusFilter ? `status=${statusFilter}` : "");
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const handleVerify = async (id, status) => {
    try {
      const res = await api.verifyDocument(id, status);
      setMessage(res.message);
      loadDocuments();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to update document verification status");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Collection & Verification</h1>
          <p className="page-subtitle">
            Review, verify, and authenticate customer KYC & financial documents for bank loan processing
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
            Total Documents: {documents.length}
          </span>

          <div className="filters-group">
            <select
              className="select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Verification Statuses</option>
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Document Name / Type</th>
                <th>Uploaded By</th>
                <th>Uploaded Date</th>
                <th>Verification Status</th>
                <th>Preview File</th>
                <th style={{ textAlign: "right" }}>Verification Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>Loading documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No documents uploaded yet. Staff upload documents from their Call Centre Portal.
                  </td>
                </tr>
              ) : (
                documents.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.customer_name || `Lead #${d.lead_id}`}</strong></td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{d.document_name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem" }}>{d.uploaded_by_name || "Telecaller"}</span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(d.uploaded_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td>
                      <Badge status={d.verification_status} />
                    </td>
                    <td>
                      <a
                        href={`http://localhost:5000/${d.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <ExternalLink size={13} />
                        <span>Open Document</span>
                      </a>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {d.verification_status === "pending" ? (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => handleVerify(d.id, "verified")}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircle size={14} />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => handleVerify(d.id, "rejected")}
                            className="btn btn-danger btn-sm"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                          Processed by {d.verified_by_name || "Admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
