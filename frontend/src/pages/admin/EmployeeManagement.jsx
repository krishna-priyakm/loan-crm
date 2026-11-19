import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { Badge } from "../../components/Badge";
import { Modal } from "../../components/Modal";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Calendar,
  Lock,
  Edit2,
  CheckCircle2
} from "lucide-react";

export function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employee_code: "",
    phone: "",
    designation: "Call Centre Executive",
    joining_date: new Date().toISOString().split("T")[0]
  });

  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    designation: "",
    is_active: true,
    password: ""
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      setEmployees(res.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createEmployee(formData);
      setIsAddOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        employee_code: "",
        phone: "",
        designation: "Call Centre Executive",
        joining_date: new Date().toISOString().split("T")[0]
      });
      setMessage("Employee created successfully!");
      loadEmployees();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to create employee");
    }
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp);
    setEditData({
      name: emp.name,
      phone: emp.phone || "",
      designation: emp.designation,
      is_active: emp.is_active,
      password: ""
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editData.name,
        phone: editData.phone,
        designation: editData.designation,
        is_active: editData.is_active
      };
      if (editData.password && editData.password.trim().length >= 8) {
        payload.password = editData.password.trim();
      }

      await api.updateEmployee(selectedEmp.id, payload);
      setIsEditOpen(false);
      setMessage("Employee profile & access controls updated!");
      loadEmployees();
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to update employee");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Management & Access Control</h1>
          <p className="page-subtitle">
            Manage call centre staff accounts, role designations, and active access status
          </p>
        </div>

        <div className="header-actions">
          <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
            <UserPlus size={16} />
            <span>Add New Employee</span>
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

      {/* Employees Grid & Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <span style={{ fontWeight: 700, color: "#0f172a" }}>
            Total Employees: {employees.length} ({employees.filter(e => e.is_active).length} Active)
          </span>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Default target: 100 calls/day per employee
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Joining Date</th>
                <th>Access Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>Loading staff directory...</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <span style={{
                        padding: "3px 8px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "0.8rem"
                      }}>
                        {emp.employee_code}
                      </span>
                    </td>
                    <td><strong>{emp.name}</strong></td>
                    <td style={{ fontSize: "0.85rem" }}>{emp.email}</td>
                    <td style={{ fontSize: "0.85rem" }}>{emp.phone || "—"}</td>
                    <td>{emp.designation}</td>
                    <td style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Badge
                        status={emp.is_active ? "approved" : "rejected"}
                        text={emp.is_active ? "Active" : "Disabled"}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="btn btn-secondary btn-sm"
                        title="Edit employee or toggle access"
                      >
                        <Edit2 size={14} />
                        <span>Edit / Access</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Call Centre Employee"
        footer={
          <>
            <button onClick={() => setIsAddOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreate} className="btn btn-primary">Create Account</button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Employee Full Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@loancrm.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password * (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Staff@123456"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Employee Code *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                placeholder="EMP020"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <select
                className="form-select"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              >
                <option value="Call Centre Executive">Call Centre Executive</option>
                <option value="Senior Telecaller">Senior Telecaller</option>
                <option value="Loan Specialist">Loan Specialist</option>
                <option value="Team Leader">Team Leader</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit / Access Control Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Profile & Access: ${selectedEmp?.name}`}
        footer={
          <>
            <button onClick={() => setIsEditOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleUpdate} className="btn btn-primary">Save Changes</button>
          </>
        }
      >
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="form-input"
                value={editData.designation}
                onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
              />
            </div>
          </div>

          {/* Access Control Toggle */}
          <div className="form-group" style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "14px"
          }}>
            <label className="form-label" style={{ marginBottom: "6px" }}>Login & Access Control</label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="checkbox"
                id="accessCheckbox"
                style={{ width: 18, height: 18, cursor: "pointer" }}
                checked={editData.is_active}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
              />
              <label htmlFor="accessCheckbox" style={{ fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}>
                {editData.is_active ? "Account Active (User can log in & receive leads)" : "Account Disabled (Access revoked)"}
              </label>
            </div>
          </div>

          {/* Reset Password */}
          <div className="form-group">
            <label className="form-label">Reset Password (leave empty to keep current)</label>
            <input
              type="password"
              minLength={8}
              className="form-input"
              placeholder="Enter new password if resetting..."
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
