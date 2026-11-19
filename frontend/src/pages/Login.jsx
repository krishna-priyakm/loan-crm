import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building2, Shield, User, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("admin@loancrm.com");
  const [password, setPassword] = useState("Adminloancrm@1234");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/staff");
      }
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (type) => {
    if (type === "admin") {
      setEmail("admin@loancrm.com");
      setPassword("Adminloancrm@1234");
    } else {
      setEmail("arun@loancrm.com");
      setPassword("Staff@123456");
    }
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0f172a",
      backgroundImage: "radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.1) 0px, transparent 50%)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "460px",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "36px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #2563eb, #38bdf8)",
            borderRadius: "14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            marginBottom: "14px",
            boxShadow: "0 8px 16px rgba(37, 99, 235, 0.3)"
          }}>
            <Building2 size={30} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
            Loan Sales & Call Centre CRM
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Bank intermediary loan processing & call centre management
          </p>
        </div>

        {/* Quick Test Credential Switchers */}
        <div style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "12px",
          marginBottom: "24px"
        }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Quick 1-Click Test Credentials:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: email === "admin@loancrm.com" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                backgroundColor: email === "admin@loancrm.com" ? "#eff6ff" : "white",
                color: email === "admin@loancrm.com" ? "#1d4ed8" : "#334155",
                fontWeight: "600",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Shield size={14} /> Admin Account
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("staff")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: email === "arun@loancrm.com" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                backgroundColor: email === "arun@loancrm.com" ? "#eff6ff" : "white",
                color: email === "arun@loancrm.com" ? "#1d4ed8" : "#334155",
                fontWeight: "600",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <User size={14} /> Staff (Telecaller)
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "0.825rem",
            marginBottom: "18px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: "38px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@loancrm.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: "38px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "8px", fontSize: "0.95rem" }}
          >
            {submitting ? "Signing in..." : (
              <>
                <span>Sign in to CRM</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid #f1f5f9",
          fontSize: "0.75rem",
          color: "#94a3b8",
          textAlign: "center"
        }}>
          Loan Sales CRM • 100 Calls/Day Target System
        </div>
      </div>
    </div>
  );
}
