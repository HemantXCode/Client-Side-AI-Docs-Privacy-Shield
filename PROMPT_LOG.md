# SafePaste — Engineering & Prompt Iteration Log

This log documents the key architectural decisions, deterministic engine refinements, and UI/UX iterations made while building **SafePaste — Client-Side AI & Docs Privacy Shield**.

---

## 1. Architecture & Zero-Trust Design
- **Decision:** Keep the entire application 100% client-side using React 18, TypeScript, Vite, and Tailwind CSS with zero backend or LLM API calls.
- **Network Isolation Enforcement:** Added a Vite build-time plugin (`zeroNetworkCspPlugin` in `vite.config.ts`) that injects `Content-Security-Policy: ... connect-src 'none'` into `dist/index.html` on `npm run build`. This keeps `vite dev` HMR working cleanly in development while guaranteeing at the browser-engine level that production builds cannot send outbound `fetch`/`XHR`/`WebSocket` traffic.

---

## 2. Deterministic Detection Engine & Edge-Case Debugging
- **Overlap & Rejected-ID Protection:**
  - *Challenge:* A naive phone or Aadhaar regex can accidentally match substrings inside 16-digit non-Luhn Order/Tracking IDs (e.g. `8842190344517720` or `9988-7766-5544-3321`), partially redacting safe business IDs.
  - *Resolution:* Priority-ordered scanning evaluates `credit_card` candidates first. Any 13–19 digit candidate failing `isValidLuhn()` is recorded in `rejectedCardRanges` and counted in `luhnRejectedCount` / `falsePositivesIgnored`. Subsequent `aadhaar` and `phone` scans skip ranges overlapping `rejectedCardRanges`, and accepted spans undergo deterministic priority + span-length overlap resolution.
- **Sentence-Ending Punctuation Bug (Caught by Vitest):**
  - *Challenge:* Initial negative lookaheads `(?![\d.\w])` and `(?![\d.-])` rejected valid 16-digit IDs and phone numbers when immediately followed by a sentence-ending period (e.g. `Tracking 8842190344517720.` or `Phone3: +91 91234 56789.`).
  - *Resolution:* Updated lookaheads to `(?!(?:\.\d|\d|\w))` and `(?!(?:\.\d|\d|-\d))` so decimal numbers (`123.45`) and extra IP octets (`1.2.3.4.5`) remain excluded while numbers at the end of sentences match cleanly.
- **Aadhaar Checksum Flexibility:**
  - *Decision:* Provide regex format matching by default for synthetic demo data, alongside a live **Strict Aadhaar Verhoeff Checksum** toggle (`isValidVerhoeff`) and validation badges (`Verhoeff Verified` vs `Format Match`) in hover tooltips.
- **Windows Path `&` Script Compatibility:**
  - *Observation:* Running `.cmd` shims under `cmd.exe` inside a directory named `Client-Side AI & Docs Privacy Shield` triggered path-splitting on `&`. Updated `package.json` scripts to invoke `node ./node_modules/...` entrypoints directly, ensuring reliable execution across Windows, macOS, Linux, and CI/CD.

---

## 3. UI/UX & Demo Clarity Iterations
- **Dual-Mode Left Pane (`Highlights` & `Edit Raw`):**
  - Transparent `<textarea>` overlays block native pointer hover tooltips on matched spans. Implemented a clean segmented toggle in the Left Pane header allowing instant switching between **Highlights** (with color-coded PII underlines, hover tooltips showing entity type + validation badge + replacement preview, and dashed cyan highlights for Luhn-rejected safe IDs) and **Edit Raw** (live `<textarea>` updating the sanitized Right Pane on every keystroke).
- **Consistent Pseudonymization + Safe Key Export:**
  - Normalized tokens (`email` lowercased, `phone`/`card`/`aadhaar` digits-only) ensure duplicate references like `alice@corp.com` and `ALICE@corp.com` always map to `EMAIL_01`. Exported `.json` mapping keys record `{ category, occurrences }` per placeholder without embedding raw PII.

---

## 4. Verification Summary
- `npm run typecheck` (`tsc --noEmit`): 0 errors.
- `npm test` (Vitest): 12/12 unit & sample integration tests passing (`src/engine/__tests__/sanitizer.test.ts`).
- `npm run build`: Clean production bundle emitted to `dist/`.
