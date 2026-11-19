import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  FolderOpen,
  Upload,
  ExternalLink,
  CheckCircle2,
  FileCheck,
  Plus
} from "lucide-react";

export function StaffDocuments() {
  const [documents, setDocuments] = useState([]);
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [leadId, setLeadId] = useState("");
  const [docType, setDocType] = useState("PAN Card");
  const [customDocName, setCustomDocName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, leadsRes] = await Promise.all([
        api.getMyDocuments(),
        api.getMyAssignedLeads()
      ]);
      setDocuments(docsRes.documents || []);
      setAssignedLeads(leadsRes.leads || []);
      if (leadsRes.leads && leadsRes.leads.length > 0 && !leadId) {
        setLeadId(leadsRes.leads[0].id);
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!leadId || !file) {
      alert("Please select a lead and choose a file to upload.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("lead_id", leadId);
      formData.append("document_name", docType === "Other" ? (customDocName || "Customer Document") : docType);
      formData.append("document", file);

      const res = await api.uploadDocument(formData);
      setIsUploadOpen(false);
      setFile(null);
      setMessage(res.message);
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Document Collection & Tracking</h1>
          <p className="page-subtitle">
            Upload required KYC and income proofs for bank verification
          </p>
        </div>

        <div className="header-actions">
          <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
            <Upload size={16} />
            <span>Upload Customer Document</span>
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
            Documents Uploaded by Me ({documents.length})
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Document Type</th>
                <th>Uploaded Time</th>
                <th>Verification Status</th>
                <th style={{ textAlign: "right" }}>File Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px" }}>Loading documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No documents uploaded yet. Click "Upload Customer Document" to submit customer KYC documents.
                  </td>
                </tr>
              ) : (
                documents.map(d => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: "#2563eb" }}>Lead #{d.lead_id}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{d.document_name}</span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(d.uploaded_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td>
                      <Badge status={d.verification_status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <a
                        href={`http://localhost:5000/${d.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        <ExternalLink size={13} />
                        <span>View File</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Customer Document"
        footer={
          <>
            <button onClick={() => setIsUploadOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleUpload} disabled={uploading} className="btn btn-primary">
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="form-label">Select Customer Lead *</label>
            <select
              className="form-select"
              required
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">-- Choose Assigned Lead --</option>
              {assignedLeads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.customer_name} ({l.phone}) - {l.loan_type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Document Category *</label>
            <select
              className="form-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="PAN Card">PAN Card</option>
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Salary Slip (Last 3 Months)">Salary Slip (Last 3 Months)</option>
              <option value="Bank Statement (Last 6 Months)">Bank Statement (Last 6 Months)</option>
              <option value="Form 16 / ITR">Form 16 / ITR Returns</option>
              <option value="Property Valuation Document">Property Valuation Document</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          {docType === "Other" && (
            <div className="form-group">
              <label className="form-label">Custom Document Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Utility Bill / Rental Agreement"
                value={customDocName}
                onChange={(e) => setCustomDocName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">File Attachment (PDF, JPG, PNG, DOCX) *</label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className="form-input"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
