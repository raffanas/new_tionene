# TÍO NENÊ — CURRENT STATUS | v0.1.43

**Checkpoint:** v0.1.43 · 2026-10-21 · **CLEANED WORKING DEVELOPER HANDOFF — not a production certification**.

This is the **only current-status page**. The previous status through v0.1.40, including an obsolete v0.1.38 checkpoint line and historical "remaining" lists, is preserved in `History/Pre_v0.1.41_CURRENT_STATUS.md` and is **NOT current implementation guidance**.

| Priority | Subject | Current status / next action |
|---|---|---|
| DONE / source | 10 suppliers, 52 seller-facing source products, 80 original rates, 11 XLSXs, Xcaret 2026 calendars | Packaged and source-QC verified; original supplier files preserved byte-identical. **Initial catalog, not exhaustive.** |
| DONE / source | Final hotel master 1,125 hotels in 8 canonical zones | Packaged and structurally validated; production hotel-to-booking integration remains developer UAT. |
| DONE / source | Original unsigned Portuguese 18-clause contract template | Packaged; exact customer PDF with repeatable hotels/tours/installments still to be rendered/tested. Legal revisions deferred. |
| DONE / business decision | Dolphin eight-zone round-trip per-person age-based costs, default transport, Admin opt-out | Standalone supplemental seed and original MXN screenshot included; never count as an extra original supplier Rate ID. |
| DONE / business decision | Seller/Admin access, supplier reservation fields and link scope, customer installments/refunds | Current rules in `04_*` §C and `11_*`; running security and ledger tests NOT performed. |
| DONE / business decision | 2027+ Xcaret fully selectable dates; current configured supplier costs; Admin on-demand season/rate editing; selective future supplier repricing | Exact 2027 season dates remain unknown and must never be guessed. |
| **P0 build** | Existing substantial application implementation | Developer to inspect code, schema, auth, deployment, and compare to ZIP before large changes. |
| **P0 build** | End-to-end usable contract → arrival → supplier booking/payable → money ledger → wallet → reports | Demonstrate a working path and manual recovery for every critical failed automation. |
| **P0 build** | Selective impact review and sticky overrides | Admin sees old → new for declared affected items, chooses **zero / arbitrary subset / all**, can leave records inconsistent, with nonblocking attention. |
| **P0 before exposure** | Supplier-link security, access permissions, protected files, ledger/audit correctness | Test actual running app: no cross-booking leaks, no old signed PDF or real cash rewrite, no duplicates on retry. |
| **P1 / UAT** | Supplier-specific new content/ages/extras, PDF layout and wallet presentation | Admin-editable, manual fallback for unknowns. Do not invent commercial facts. |
| DEFERRED | Full catalog sanitation, legal rewriting, e-sign, automated WhatsApp, automated historical migration, complex incident operations | Do not block use of the currently supported initial catalog. |

**Approved launch migration approach:** owner records coming from Trello, Google Sheets and WhatsApp; manual entry of upcoming arrivals, reservations and actual receipts is acceptable. Do not invent historic cash/balances or spend Phase 1 on perfect automated migration.

**Open technical facts:** actual repository/hosting/database, current working features, app financial/security results, UI/PDF rendering and real software tests were not available for package QC. Developer must examine the codebase and return an evidence-based implementation assessment.

**Mandatory read order:** `00_START_HERE_DEVELOPER_HANDOFF.md` → `00_READ_FIRST_CURRENT_AUTHORITIES.md` → `11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md` → `02_Functional_Requirements.md` / `03_Data_Architecture_and_Rules.md` → `05_Acceptance_Scenarios.md`. Read `04_*` current §C for genuine open boundaries; versioned v0.1.38/v0.1.39/v0.1.40 filenames and `History/` are preserved decision provenance, not current checkpoint names.

## v0.1.42 baseline audit and v0.1.43 final wording patch

The Phase 1–6 review recorded 32 unique specification findings (3 critical, 28 important, 1 minor). Corrections and 32 regression specifications are integrated in the current source files; details and final validation outcome are in `15_v0.1.42_Independent_Validation_and_QC_Resolution.md`. Source data is unchanged; real developer-code security, generated PDFs, native money calculations and user acceptance are still **unverified**.
