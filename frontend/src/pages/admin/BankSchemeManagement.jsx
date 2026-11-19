import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  Building2,
  Plus,
  Percent,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  Layers
} from "lucide-react";

export function BankSchemeManagement() {
  const [banks, setBanks] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schemes"); // 'schemes' or 'banks'

  // Modals
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isAddSchemeOpen, setIsAddSchemeOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [bankForm, setBankForm] = useState({
    bank_name: "",
    contact_person: "",
    phone: "",
    email: ""
  });

  const [schemeForm, setSchemeForm] = useState({
    bank_id: "",
    scheme_name: "",
    loan_type: "Personal Loan",
    interest_rate: "",
    min_amount: "",
    max_amount: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getBanks();
      setBanks(res.banks || []);
      setSchemes(res.schemes || []);
      if (res.banks && res.banks.length > 0 && !schemeForm.bank_id) {
        setSchemeForm(prev => ({ ...prev, bank_id: res.banks[0].id }));
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

  const handleCreateBank = async (e) => {
    e.preventDefault();
    try {
      await api.createBank(bankForm);
      setIsAddBankOpen(false);
      setBankForm({ bank_name: "", contact_person: "", phone: "", email: "" });
      setMessage("Bank added successfully!");
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to add bank");
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    try {
      await api.createScheme({
        ...schemeForm,
        bank_id: Number(schemeForm.bank_id),
        interest_rate: Number(schemeForm.interest_rate),
        min_amount: schemeForm.min_amount ? Number(schemeForm.min_amount) : 50000,
        max_amount: schemeForm.max_amount ? Number(schemeForm.max_amount) : 5000000
      });
      setIsAddSchemeOpen(false);
      setSchemeForm({
        bank_id: banks[0]?.id || "",
        scheme_name: "",
        loan_type: "Personal Loan",
        interest_rate: "",
        min_amount: "",
        max_amount: ""
      });
      setMessage("Loan scheme created successfully!");
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to create scheme");
    }
  };

  const handleDeleteScheme = async (id) => {
    if (!window.confirm("Are you sure you want to delete this loan scheme?")) return;
    try {
      await api.deleteScheme(id);
      setMessage("Scheme removed");
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to delete scheme");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bank & Loan Scheme Management</h1>
          <p className="page-subtitle">
            Configure partner banks, lending schemes, interest rates, and loan limits
          </p>
        </div>

        <div className="header-actions">
          <button onClick={() => setIsAddBankOpen(true)} className="btn btn-secondary">
            <Building2 size={16} />
            <span>Add Bank</span>
          </button>
          <button onClick={() => setIsAddSchemeOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Loan Scheme</span>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("schemes")}
          className={`btn ${activeTab === "schemes" ? "btn-primary" : "btn-secondary"}`}
        >
          <Percent size={16} />
          <span>Loan Schemes ({schemes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("banks")}
          className={`btn ${activeTab === "banks" ? "btn-primary" : "btn-secondary"}`}
        >
          <Building2 size={16} />
          <span>Partner Banks ({banks.length})</span>
        </button>
      </div>

      {activeTab === "schemes" ? (
        <div className="table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Bank Name</th>
                  <th>Loan Type</th>
                  <th>Interest Rate</th>
                  <th>Amount Range (Min - Max)</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>Loading loan schemes...</td>
                  </tr>
                ) : schemes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                      No loan schemes found. Click "Add Loan Scheme" to add one.
                    </td>
                  </tr>
                ) : (
                  schemes.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.scheme_name}</strong></td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{s.bank_name}</span>
                      </td>
                      <td>{s.loan_type}</td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: "#166534",
                          backgroundColor: "#dcfce7",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}>
                          {s.interest_rate}% p.a.
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        ₹{Number(s.min_amount).toLocaleString()} - ₹{Number(s.max_amount).toLocaleString()}
                      </td>
                      <td>
                        <Badge status={s.is_active ? "approved" : "rejected"} text={s.is_active ? "Active" : "Inactive"} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteScheme(s.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Key Contact Person</th>
                  <th>Phone Number</th>
                  <th>Official Email</th>
                  <th>Total Active Schemes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {banks.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Building2 size={18} color="#2563eb" />
                        <strong>{b.bank_name}</strong>
                      </div>
                    </td>
                    <td>{b.contact_person || "—"}</td>
                    <td>{b.phone || "—"}</td>
                    <td>{b.email || "—"}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#2563eb" }}>
                        {b.schemes ? b.schemes.length : 0} schemes
                      </span>
                    </td>
                    <td>
                      <Badge status={b.is_active ? "approved" : "rejected"} text={b.is_active ? "Active" : "Inactive"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      <Modal
        isOpen={isAddBankOpen}
        onClose={() => setIsAddBankOpen(false)}
        title="Add Partner Bank"
        footer={
          <>
            <button onClick={() => setIsAddBankOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreateBank} className="btn btn-primary">Add Bank</button>
          </>
        }
      >
        <form onSubmit={handleCreateBank}>
          <div className="form-group">
            <label className="form-label">Bank Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={bankForm.bank_name}
              onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
              placeholder="e.g. Canara Bank"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              value={bankForm.contact_person}
              onChange={(e) => setBankForm({ ...bankForm, contact_person: e.target.value })}
              placeholder="Loan Relationship Manager"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={bankForm.phone}
                onChange={(e) => setBankForm({ ...bankForm, phone: e.target.value })}
                placeholder="9811002233"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={bankForm.email}
                onChange={(e) => setBankForm({ ...bankForm, email: e.target.value })}
                placeholder="loans@bank.com"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Scheme Modal */}
      <Modal
        isOpen={isAddSchemeOpen}
        onClose={() => setIsAddSchemeOpen(false)}
        title="Create New Loan Scheme"
        footer={
          <>
            <button onClick={() => setIsAddSchemeOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreateScheme} className="btn btn-primary">Create Scheme</button>
          </>
        }
      >
        <form onSubmit={handleCreateScheme}>
          <div className="form-group">
            <label className="form-label">Partner Bank *</label>
            <select
              className="form-select"
              required
              value={schemeForm.bank_id}
              onChange={(e) => setSchemeForm({ ...schemeForm, bank_id: e.target.value })}
            >
              {banks.map(b => (
                <option key={b.id} value={b.id}>{b.bank_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Scheme Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={schemeForm.scheme_name}
              onChange={(e) => setSchemeForm({ ...schemeForm, scheme_name: e.target.value })}
              placeholder="e.g. Express Personal Loan 2026"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Loan Type *</label>
              <select
                className="form-select"
                value={schemeForm.loan_type}
                onChange={(e) => setSchemeForm({ ...schemeForm, loan_type: e.target.value })}
              >
                <option value="Personal Loan">Personal Loan</option>
                <option value="Home Loan">Home Loan</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Loan Against Property">Loan Against Property</option>
                <option value="Education Loan">Education Loan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Annual Interest Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                value={schemeForm.interest_rate}
                onChange={(e) => setSchemeForm({ ...schemeForm, interest_rate: e.target.value })}
                placeholder="10.5"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Min Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                value={schemeForm.min_amount}
                onChange={(e) => setSchemeForm({ ...schemeForm, min_amount: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                value={schemeForm.max_amount}
                onChange={(e) => setSchemeForm({ ...schemeForm, max_amount: e.target.value })}
                placeholder="5000000"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
