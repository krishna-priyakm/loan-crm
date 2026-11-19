import React from "react";

export function MetricCard({ title, value, sub, icon: Icon, color = "blue", change }) {
  const colorMap = {
    blue: { bg: "#eff6ff", color: "#2563eb" },
    green: { bg: "#ecfdf5", color: "#10b981" },
    amber: { bg: "#fffbeb", color: "#f59e0b" },
    purple: { bg: "#f5f3ff", color: "#8b5cf6" },
    rose: { bg: "#fef2f2", color: "#ef4444" },
    cyan: { bg: "#ecfeff", color: "#06b6d4" },
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className="metric-card">
      <div>
        <span className="metric-label">{title}</span>
        <div className="metric-value">{value}</div>
        {sub && <div className="metric-sub">{sub}</div>}
      </div>
      {Icon && (
        <div 
          className="metric-icon-box"
          style={{ backgroundColor: style.bg, color: style.color }}
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
