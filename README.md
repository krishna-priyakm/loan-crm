# Loan Sales & Call Centre CRM System

A full-stack enterprise CRM platform built for a loan intermediary processing company coordinating between customers and partner banks. The platform supports ~20 telecaller employees with a daily quota target of 100 calls per employee, comprehensive lead lifecycle management, document verification, partner bank scheme tracking, loan application pipelines, and a dedicated Mobile Admin UI layout.

---

## 📌 Project Overview & Features

### 1. Admin Portal
- **Executive Dashboard**: Live metrics, total leads, daily calls vs team target (100 calls/agent), active telecallers, disbursed loan volumes, conversion funnel, and real-time calling activity stream.
- **Lead Management & Bulk Upload**:
  - Full lead directory with multi-field search (name, phone, email, city) and status filters.
  - Manual lead creation and editing.
  - Bulk lead upload with CSV parsing and sample template loader.
  - Multi-select leads with bulk assignment to telecallers.
  - Full customer history drawer (calls, scheduled follow-ups, documents, and loan applications).
- **Morning Lead Distribution**: One-click intelligent auto-distribution algorithm that evenly splits unassigned customer leads across all active telecallers.
- **Employee Management & Access Control**: Telecaller accounts directory with employee codes, phone numbers, designations, and toggleable login access control.
- **Daily Call Targets & Performance Tracking**: Tracks the 100 calls/day benchmark per employee with live completion progress bars, percentage indicators, and custom target adjustment.
- **Customer & Follow-Up Management**: Centralized calendar schedule of all customer callbacks, overdue alerts, and completion records.
- **Document Collection & Verification**: Admin review dashboard for uploaded KYC & financial documents (PAN, Aadhaar, Salary Slips, Bank Statements) with preview links and 1-click Verify/Reject.
- **Bank & Loan Scheme Management**: CRUD for partner banks (HDFC, SBI, ICICI, Axis, Kotak, etc.) and loan schemes (Personal, Home, Business, LAP) with interest rates and borrowing limits.
- **Loan Application Tracking, Approval & Closure**: End-to-end lifecycle management: `Submitted` ➔ `Under Review` ➔ `Approved` (approved amount) ➔ `Disbursed` (disbursement date & amount) ➔ `Closed`.
- **Reports & Analytics**: Lead funnel conversion analytics, telecaller productivity leaderboard, bank disbursement distribution, and CSV export.

### 2. Staff / Call Centre Portal
- **Staff Calling Desk & Live Target Tracker**: Sticky header showing personal progress towards today's 100-call quota (`X / 100 Calls Completed (Y%)`).
- **Assigned Leads Queue**: Filterable list of assigned customer leads with 1-click calling action.
- **Quick Call Logging**: Log call status (`Interested`, `Follow Up`, `Not Interested`, `Busy / No Answer`, `Converted`) with call duration and notes.
- **Automated Follow-up Scheduling**: Seamlessly schedule future callbacks with date/time picker directly when logging calls.
- **Document Collection & Upload**: Upload customer KYC/income documents directly linked to assigned leads.
- **Loan Application Submission**: Submit loan files to partner banks with scheme selection on behalf of interested leads.
- **Personal Performance Scorecard**: View personal metrics, daily target compliance, and conversion rates.

### 3. Mobile Admin UI
- **Mobile-App Style Web Layout**: Dedicated responsive layout available at `/admin/mobile` and `/mobile`.
- Features smartphone frame simulator with status bar, fullscreen toggle, quick metric cards, telecaller progress meters, lead management, and a native mobile bottom navigation bar.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, Lucide Icons, Pure CSS Design System |
| **Backend** | Node.js, Express.js (ES Modules), Multer, Cors, Dotenv |
| **Database** | PostgreSQL (pg Pool, Transactions, Relational Foreign Keys) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing, Role-based Access Control (RBAC) |

---

## 🔑 Test Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@loancrm.com` | `Adminloancrm@1234` | Full Admin Portal & Mobile Admin UI |
| **Staff (Telecaller)** | `arun@loancrm.com` | `Staff@123456` | Staff Call Centre Portal |
| **Staff (Senior)** | `priya@loancrm.com` | `Staff@123456` | Staff Call Centre Portal |

> *Quick-fill buttons are also available directly on the login screen for 1-click testing.*

---

## 🚀 Running the Project Locally

### 1. Database Setup
Ensure PostgreSQL is running locally on port 5432 with database `loan_crm`.
Update `backend/.env` if your local postgres credentials differ.

Run database initialization and seed data:
```bash
cd backend
node config/setupAndSeed.js
node config/seedLeads.js
```

### 2. Backend Server
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend Web App
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📱 Navigation & Access URLs

- **Web Application Root / Login**: `http://localhost:5173/`
- **Admin Desktop Portal**: `http://localhost:5173/admin`
- **Mobile Admin UI**: `http://localhost:5173/admin/mobile` or `http://localhost:5173/mobile`
- **Staff Call Centre Portal**: `http://localhost:5173/staff`
