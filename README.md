# SafePaste — Client-Side AI & Docs Privacy Shield

A zero-trust, **100% browser-based** data sanitization workspace that detects, validates, audits, and redacts sensitive PII directly in client memory before you paste logs, resumes, support tickets, clinical notes, or CSV exports into LLMs (ChatGPT, Gemini, Claude) or third-party tools.

---

## Zero-Trust Client-Side Guarantee

- **0 KB Uploaded • 0 External API Calls:** All regex scanning, Luhn/Verhoeff checksum verification, overlap resolution, and file generation run deterministically in-browser.
- **Production CSP Hardening:** Production builds (`npm run build`) inject `connect-src 'none'` into `dist/index.html` via Vite's `transformIndexHtml` hook, instructing the browser itself to block any outbound `fetch`, `XHR`, or `WebSocket` requests.
- **Offline Ready:** Works completely offline once loaded; local `.txt` and `.csv` files are read via the browser `FileReader` API and exported via `Blob` URLs.

---

## Key Features

- **Multi-Format Input:**
  - Live raw text editor (paste or type directly with instant re-computation).
  - Drag-and-drop or file picker upload for `.txt` and `.csv` files (`FileReader` API).
  - Three **1-Click Sample Loaders**:
    - **Job Resume** (repeated emails, Indian/US phones, PAN, Aadhaar format, IPv4).
    - **Support Ticket** (IPv4/IPv6, repeated email, Luhn-valid test Visa card, plus two non-Luhn 16-digit Order/Tracking IDs to prove false-positive filtering).
    - **Sales / CRM CSV** (structured CSV rows, repeated user records, non-PII numeric IDs).
- **Deterministic Pattern Engine (`src/engine/`):**
  - **Credit Cards** (13–19 digits with strict **Luhn mod-10 validation** — random 16-digit Order/Tracking IDs are safely ignored and tracked under *False Positives Ignored*).
  - **Indian Aadhaar** (12-digit format with optional **Verhoeff checksum** toggle).
  - **Indian PAN** (`[A-Z]{5}[0-9]{4}[A-Z]`).
  - **Email Addresses** (RFC-style local@domain).
  - **Phone Numbers** (Indian `+91` / 10-digit mobile and standard international E.164 formats).
  - **IPv4 & IPv6 Addresses** (including compressed `::` IPv6 notation).
  - **Priority-Based Overlap Resolution:** Prevents partial matches (such as phone or Aadhaar regexes) from corrupting longer tokens or non-Luhn numeric IDs.
- **Three Instant Redaction Modes:**
  - **Full Mask:** `[EMAIL_REDACTED]`, `[CARD_REDACTED]`, `[PAN_REDACTED]`, etc.
  - **Partial Mask:** Preserves safe verification context (`XXXX-XXXX-XXXX-0366`, `r***@acme.io`, `ABCDE****F`, `******3210`, `10.24.***.***`).
  - **Consistent Pseudonymization (AI-Safe Mode):** Deterministic per-document mapping (`EMAIL_01`, `CARD_01`, `PHONE_01`) so LLMs retain entity relationships without seeing real secrets.
- **Live Audit & Export:**
  - Side-by-side Original (inline color-coded highlights + hover tooltips with validation badges) vs. Sanitized Output.
  - Privacy Risk Meter, per-category toggles, and **False Positives Ignored (Luhn Verified)** counter.
  - 1-click Copy, `sanitized_<filename>` download (`.txt`/`.csv`), and **Export Pseudonym Key (`.json`)**.

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 + `lucide-react`
- **Testing:** Vitest

---

## Project Structure

```text
src/
├── components/
│   ├── AuditDashboard.tsx   # Risk meter, Luhn false-positive badge, mode switcher, category toggles
│   ├── DiffWorkspace.tsx    # Side-by-side Original (highlights/tooltips & raw editor) vs. Sanitized output
│   ├── Header.tsx           # Branding, 0 KB / Offline badge, file upload button
│   └── SampleBar.tsx        # 1-click sample loaders & Clear button
├── data/
│   └── samples.ts           # 3 curated synthetic datasets (Resume, Support Ticket, CRM CSV)
├── engine/
│   ├── __tests__/
│   │   └── sanitizer.test.ts
│   ├── patterns.ts          # Regex registry, priority order, UI metadata
│   ├── sanitizer.ts         # Scan, overlap resolver, Full/Partial/Pseudonym modes, audit metrics
│   └── validators.ts        # Luhn mod-10 & Verhoeff D5 checksum validators
├── utils/
│   └── fileHandlers.ts      # Browser FileReader (.txt/.csv) & Blob download helpers
├── App.tsx
├── index.css
└── main.tsx
```

---

## Local Setup & Verification

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run TypeScript check
npm run typecheck

# Run automated unit tests (12 tests)
npm test

# Build production bundle (injects connect-src 'none' CSP)
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment (Vercel / Netlify)

SafePaste compiles to static assets in `dist/` with zero backend dependencies.

- **Vercel:** Connect the repository (or run `npx vercel --prod`) with Build Command `npm run build` and Output Directory `dist`.
- **Netlify:** Connect the repository with Build Command `npm run build` and Publish Directory `dist`.
