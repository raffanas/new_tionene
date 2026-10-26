> **ARCHIVED VERBATIM v0.1.40 COPY — NOT AN ACTIVE IMPLEMENTATION INSTRUCTION.** The current files at the main ZIP root have precedence. This archive is provided only to preserve the decision/audit trail.

> **CURRENT CHECKPOINT:** v0.1.40 — read [`00_START_HERE_DEVELOPER_HANDOFF.md`](00_START_HERE_DEVELOPER_HANDOFF.md), [`00_READ_FIRST_CURRENT_AUTHORITIES.md`](00_READ_FIRST_CURRENT_AUTHORITIES.md) and [`11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md`](11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md) first. Original v0.1.37 10+1 supplier XLSXs and 2026 JPEGs preserved; new owner-confirmed 1,125-hotel master, unsigned contract DOCX and approved v0.1.38 decisions added. **This remains WIP, not final developer authorization.** Older release notes below are historical.

# Tío Nenê — Phase 1 Post-Sale System Specification

**Latest v0.1.37 supplier-data integration:** All **ten final standardized provider XLSX files** and one **central Shared Reference XLSX** are now included unchanged under `Data/Supplier_Source_Workbooks/`: 52 stable Tour IDs / 80 Rate IDs, original 27 Xcaret supplier rates, 2026 season and zone maps, five source pricing bases including Equipment. Older v0.1.36 remarks that supplier XLSX inputs were *not yet supplied* describe that earlier release only; they are NOT the current data state. New canonical data contract: [`Data/Supplier_Import_Data_Dictionary.md`](Data/Supplier_Import_Data_Dictionary.md). Independent source/constraint QC: [`Data/Supplier_Integration_QC.md`](Data/Supplier_Integration_QC.md). Final source files are not an exhaustive catalog, and missing future calendars or auxiliary charges are not filled in.


**Version:** `0.1.40` · **Captured:** 2026-10-21 · **Status:** WORK IN PROGRESS — decision baseline, **not** final implementation sign-off  
**Latest numbered decision:** Decision 21 — when allocated supplier payment exceeds a lowered payable cost, offer an operator-controlled release of the excess into that supplier's available credit; never release automatically or imply a cash refund (`DEC-021`, `PAY-020`).
**Earlier clarification:** Seller can apply an **overall percentage or fixed-money contract discount** after entering private line sale prices; system allocates it proportionally to sold lines for truthful provider-level revenue/margin (`CON-013`, `FIN-006`, `SC-058`–`SC-059`). The hotel-date match/override (`RES-020`) and per-tour adult/child/infant counts (`CON-012`, updated v0.1.40) remain in scope. **Current developer task:** inspect existing app and deliver a usable manual-first end-to-end slice; do not reopen historical edge cases.

**Checkpoint integrity:** Run `sha256sum -c SHA256SUMS.txt` inside this folder after extracting the ZIP. See `06_Verification_and_Limitations.md`.

**HISTORICAL v0.1.36 release note (NOT current data status):** Integrated owner-approved **10-provider standardized two-sheet supplier catalog schema**; searchable client `Display Name` separate from original supplier product/tariff name; approved Baktun, Coco Bongo and Envatours display names; Miguel Shuttle's **one search product / five per-vehicle one-way USD supplier rates** with all eight agency zone defaults and separate arrival/departure bookings; Playa Mía's **one `Cozumel el Cielo` product / three MXN adult-child rate variants**, with eight-zone automatic Cancún/Playa del Carmen map and **audited manual-only Cozumel** selection; date-matched hotel source, local override/snapshot and incomplete-price protections (`CAT-014`–`016`, `CON-017`, `RES-023`, `PAY-026`, `TRF-011`–`012`, `FIN-010`, `SC-101`–`SC-112`). Exact approval and import boundaries: `Data/Supplier_Catalog_and_Pricing_Decisions.md`. **No final supplier XLSX was imported or packed.** Existing Xcaret 2026 rules and screenshots remain unchanged.

**Historical note — what v0.1.35 added:** That release is a **direct update to the approved v0.1.33 specification**, NOT to the withdrawn v0.1.34 data bundle. Added Xcaret 2026 hotel-zone package mapping defaults with **no provisional warning**, high/regular season rules, weekday plus dated Sunday operating calendars with seller closure validation and **View operating days**, individual booking price/package/season overrides, historical package/cost snapshots and a non-blocking **mid-December Admin reminder** for next year's Xcaret calendar. Two owner-supplied calendar images and a complete mapping appendix are in `Data/`. **That earlier v0.1.35 release intentionally did not contain the supplier XLSX files; they are now included in v0.1.37.**


**New in v0.1.33:** Seller may finalize a contract when a provider quote is missing, including free-text and boat-priced yacht tours. Create the arrival/reservation and an **unknown-cost** planned payable placeholder; raise **Cost Required** and flag associated profit as incomplete, never assume a zero cost or block downstream creation (`CON-015`, `PAY-024`, `OPS-011`, `FIN-009`, `SC-090`–`092`).

**Previously v0.1.32:** Centrally editable standard MXN→USD rate is explicitly **future-only**, with historical rate/cost snapshots never retroactively repriced (`PAY-023`, `SC-087`). All week/month/year/custom **operational profit** filters use **customer ARRIVAL date** as the cohort. An October 31 arrival is October's business profit even if tours take place in November; cash receipt/provider payment reports are separate actual-date measures (`FIN-008`, `SC-088`–`089`, narrowed `OQ-24`). Detailed statutory revenue recognition and partial realized margin remain open.

**Previously v0.1.31:** Playa Mía/other MXN supplier charge stays in MXN; Tío Nenê's editable standard rate provides a **saved provisional USD cost estimate**, while staff record the **real USD cost at payment time** as a separate cash-settlement measure, never rewriting provider charge or double-counting (`PAY-022`, `FIN-007`, `SC-085`–`SC-086`, narrowed `OQ-23`). More complicated FX allocation/tax rules remain pending. The data packet still requires supplier tariff verification.

**New in v0.1.30:** Client **contract sale prices, receivables and credited receipts are USD**. Occasional BRL-tendered deposits are entered as their **explicit USD-equivalent client credit**, with optional BRL note/tender details and no fictional double receipt or assumed currency rate (`REC-008`, `SC-084`, narrowed `OQ-23`). Supplier original-currency FX accounting remains open.

**Previously v0.1.29:** Two distinct operational booking records and supplier payable rows for purchased inbound/outbound airport transfer legs; one informal supplier WhatsApp conversation may confirm both. Client-facing contracts have one chronological itinerary listing dated arrival/departure **with or without transfer**, flight number/time for purchased transfer directions, and dated tours in between; without-transfer directions create no operational booking (`CON-014`, `TRF-009`–`010`, `SC-081`–`083`). Remaining >7/cross-hotel/tariff/bundled sell-value detail stays open under `OQ-09`.

**Previously v0.1.28:** Normal automatically calculated **Ready** requires all required bookings Confirmed, no missing included additional booking, and a current wallet prepared to send. Admin override remains display-only. Purchased airport transfers require relevant flight number/time on contract; arrival/return may be coordinated with one informal WhatsApp confirmation or separately, with no mandatory code/form. The round-trip leg model is resolved in v0.1.29 (`OPS-005`, `TRF-007`–`009`, `SC-077`–`081`, `OQ-09`, `OQ-26`).

**Previously v0.1.27:** Arrival readiness is an **informational badge, not a workflow gate**. Admin may override the displayed Ready/Not Ready in either direction while the underlying calculated condition and all actual outstanding supplier/ancillary Action Required tasks remain visible. Admin may also manually set an individual supplier booking to Confirmed without link use; Staff Reviewed remains separate. This does not automatically mean supplier acceptance (`OPS-010`, `RES-021`, `SC-074`–`SC-076`). The exact other *calculated* readiness thresholds remain OPEN (`OQ-26`).

**Previously v0.1.26:** Included-service requirement safeguard: admin-configured **additional booking required** on a sold offering (e.g. yacht with marina transfer) automatically generates an Action Required item **even before the secondary reservation exists**. Staff manually create/link the actual provider booking; missing required service blocks operational Ready while its confirmation stays a separate task. This is not an instruction to auto-create reservations or add a client charge (`CAT-010`, `RES-011`, `OPS-009`, `SC-072`, `SC-073`, partial `OQ-14` and `OQ-26`). Updated stale headline version labels without changing historic decisions.

**Previously v0.1.25:** Owner confirmed **the client digital wallet being current and ready to send is relevant to operational Ready, but the PDF does NOT have to have been sent**. Delivery/Mark as Sent is tracked separately, so the Ready badge can coexist with a Send Needed indicator (`OPS-008`, `SC-071`, narrowed `OQ-26`). Other operational readiness criteria remain open.

**Previously v0.1.24:** The owner confirmed **client payment status is NOT an operational readiness gate**; show outstanding/overdue money independently from arrival Ready/Not Ready (`OPS-007`, `SC-070`). The hotel-lookup/free-type fallback was reconfirmed to have already been established in the earliest discussion and is already fully documented (`CON-003`, `SC-005`); it is **not** a newly discovered gap. Remaining operational readiness criteria stay open (`OQ-26`).

**Previously v0.1.23:** Owner explicitly requires **both** a Ready / Not Ready marker beside each arrival and a detailed prioritized Action Required list that explains unfinished work. These complementary views are confirmed (`OPS-005`, `OPS-006`, `SC-068`–`SC-069`), but the exact readiness rules remain open (`OQ-26`); do not force a calendar design.

**Previously v0.1.22:** Baktun's three Chichén Itzá variants are **per-adult/per-child**, not fixed per booking, and **not zone-priced**. $80/adult and $60/child are **illustrative only**, not verified rates. Pricing models for other catalog services still require a dedicated later tariff-mapping audit. See `CAT-009`, `PAY-021`, `OQ-10`, `SC-067`. Prior v0.1.21 approval: provider cost bases differ by service; flat airport transfer fee covers up to seven and yachts require a manual quote.

## Purpose

This package turns the owner's post-sale operational explanation and architectural decisions into a controlled, AI-agent-readable specification. It is intended to let a developer use Cursor, Codex, Claude, ChatGPT, or other tools **without silently guessing business rules**. Preserve owner flexibility, original data, and independent records.

This is an **incremental planning checkpoint**. It documents confirmed requirements faithfully and explicitly flags gaps. It does not purport to be the final implementation-ready plan.

## Read these files in order

| File | Role | What it answers |
|---|---|---|
| [`01_Project_Overview_and_Scope.md`](01_Project_Overview_and_Scope.md) | Orientation | Why Phase 1 exists, where it starts/ends, main workflows, boundaries. |
| [`04_Decisions_and_Open_Questions.md`](04_Decisions_and_Open_Questions.md) | **Decision authority** | What is confirmed, why, what remains unresolved, and safe instructions. |
| [`02_Functional_Requirements.md`](02_Functional_Requirements.md) | Functional contract | What every module must do, with stable IDs and implementation status. |
| [`03_Data_Architecture_and_Rules.md`](03_Data_Architecture_and_Rules.md) | System invariants | Record ownership, relationships, snapshots, selective propagation and safety rules. |
| [`05_Acceptance_Scenarios.md`](05_Acceptance_Scenarios.md) | Verification | Real operational tests and expected results. |
| [`Data/README.md`](Data/README.md) | Data handoff | Imported source workbooks, reference tables, and validation/read order. |
| [`06_Verification_and_Limitations.md`](06_Verification_and_Limitations.md) | Quality checkpoint | What was checked, remaining limits, and why this is a WIP rather than implementation sign-off. |
| [`CURRENT_STATUS.md`](CURRENT_STATUS.md) | Continuation pointer | Most recent confirmed decision, next checkpoint, unresolved scope and status. |

## Status vocabulary (mandatory)

- **CONFIRMED:** Owner explicitly accepted this requirement or decision; build in agreed scope.
- **PROPOSED / DESIGN GUIDANCE:** Recommended implementation, but exact design has **not** been approved. Do not imply it is a business requirement.
- **OPEN — IMPLEMENTATION BLOCKER:** Do not invent a choice; obtain a decision before implementing the affected behavior. Unrelated work may proceed.
- **OPEN — NON-BLOCKING:** Implement only the clearly confirmed baseline, and preserve the listed extension points.
- **DEFERRED:** Deliberately not a standalone current feature; preserve underlying required functionality where stated.
- **EXAMPLE ONLY:** Illustrative names, dates, dollar amounts, field labels or layouts; not tariff data, production records or final UI copy.

An unresolved extension is not a license to implement it, nor evidence it belongs to a particular later phase. The specification must distinguish **what to do now**, **what not to assume**, and **what remains possible**.

## Design non-negotiables (quick scan)

1. The seller explicitly clicks **Finalize Sale** when they judge the deal agreed. A draft, PDF preview/export or pending client signature does **not** trigger operations. This creates **one operational arrival** and linked sold-service reservations; finalized contracts may subsequently be revised.
2. Revisions retain earlier contract versions/PDFs, keep the same arrival and reconcile downstream **non-destructively**; protected confirmed/paid/manually amended records require review. A seller may upload a returned signed copy to its corresponding contract version; this does not finalize the sale or alter bookings.
3. Contract, operational reservation, provider confirmation data, provider payable, and client wallet are **different linked concerns**. Records remain independently editable. Changes do not silently propagate; staff may selectively synchronize relevant downstream records.
4. Supplier links are available for every tour/service reservation but **optional to use**; staff can record WhatsApp confirmations directly. Pickup/code fields are **not universally required**.
5. Individual operational services may be manually added without changing the contract (e.g., yacht marina transfer), and should create corresponding provider financial entries.
6. Each contract tour explicitly shows **its own adult and child attendance counts** even if identical on every line. The seller's **per-tour selling price** is private/internal and varies per sale; it must **not be printed as a tour-line price on the client contract**. A seller may apply an overall **percentage or fixed-money discount**; the system automatically allocates it proportionally to internal line prices, preserving original and net amounts for reporting. The client sees the **discounted contract total**, not the private line-level allocation (`CON-013`, `FIN-006`).
7. Supplier ledger entries are **pre-populated planned costs** on finalization, then separately editable; one-off payees and manually entered costs are allowed.
8. The internal client wallet is independently editable and exportable as a PDF. Unconfirmed services are labeled; incomplete wallet export warns **without blocking**. **Only the latest wallet** appears in routine admin UI, with lightweight **Wallet Update Needed** and manual **Mark as Sent**; no visible PDF version history. Guest website login is **not decided** (`DEC-016`).
9. One canonical hotel zone is a default. Provider-specific tariff-zone and price overrides happen per **reservation**, without modifying the master hotel mapping.
10. The initial tour/provider/hotel spreadsheets are **seed data**, not a complete or immutable system. Catalog maintenance must be possible through the admin web app.
11. The only Phase 1 roles currently specified are **Seller** and **Admin**. Sellers can access and revise each other's contracts; detailed non-contract permissions are still open.
12. Provider-link submission automatically confirms the targeted booking but never ticks its separate staff-review status. **Neither confirmation nor review is a prerequisite for downstream records**; pending bookings retain planned costs and can appear in wallet PDFs with honest pending labels and warnings (`DEC-012`).
13. Booking statuses are **Not Requested / Awaiting Confirmation / Confirmed / Unable to Confirm / Cancelled**. Keep **Staff Reviewed** separate; do not infer unauthorized transitions, a Completed status or financial cancellation effects (`DEC-013`, `OQ-13`).
14. After staff actually contact a provider, **Mark as Requested** explicitly changes that booking **Not Requested → Awaiting Confirmation**. Copying/viewing/generating a supplier link by itself does not change status; this action is not a downstream processing gate (`DEC-014`).

15. When staff manually mark **Unable to Confirm**, the booking remains visible in the arrival and Action Required until resolved. Staff can edit/delete an individual operational booking; deleting it never automatically amends a contract or master catalog, never implies external supplier cancellation, and never erases an actual paid provider expense. Staff choose whether to remove an unpaid planned cost or keep it as independent expense (`DEC-015`).

16. Wallet updates after a previously sent PDF are exposed as a simple **Wallet Update Needed** indicator. Staff manually create/share latest PDF, then **Mark as Sent**; the ordinary admin UI must not list old wallet PDF versions (`DEC-016`).

17. Actual provider **cash or bank transfers are separate payment transactions**, manually entered and allocated to one or more supplier payable rows. Support partial payments and never double count cash transfers as new expenses. **Every provider payable row explicitly shows cost / paid / remaining**, rather than reducing the recorded reservation cost on payment (`DEC-017`, `PAY-013`).
18. Provider payments may be booked **without any initial reservation allocation**; their unapplied value remains supplier-specific credit and may later settle even **not-yet-performed tour payables**. The same original outgoing payment is reused on allocation and never booked twice. Display unapplied credit separately from individual unpaid rows and from conceptual net provider account balance (`DEC-018`).

19. If an existing supplier payment allocation is **released**, it becomes available credit with that supplier again, **without cash movement**. A supplier **refund received** is a distinct incoming cash/bank event, not customer revenue; neither action guesses cancellation penalties (`DEC-019`).
20. **Every operational reservation gets its own automatically generated, permanently unique, searchable number**, whether created at finalization or manually. Preserve it across edits; use a different number for a new replacement booking. It is not the provider confirmation code (`RES-018`).

21. On supplier cancellation, staff may directly adjust the provider payable **Reservation cost** to $0, a partial fee or full charge. Preserve actual supplier payments, release-to-credit and real refunds as independent actions; offer, without automatically executing, release of excess allocations into that supplier's available credit (`DEC-020`–`DEC-021`, `PAY-019`–`PAY-020`).

**Lightweight notes:** Include a short optional free-text note on relevant client receipts, supplier payments, individual payable adjustments and reservations, without requiring notes or adding complex note management (`NOTE-001`, `SC-062`).

**Client balance deadline:** Outstanding client money defaults to payable *before* client arrival, becoming **overdue on the arrival date** if still outstanding. Allow staff to edit the effective payment deadline on that individual contract/arrival without revising the contract or supplier records; due status recalculates (`REC-007`, `SC-063`–`SC-064`).

**Client deposit entry:** Seller may log an **actually received** deposit inside **Finalize Sale** and permitted staff may later record one missed at finalization through the linked arrival/contract or quick payment action. Contractual deposit due and actual cash received are separate; a late receipt does not revise the contract or create another arrival. (`REC-005`, `REC-006`, `SC-060`–`SC-061`.)

## Implementation environment not yet supplied

The actual app repository, existing database/schema, auth controls, deployment architecture and code conventions have not been supplied here. The developer/AI agent **must inspect the real application** before translating this conceptual model into tables, routes, migrations or libraries. See `OQ-40`.

## Xcaret 2026 pricing logic and operating-calendar annex — owner approved

See `Data/Xcaret_2026_Rules_And_Zone_Mapping.md` and two original owner-supplied JPEGs for the complete **eight-zone → exact existing supplier region variant defaults**, **2026 regular/high-season date bands**, normal weekly opening days and **special Sunday exceptions**. Seller gets simple tour/date/adult/child input with normal automatic tariff selection and no distracting 'provisional' marker; staff/admin may locally override one booking's variant/season/cost. Pickup information is set later at reservation, **not** used to select supplier tariff. Known closed service dates block seller add/reschedule and offer **View operating days**. Beginning mid-December Admin dashboard reminds user to prepare next year's seasonal and operating schedules without copying one-off 2026 dates.

**Historical v0.1.35/v0.1.36 handoff boundary (superseded in v0.1.37):** Xcaret's corrected 27-row spreadsheet and provider workbooks were not included at that time. They were being independently amended at that time; **v0.1.37 now attaches the final approved source workbooks**, and these agreed logic rules do not purport to contain/import actual production costs. **This updated release derives from v0.1.33, not cancelled v0.1.34.**


## Source-data warning

The owner's hotel/zone and ten standardized provider-organized tour/price spreadsheets, including Xcaret's amended 27-row data, are being curated **separately** and have **not** been supplied as part of this ZIP; 2026 Xcaret calendar evidence and agreed mapping rules **are included**. Do not fabricate tour lists, tariffs, zone assignments or providers from illustrative scenarios. See `Data/README.md`.

## Authority, conflicts, and coding-agent handoff

- For a requirement's **approved status**, consult `04_Decisions_and_Open_Questions.md` first; `02_...` describes how it manifests functionally, and `03_...` gives invariants.
- If files conflict, **do not select a convenient interpretation**. Log the conflict and request a decision. This initial package is meant to be internally consistent, but it is a work-in-progress.
- A **PROPOSED conceptual data model** is not authorization to prescribe a specific ORM, table name, framework, UI layout, payment gateway, notification channel or authentication provider.
- Confirmed behaviors should be covered by acceptance scenarios before being marked implemented; unresolved scenarios should remain pending, not treated as passing tests.
- Never change a CONFIRMED requirement silently during development. Propose the change, record the owner's approval and update impacted files.

## Update protocol

**After each new approved architectural decision:** immediately update its `DEC-...` entry or add a new decision; change directly affected requirement statuses/invariants; add or revise acceptance coverage when relevant. **Every 3–5 decisions, or when a change cuts across modules:** do a full consistency pass on all files and publish an incremented package version. **Before developer handoff:** finish all implementation-blocking questions, run an adversarial completeness review, then issue an explicitly approved baseline.

Git is recommended as the developer's long-term version history. Keep historical releases available; avoid replacing old baselines without traceability.
