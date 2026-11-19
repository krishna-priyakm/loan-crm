import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Smartphone, Laptop, ShieldCheck, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isMobileRoute = location.pathname.includes("/mobile");

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-title">
          {user?.role === "admin" ? "Admin Portal" : "Call Centre & Sales Portal"}
        </span>
      </div>

      <div className="navbar-actions">
        {user?.role === "admin" && (
          <button
            onClick={() => navigate(isMobileRoute ? "/admin" : "/admin/mobile")}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600, borderColor: "#2563eb", color: "#2563eb" }}
            title="Toggle between Desktop and Mobile Admin layout"
          >
            {isMobileRoute ? <Laptop size={16} /> : <Smartphone size={16} />}
            {isMobileRoute ? "Desktop Admin View" : "Mobile Admin UI"}
          </button>
        )}

        <div className="user-badge">
          <div className="user-avatar">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="btn btn-secondary btn-sm"
          style={{ color: "#ef4444" }}
          title="Sign out"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
