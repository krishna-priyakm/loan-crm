import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./pages/Login";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { LeadManagement } from "./pages/admin/LeadManagement";
import { LeadDistribution } from "./pages/admin/LeadDistribution";
import { EmployeeManagement } from "./pages/admin/EmployeeManagement";
import { DailyTargets } from "./pages/admin/DailyTargets";
import { FollowupManagement } from "./pages/admin/FollowupManagement";
import { DocumentVerification } from "./pages/admin/DocumentVerification";
import { BankSchemeManagement } from "./pages/admin/BankSchemeManagement";
import { LoanApplications } from "./pages/admin/LoanApplications";
import { ReportsAnalytics } from "./pages/admin/ReportsAnalytics";

// Mobile Admin Portal
import { MobileAdminPortal } from "./pages/mobile/MobileAdminPortal";

// Staff Pages
import { StaffDashboard } from "./pages/staff/StaffDashboard";
import { StaffLeads } from "./pages/staff/StaffLeads";
import { StaffFollowups } from "./pages/staff/StaffFollowups";
import { StaffDocuments } from "./pages/staff/StaffDocuments";
import { StaffLoanApplications } from "./pages/staff/StaffLoanApplications";
import { StaffPerformance } from "./pages/staff/StaffPerformance";

import "./App.css";

function ProtectedLayout({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/staff"} replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}

function MobileProtectedLayout() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "admin" ? "/admin" : "/staff"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Dedicated Mobile Admin Portal */}
          <Route element={<MobileProtectedLayout />}>
            <Route path="/admin/mobile" element={<MobileAdminPortal />} />
            <Route path="/mobile" element={<MobileAdminPortal />} />
          </Route>

          {/* Admin Desktop Routes */}
          <Route element={<ProtectedLayout allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/leads" element={<LeadManagement />} />
            <Route path="/admin/distribution" element={<LeadDistribution />} />
            <Route path="/admin/employees" element={<EmployeeManagement />} />
            <Route path="/admin/targets" element={<DailyTargets />} />
            <Route path="/admin/followups" element={<FollowupManagement />} />
            <Route path="/admin/documents" element={<DocumentVerification />} />
            <Route path="/admin/banks" element={<BankSchemeManagement />} />
            <Route path="/admin/applications" element={<LoanApplications />} />
            <Route path="/admin/reports" element={<ReportsAnalytics />} />
          </Route>

          {/* Staff Call Centre Routes */}
          <Route element={<ProtectedLayout allowedRoles={["staff", "admin"]} />}>
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/leads" element={<StaffLeads />} />
            <Route path="/staff/followups" element={<StaffFollowups />} />
            <Route path="/staff/documents" element={<StaffDocuments />} />
            <Route path="/staff/applications" element={<StaffLoanApplications />} />
            <Route path="/staff/performance" element={<StaffPerformance />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
