# Userflow Gap Audit Report: Browser Native Dialogs

> **Audit Type**: UI / Frontend Dialog & User Experience Hardening  
> **Target**: `Frontend/` (Next.js 14 App Router, Client Components, Modals)  
> **Auditor**: Senior Product Engineer & Architect  
> **Status**: Completed — Ready for Remediation  

---

## 1. Executive Summary

| Metric | Value |
| :--- | :--- |
| **Total Flows Audited** | 6 Major Flow Clusters (15 discrete user journeys) |
| **Total Native Dialog Calls** | 42 |
| **Critical / High Severity** | 4 |
| **Medium Severity** | 12 |
| **Low Severity** | 26 |
| **Primary Risk Vectors** | Main-thread blocking, plain-text password exposure via `prompt()`, unstyled destructive confirmations (irreversible order cancellation / tenant revocation), accessibility non-compliance (missing ARIA roles, focus traps). |

---

## 2. Top 3 Risk Highlights

1. **Unmasked Plaintext Credential Exposure via `window.prompt` (High Severity)**:
   - In [`Frontend/app/superadmin/page.tsx#L390`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/superadmin/page.tsx#L390), resetting tenant admin passwords relies on `window.prompt()`. This blocks the JavaScript engine, displays the inputted password in plaintext with zero masking, and frequently fails silently on embedded webviews, iOS Safari PWA modes, and touch devices.
2. **Accidental High-Impact Destructive Actions (High Severity)**:
   - In [`Frontend/components/admin/OrderSidePanel.tsx#L99`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/components/admin/OrderSidePanel.tsx#L99) and [`Frontend/app/admin/settings/developer-api/PageClient.tsx#L147`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/settings/developer-api/PageClient.tsx#L147), irreversible operations (refund & order cancellation restoring stock, external API key revocation) rely on browser-level `window.confirm`. A single misclick or keyboard trigger executes the destructive API action without visual warnings or contextual confirmation cues.
3. **Severe UX Inconsistency & Double-Modality**:
   - Multiple admin views (e.g., [`Frontend/app/admin/system/settings/PageClient.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/system/settings/PageClient.tsx), [`Frontend/app/admin/products/PageClient.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/products/PageClient.tsx)) already use the custom `globalDialog` for alerts and confirmations, yet retain isolated native `confirm()` and `alert()` calls, causing jarring visual disparities for operators.

---

## 3. Detailed Flow Gap Breakdown

### Flow 1: Super Admin & Multi-Tenancy Management
- **Routes / Files**: [`Frontend/app/superadmin/page.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/superadmin/page.tsx)
- **Findings**:
  - `AUDIT-DLG-001` (High, S): `prompt` on line 390 used for password resetting. Lacks password masking, cancel handling, and mobile compliance.
  - `AUDIT-DLG-002` (Medium, S): `confirm` on line 278 used for tenant status change (Active/Suspended/Terminated).
  - `AUDIT-DLG-003` (Medium, S): `confirm` on line 378 used for tenant admin status toggle.
  - `AUDIT-DLG-004` (Low, S): Native `alert` across lines 247, 268, 283, 290, 293, 331, 335, 350, 369, 384, 394, 396 for general operation feedback and error strings.

### Flow 2: Order Management & Customer Returns
- **Routes / Files**: [`Frontend/components/admin/OrderSidePanel.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/components/admin/OrderSidePanel.tsx), [`Frontend/components/admin/BulkReturnModal.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/components/admin/BulkReturnModal.tsx)
- **Findings**:
  - `AUDIT-DLG-005` (High, S): Native `confirm` on line 99 for order cancellation and stock refund.
  - `AUDIT-DLG-015` (Low, S): Native `alert` on line 42 for bulk returns failure.

### Flow 3: Developer API & Security Keys
- **Routes / Files**: [`Frontend/app/admin/settings/developer-api/PageClient.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/settings/developer-api/PageClient.tsx)
- **Findings**:
  - `AUDIT-DLG-006` (High, S): Native `confirm` on line 147 for revoking public/secret integration API keys.

### Flow 4: ERP & Financial Integrity
- **Routes / Files**: 
  - [`Frontend/app/admin/erp/general-ledger/page.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/erp/general-ledger/page.tsx)
  - [`Frontend/app/admin/erp/stocktaking/page.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/erp/stocktaking/page.tsx)
  - [`Frontend/app/admin/erp/aging/page.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/erp/aging/page.tsx)
- **Findings**:
  - `AUDIT-DLG-007` (Medium, S): Native `alert` on lines 91, 133, 160 for un-balanced journal entry warnings and COA initialization.
  - `AUDIT-DLG-008` (Medium, S): Native `alert` across 7 locations (lines 96, 119, 161, 167, 169, 196, 198) during stocktaking cycles.
  - `AUDIT-DLG-009` (Low, S): Native `alert` on lines 134, 165 for debt payment recording and credit notes.

### Flow 5: AI Assistant & Content Operations
- **Routes / Files**: [`Frontend/app/admin/ai-assistant/page.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/ai-assistant/page.tsx), [`Frontend/app/admin/cms/PageClient.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/admin/cms/PageClient.tsx)
- **Findings**:
  - `AUDIT-DLG-010` (Medium, S): Native `confirm` on line 167 for deleting knowledge documents; native alerts on 160, 172 for save/delete errors.
  - `AUDIT-DLG-013` (Low, S): Native `alert` on line 596 for CMS page saving failure.

### Flow 6: POS & Hardware Integrations
- **Routes / Files**: [`Frontend/components/pos/PosShiftModal.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/components/pos/PosShiftModal.tsx), [`Frontend/hooks/useHardware.ts`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/hooks/useHardware.ts), [`Frontend/app/mock-gateway/PageClient.tsx`](file:///Volumes/240GB%20SSD/Projects/POS/Frontend/app/mock-gateway/PageClient.tsx)
- **Findings**:
  - `AUDIT-DLG-014` (Low, S): Native `alert` on line 77 for POS shift update failures and WebSerial API incompatibility in non-Chromium browsers.
  - `AUDIT-DLG-015` (Low, S): Native `alert` on line 28 for mock payment gateway failures.

---

## 4. Architectural Remediation Plan

1. **Enhance Global Dialog Store (`Frontend/store/dialog.store.ts`)**:
   - Add first-class support for `type: 'prompt'`.
   - Add customizable button text (`confirmText`, `cancelText`).
   - Add visual variants (`default`, `danger`, `warning`, `info`, `success`).
   - Add input options for prompts (`defaultValue`, `placeholder`, `inputType`).
2. **Upgrade Dialog UI Component (`Frontend/components/ui/GlobalDialog.tsx`)**:
   - Implement keyboard handling (`Escape` to cancel, `Enter` to confirm/submit).
   - Implement backdrop blur and focus trap.
   - Implement variant styling (danger icons/buttons for deletions & cancellations).
   - Render stylized input field for prompt dialogs.
3. **Execute Clean Batch Migrations**:
   - Replace all 42 instances across the 16 identified files.
   - Re-run scanner to ensure 0 native dialog calls remain.
   - Execute Next.js build verification to ensure 100% type safety.
