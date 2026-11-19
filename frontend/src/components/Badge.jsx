import React from "react";

export function Badge({ status, text }) {
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "_");
  const display = text || (status ? status.replace(/_/g, " ") : "");

  return (
    <span className={`badge badge-${normalized}`}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "currentColor" }} />
      {display}
    </span>
  );
}
