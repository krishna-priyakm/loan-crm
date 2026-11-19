const API_BASE_URL = "http://localhost:5000/api";

export async function apiRequest(endpoint, method = "GET", data = null, isFormData = false) {
  const token = localStorage.getItem("token");
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json().catch(() => ({ message: "Failed to parse JSON response" }));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes("/auth/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      throw new Error(result.message || `Request failed with status ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`API Error on ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => apiRequest("/auth/login", "POST", credentials),

  // Employees
  getEmployees: () => apiRequest("/employees"),
  createEmployee: (employee) => apiRequest("/employees", "POST", employee),
  updateEmployee: (id, data) => apiRequest(`/employees/${id}`, "PUT", data),

  // Leads
  getLeads: (params = "") => apiRequest(`/leads${params ? `?${params}` : ""}`),
  getLeadById: (id) => apiRequest(`/leads/${id}`),
  createLead: (lead) => apiRequest("/leads", "POST", lead),
  updateLead: (id, lead) => apiRequest(`/leads/${id}`, "PUT", lead),
  deleteLead: (id) => apiRequest(`/leads/${id}`, "DELETE"),
  bulkUploadLeads: (leads) => apiRequest("/leads/bulk-upload", "POST", { leads }),

  // Assignments
  getAssignments: () => apiRequest("/assignments"),
  assignLead: (data) => apiRequest("/assignments", "POST", data),
  bulkAssignLeads: (data) => apiRequest("/assignments/bulk", "POST", data),
  autoDistributeLeads: () => apiRequest("/assignments/auto-distribute", "POST"),
  getMyAssignedLeads: () => apiRequest("/assignments/my-leads"),

  // Calls
  recordCall: (callData) => apiRequest("/calls", "POST", callData),
  getMyCallHistory: () => apiRequest("/calls/my-history"),
  getAllCalls: () => apiRequest("/calls"),

  // Follow-ups
  createFollowup: (followupData) => apiRequest("/followups", "POST", followupData),
  getMyFollowups: () => apiRequest("/followups/my-followups"),
  getAllFollowups: () => apiRequest("/followups"),
  updateFollowupStatus: (id, status) => apiRequest(`/followups/${id}/status`, "PATCH", { status }),

  // Daily Targets
  setDailyTarget: (targetData) => apiRequest("/daily-targets", "POST", targetData),
  getMyDailyTarget: () => apiRequest("/daily-targets/my-target"),
  getAllDailyPerformance: () => apiRequest("/daily-targets/performance"),

  // Documents
  uploadDocument: (formData) => apiRequest("/documents", "POST", formData, true),
  getMyDocuments: () => apiRequest("/documents/my-documents"),
  getAllDocuments: (params = "") => apiRequest(`/documents${params ? `?${params}` : ""}`),
  verifyDocument: (id, status) => apiRequest(`/documents/${id}/verify`, "PATCH", { status }),

  // Banks & Loan Schemes
  getBanks: () => apiRequest("/banks"),
  createBank: (bank) => apiRequest("/banks", "POST", bank),
  updateBank: (id, bank) => apiRequest(`/banks/${id}`, "PUT", bank),
  createScheme: (scheme) => apiRequest("/banks/schemes", "POST", scheme),
  updateScheme: (id, scheme) => apiRequest(`/banks/schemes/${id}`, "PUT", scheme),
  deleteScheme: (id) => apiRequest(`/banks/schemes/${id}`, "DELETE"),

  // Loan Applications
  createLoanApplication: (data) => apiRequest("/loan-applications", "POST", data),
  getAllApplications: (params = "") => apiRequest(`/loan-applications${params ? `?${params}` : ""}`),
  getMyApplications: () => apiRequest("/loan-applications/my-applications"),
  updateApplicationStatus: (id, data) => apiRequest(`/loan-applications/${id}/status`, "PATCH", data),

  // Reports
  getAdminDashboardStats: () => apiRequest("/reports/admin-dashboard"),
  getStaffPerformanceStats: () => apiRequest("/reports/staff-performance"),
};
