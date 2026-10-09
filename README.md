# KSAC Office — Institutional Event Planning & Documentation Platform

Official digital administration platform of the **Office of the Dean, Student Affairs (KSAC)**, KIIT Deemed to be University.

## 🏛️ Overview
The KSAC Office platform digitizes and standardizes the entire lifecycle of student society event approvals, multi-day scheduling, itemized budgeting, publication-quality A4 formal print copies, and inter-departmental requirement dispatches.

Key capabilities:
1. **Interactive Event Proposal Builder**:
   - Modular sections: Sub-Events, Participation Guidelines, Itemized Budget Table (with automatic Indian Rupee words conversion), Revenue Modeling, Guest Speaker Bio & Fee Breakdown, Venue Requirements, Technical / Sound, Accommodation & Food, Printing, Prizes, Security, Audio-Visual, and Faculty Coordinators.
   - Real-time draft saving and validation.
2. **Publication-Grade A4 Official Print Copies**:
   - Generates pixel-perfect official KIIT DU and KSAC notesheets matching institutional standards (OMEGA 6.0, Codex 2.0, KATADIGM 1.0).
   - Embedded high-resolution base64 logos and official wide banners ensuring 100% offline, zero-network, print-ready document generation.
   - Dual signatory notesheet endorsing on Page 1 with formal forwarding remarks to the Pro-Vice Chancellor (Admin)-cum-Registrar.
3. **Dean KSAC Institutional Controller**:
   - Centralized review queue for all university societies.
   - Actionable workflows: One-click Approve, Request Revision (with specific feedback note), or Reject.
   - Custom notesheet remarks and signatory matrix builder.
   - Signed hardcopy scan upload and verification tracking.
4. **Automated Department Requirement Mailer**:
   - Automatically extracts department-wise requirements (Technical & Sound, Facility & Venue, Food & Hospitality, Security, Finance, Media/PR).
   - Inline email template editor with preview, custom CCs, Dean personal reply-to, and official sender headers.
   - Real-time dispatching via institutional Nodemailer SMTP relay.
   - Manageable Department Directory with custom routing emails.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.17.0
- MongoDB instance (local or MongoDB Atlas)

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your MongoDB URI and SMTP credentials:
```env
MONGODB_URI=mongodb://localhost:27017/ksac_office
JWT_SECRET=your_jwt_secret_key_min_32_characters
REFRESH_SECRET=your_refresh_secret_key_min_32_characters
KSAC_OFFICIAL_SMTP_EMAIL=ksac.office@kiit.ac.in
KSAC_SMTP_DISPLAY_NAME="Office of the Dean, KSAC"
DEAN_REPLYTO_EMAIL=deanksac@kiit.ac.in
KSAC_SMTP_USER=ksac.office@kiit.ac.in
KSAC_SMTP_PASSWORD=your_institutional_smtp_app_password
```

### 3. Install Dependencies & Seed
```bash
npm install
npm run seed
```
This initializes the database with:
- **Dean KSAC**: `deanksac@kiit.ac.in` (Password: `Dean@123`)
- **Film Society President**: `president.film@kiit.ac.in` (Password: `Password@123`)
- **Default Department Directory**: Technical, Venue, Hospitality, Security, Finance, and Media.

### 4. Run Development Server
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

### 5. Automated Tests
```bash
npm test
```

---

## 📁 Project Architecture
```
ksac-office/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, logout, session verification
│   │   └── gateway/       # Cryptographic masked gateway dispatcher (opcodes 0x30 - 0x35)
│   ├── dashboard/         # Role-based dashboard (Dean Controller vs Society Builder)
│   ├── login/             # Institutional authentication portal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx         # Header with branding, society badge & user profile
│   └── dashboard/
│       ├── DeanEventController.tsx      # Dean review, mailer & directory
│       ├── StudentEventProposals.tsx    # Society proposal builder & tracker
│       └── EventProposalDocument.tsx    # Sandboxed printable A4 document preview
├── lib/
│   ├── db.ts                            # MongoDB connection pooling
│   ├── auth.ts & jwt.ts                 # JWT session resolution
│   ├── sanitize.ts                      # Input validation & XSS protection
│   ├── documentAssets.ts                # Base64 embedded logos & graphics
│   ├── eventProposalPresets.ts          # Section schemas & INR converters
│   ├── proposalDocumentTemplate.ts      # Publication-grade HTML generator
│   └── event-department-email.ts        # Institutional Nodemailer mailer
├── models/
│   ├── User.ts                          # Institutional roles & society positions
│   ├── EventProposal.ts                 # Multi-section proposal schema
│   ├── DepartmentConfig.ts              # Department email directory
│   └── ActivityLog.ts                   # Institutional audit log
├── public/logos/                        # KIIT and KSAC clean official assets
└── __tests__/                           # Automated unit test suite
```

---

## 🔒 Security
- Enforces strict role-based access control (RBAC). Only authenticated Society Presidents, Vice-Presidents, and Dean KSAC can access event workflows.
- HTTP-only, SameSite cookies for access and refresh tokens with version-based invalidation.
- Distributed anti-replay nonces and integrity signatures on gateway requests.
- Full CRLF header injection mitigation on SMTP mailer endpoints.
