import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  UserPlus,
  FileCheck,
  Building2,
  FileSpreadsheet,
  Target,
  Clock,
  BarChart3,
  Smartphone,
  CheckCircle,
  FolderOpen
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const adminNav = [
    { section: "Main", items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/leads", label: "Lead Management", icon: Users },
      { to: "/admin/distribution", label: "Lead Distribution", icon: UserPlus },
    ]},
    { section: "Staff & Operations", items: [
      { to: "/admin/employees", label: "Employees & Access", icon: Users },
      { to: "/admin/targets", label: "Daily Targets (100)", icon: Target },
      { to: "/admin/followups", label: "Customer Follow-ups", icon: Clock },
    ]},
    { section: "Loans & Verification", items: [
      { to: "/admin/documents", label: "Document Verification", icon: FileCheck },
      { to: "/admin/banks", label: "Banks & Schemes", icon: Building2 },
      { to: "/admin/applications", label: "Loan Applications", icon: FileSpreadsheet },
    ]},
    { section: "Insights & Mobile", items: [
      { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
      { to: "/admin/mobile", label: "Mobile Admin UI", icon: Smartphone, highlight: true },
    ]}
  ];

  const staffNav = [
    { section: "Calling Desk", items: [
      { to: "/staff", label: "Staff Dashboard", icon: LayoutDashboard },
      { to: "/staff/leads", label: "Assigned Leads (Calls)", icon: PhoneCall },
      { to: "/staff/followups", label: "Scheduled Follow-ups", icon: Clock },
    ]},
    { section: "Processing", items: [
      { to: "/staff/documents", label: "Upload Documents", icon: FolderOpen },
      { to: "/staff/applications", label: "Submit Loan Application", icon: FileSpreadsheet },
      { to: "/staff/performance", label: "Personal Performance", icon: Target },
    ]}
  ];

  const navSections = isAdmin ? adminNav : staffNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Building2 size={20} />
        </div>
        <div>
          <div className="brand-text">LoanCRM</div>
          <div className="brand-subtitle">Sales & Call Centre</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="nav-section-title">{sec.section}</div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin" || item.to === "/staff"}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""} ${item.highlight ? "highlight-nav" : ""}`
                  }
                  style={item.highlight ? { border: "1px dashed #3b82f6", color: "#60a5fa" } : {}}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>
          Target: 100 calls/day • 20 Agents
        </div>
      </div>
    </aside>
  );
}
