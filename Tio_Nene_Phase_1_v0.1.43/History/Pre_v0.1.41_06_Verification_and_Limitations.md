> **ARCHIVED VERBATIM v0.1.40 COPY — NOT AN ACTIVE IMPLEMENTATION INSTRUCTION.** The current files at the main ZIP root have precedence. This archive is provided only to preserve the decision/audit trail.

**CURRENT v0.1.40 VERIFICATION:** See `13_v0.1.40_Independent_Verification_and_Limits.md` and the top-level `SHA256SUMS.txt` for independently checked package contents. The v0.1.39/v0.1.38/v0.1.37/v0.1.36 notes below are historical snapshots and their earlier file/count claims do not describe the v0.1.40 package. No app, live security, runtime PDFs or actual financial ledger were tested.

**v0.1.39 present-state verification note:** Original text below describes earlier stages. See `10_v0.1.39_Verification_Report.md` for latest immutable-source checks, Dolphin seeded-source calculations, latest 178 requirements / 167 scenarios (recount to verify), and continued limitation that no app/security/hosting tests were run. Unlike the original v0.1.38 stage, core supplier booking fields and manual upcoming migration policy are now owner approved. Do not treat owner-provided southern Dolphin *pricing* as independent confirmation of supplier pickup coverage.

> **v0.1.38 checkpoint:** Source ZIP/file SHA256, physical hotel schema and unsigned contract DOCX can be checked in this package. No codebase, production SaaS behavior, live security, successful PDF rendering under the target app or supplier commercial accuracy has been established. Refer to `08_v0.1.38_Verification_Report.md` for current tests. Earlier-stage limitations below are historical.

# v0.1.37 independent supplier source integrity and rule reconciliation

The eleven actual standardized XLSX workbooks were imported/read using `artifact_tool`, and the source ZIP checksum and source per-XLSX hashes were validated against the owner supplier manifest. No spreadsheet was written or altered. The base v0.1.36 ZIP was checked and preserved. `Data/Supplier_Integration_QC.md` gives the 52 Tour / 80 Rate / 128 Xcaret eligibility-check findings, eleven-workbook manifest, resolved discrepancies, and still-open facts. The offline QC validates input structure and deterministic calculations, **not** the actual deployed runtime software or supplier rates with external vendors. Full coverage of all provider tour catalogs, future Xcaret season calendars, legal rules and existing codebase was not established. Historical v0.1.36 notes below describe that earlier stage.

# 06 — Verification, coverage and limits

**Checkpoint:** Version 0.1.36 (2026-10-19) · **Status:** VERIFIED FILE PACKAGE; **WORK-IN-PROGRESS BUSINESS SPECIFICATION**.

## Scope and verified changes

- **New in v0.1.36 (DIRECTLY from VERIFIED v0.1.35):** integrated the entire owner-approved pending supplier rules for standard ten-provider **Tours + Supplier Rates** structure, separate Display Names and original supplier names, stable import IDs, approved Baktun/Coco Bongo/Envatours product labels, Miguel Shuttle zone→five USD 1–7-pax per-vehicle one-way tariffs and transfer leg separation, Playa Mía `Cozumel el Cielo` eight-zone-to-two-automatic-MXN-tariff rule with manual-only Cozumel rate, source-date hotel matching and per-booking native currency/cost snapshots/overrides. New `Data/Supplier_Catalog_and_Pricing_Decisions.md` authority annex. Requirements `CAT-014`–`016`, `CON-017`, `RES-023`, `PAY-026`, `TRF-011`–`012`, `FIN-010`; acceptance `SC-101`–`SC-112`. Xcaret's prior 2026 source screenshots and mapping annex kept byte-identical; no unapproved provider XLSX imported. Original v0.1.35 ZIP is unchanged.


- **New in v0.1.35 (DIRECTLY from v0.1.33, NOT from rejected v0.1.34):** Added owner-approved Xcaret 2026 full eight-zone/tour-specific mapping (including staff-adjustable Riviera Maya-labelled fallback prices with **no provisional UI badge**), supplier transportation-inclusive pricing only, season date rules, ordinary weekly tour operating days plus seven Sunday-specific overrides, hard seller validation and **View operating days**, historical planned package/cost snapshot, optional local reservation overrides and non-blocking **mid-December following-year calendar reminder**. Added `CAT-011`–`CAT-013`, `CON-016`, `RES-022`, `PAY-025`, `OPS-012`–`OPS-013`, `SC-093`–`SC-100`, Xcaret annex MD and **both original calendar screenshots**. The final Xcaret/other provider tariff XLSX files are deliberately **NOT present**, still being amended by owner; no supplier cost import claimed. No remaining v0.1.33 decisions removed.


- **New in v0.1.33:** Approved nonblocking sale finalization when supplier cost for custom tours/yachts/other exceptions is unknown, while preserving unknown rather than fake $0. Added `CON-015`, `PAY-024`, `OPS-011`, `FIN-009` and `SC-090`–`SC-092`; revised `OQ-10`, `OQ-12`, `CURRENT_STATUS`, architecture and README. Final provider-specific tariff lists still require verified import data.

- **Previously v0.1.32:** Clarified Admin's standard MXN→USD exchange-rate changes apply **only to future bookings** (historical original rate/estimated USD snapshots remain unchanged). Added `PAY-023`, `SC-087`, narrowed `OQ-23`. Confirmed **arrival date** determines period attribution for operational profit reporting (all associated tours/costs included even if tours happen next month), distinct from actual payment/receipt date cash flows. Added `FIN-008`, `SC-088`–`SC-089`, narrowed `OQ-24`; no claim to legal/tax or accounting-standard recognition rules.

- **Previously v0.1.31:** Confirmed the ordinary supplier FX lifecycle: preserve native MXN price, snapshot standard-rate USD estimate at booking, capture known real USD paid with manually entered supplier payment, distinguish estimated vs actual and avoid cash-expense double counting. New `PAY-022`, `FIN-007`, `SC-085`–`SC-086`, revised `OQ-23`; partial-payment FX, credits/refunds, timing/tax questions remain open. Corrected an out-of-date Baktun per-person-pricing line in the decision register and refreshed stale document-version headers.

- **New in v0.1.30:** Client sale currency confirmed USD, with occasionally BRL-tendered deposits credited in their staff-entered USD equivalent. Added `REC-008`, `SC-084`, revised architecture, confirmed/open notes in decision register and `OQ-23`. Retained original BRL conversion-detail and supplier FX accounting as explicitly unresolved.

- **Previously v0.1.29:** Owner approves two **independent operational airport transfer reservations/payables** for round-trip services, despite usually arranging both through one supplier WhatsApp message. The client-facing contract's date-ordered itinerary includes explicitly labeled arrival/departure **with or without transfer** entries around dated tours, plus flight number/time for directions purchased. A direction without transfer produces no booking/payable. Added `CON-014`, `TRF-009`–`010` and `SC-081`–`083`; updated `TRF-005`, `TRF-008`, `OQ-09`, `CURRENT_STATUS.md`. Remaining tariff/return-hotel/package allocation questions are open.

- **Previously v0.1.28:** Owner confirms normal automatic Ready when all REQUIRED bookings (including mandatory ancillary services) are Confirmed and wallet is prepared; no missing ancillary masked by absence of its reservation record. Airport transfers capture relevant flight number and scheduled time in contract; supplier handling may be one informal WhatsApp conversation for both directions, or separate. Added `TRF-007`–`008` and `SC-077`–`080`; revised `OPS-005`, `TRF-005`, `OQ-09`, `OQ-26`; actual round-trip operational record grouping remains open.

- **Previously v0.1.27:** Owner approved independent Admin override of the *displayed* Ready/Not Ready badge (both directions), without making the badge a process gate or removing unresolved provider/ancillary booking tasks. Admin may also manually set individual provider booking status Confirmed, without a provider form and without auto-checking Staff Reviewed. Revised `OPS-005`, `OPS-009`, `OQ-26` and the architecture; added `OPS-010`, `RES-021` and `SC-074`–`SC-076`. Default positive readiness criteria remain open.

- **Previously v0.1.26:** Owner confirmed structured, configurable *included ancillary booking requirement* must surface unfinished work before the manual subordinate reservation is created. Added `CAT-010`, `OPS-009`, revised `RES-011`, `SC-072`–`SC-073`, and partially narrowed `OQ-14`/`OQ-26`. Does not auto-create transport, assume a supplier, or imply every catalog inclusion is a booking dependency. Normal operational readiness still needs final approval.

- **New in v0.1.25:** Confirmed wallet **ready to send** contributes to operational readiness, while actually sending / Mark as Sent is a **separate**, nonblocking communication step. Added `OPS-008`, `SC-071`, narrowed `OQ-26` and refreshed CURRENT_STATUS and overview. Exact wallet-completeness and other readiness criteria remain open; no invented assumption that a mere draft wallet is ready.


- **New in v0.1.24:** Unpaid/overdue client balance is **explicitly NOT a blocker** to operational Ready; keep separate financial warning, test `SC-070`, narrow readiness `OQ-26`. Hotel-search/free-type accommodation entry was already confirmed (`CON-003`, `SC-005`) and was checked/reaffirmed without introducing a redundant new rule. Added `OPS-007` and kept actual operational readiness thresholds unresolved.


- **New in v0.1.23:** Confirmed simultaneous arrival-level **Ready / Not Ready** indicator **and** separately prioritized **Action Required** detail, with click-through from arrival to underlying recorded issues; no forced calendar implementation. Added `OPS-005`, `OPS-006`, `SC-068`–`SC-069`; narrowed `OQ-26` without inventing exact readiness thresholds. Corrected two stale architecture phrases about already approved provider-link auto-confirmation and `DEC-021` over-allocation credit-release prompt.

- 21 sequentially numbered confirmed architectural decisions (`DEC-001`–`DEC-021`), plus separately confirmed per-tour attendance, hotel-date pickup and overall discount requirements; acceptance cases through `SC-059`.
- Confirmed seller **actual deposit receipt** entry within Finalize Sale, optional when no money received; forgotten deposits can be recorded later from contract/arrival or quick action without changing contract. Explicitly separate agreed deposit versus actual receipt and keep broader seller financial access unresolved (`REC-005`, `REC-006`, `SC-060`–`SC-061`, `OQ-27`–`OQ-28`). Acceptance cases now through `SC-061`.
- `DEC-021` / `PAY-020`: When supplier allocated payment exceeds revised payable cost, offer operator-directed release of the excess to the same supplier's unallocated credit; no automatic release, new cash flow or refund.
- `SC-054` and `SC-055`: Verify excess-payment warning and controlled release without double-counting.
- Updated `OQ-19`/`OQ-20` to keep other exceptional cases open; changed `CURRENT_STATUS` and decision register discussion priorities in response to user's explicit request to stop low-value micro-decisions.
- Integrity checks validate requirement/decision/scenario IDs and ZIP member hashes; they do not validate implementation against a running application.
- Added `CON-012` and `RES-019`: per-tour adults and children are seller-entered, printed on every client contract tour, and used by each operational booking; `WAL-002` made explicit. Added `SC-056` to cover unequal and identical tour attendance; narrowed `OQ-04`, `OQ-06`, and `OQ-31` without inventing age-band rules.


- Added `RES-020`, `SC-057` and partially resolved `OQ-07`: default each tour to hotel dated for that service, allow independent pickup override, do not assume check-in/out-day boundaries or invent pickup address/zone.
- Added `CON-013`, `FIN-006` and `SC-058`–`SC-059`: support global percentage OR fixed contract discount, proportional allocation to private original tour selling prices, internal original/net value preservation, reconciliation of ordinary discounted contract sales, and provider-level margin using **net** attributed revenue. Narrowed `FIN-005` and `OQ-22` rather than falsely resolving remaining bundle/tax/FX/refund issues.

- Added approved **optional free-text notes** for relevant payments, payables and reservations, without extra administrative systems (`NOTE-001`, `SC-062`). This is not a new numbered architectural decision.
- Added **client balance due-date rule**: default payment due before arrival (overdue on arrival day), editable deadline exception without contract revision, derived overdue warnings and paid status (`REC-007`, `SC-063`–`SC-064`, partially resolved `OQ-27`). These are confirmed functional clarifications, not new DEC identifiers. Acceptance cases now run through `SC-064`.

- Added `CAT-009`, `PAY-021`, `TRF-006` and `SC-065`–`SC-067` in v0.1.21: per-tour cost model axes, fixed-capacity transfer price (1–7 travelers), manual boat-specific yacht quote, and Baktun's three separate Chichén Itzá products. In v0.1.22, `OQ-10` and `SC-067` explicitly confirm Baktun's **per-adult/per-child, zone-independent** cost basis, with verified variant-specific rates still required. The example $80/$60 figures remain test fixtures, not source data. Complete provider tariff-model mapping is postponed to a dedicated data pass.

## What verification does NOT establish

1. These files condense the owner conversation, not a verbatim archive; preserve/export the chat separately.
2. The overall spec has **not** received final developer/owner sign-off. Unresolved questions are not authorization to invent business rules.
3. No running app, repository/schema, operational payment records, live booking links, exact FX/tax implementation or legal signing process were examined. The original supplier XLSX files and Xcaret 2026 source images have been integrated and validated as DATA since v0.1.37; however the actual software/database import and live end-to-end calculations have not been executed. The user-confirmed 1,125-row hotel master and sanitized unsigned DOCX are now included in v0.1.38. Source-file verification does not establish actual commercial eligibility or production correctness.
4. All customer names and monetary examples are illustrative.

## Release check

1. Read `README.md`, `CURRENT_STATUS.md`, and the decision register.
2. Validate unique requirement/scenario/decision IDs, decision sequence and references.
3. Extract the ZIP and run `sha256sum -c SHA256SUMS.txt` from within its folder.
4. Implementation requires developer to inspect the real codebase, security environment and curated reference datasets.
