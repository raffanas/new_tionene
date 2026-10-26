> **CURRENT CHECKPOINT:** v0.1.43 — read [`00_START_HERE_DEVELOPER_HANDOFF.md`](00_START_HERE_DEVELOPER_HANDOFF.md), [`00_READ_FIRST_CURRENT_AUTHORITIES.md`](00_READ_FIRST_CURRENT_AUTHORITIES.md) and [`11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md`](11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md) first. All 11 original supplier/reference XLSXs and two 2026 Xcaret JPEGs preserved; hotel master, unsigned contract DOCX and Dolphin seed retained. **This remains a working developer handoff specification, not owner-approved production go-live.** Historical release notes have been separated under `History/`.

# Tío Nenê — Phase 1 Post-Sale System Specification

**Initial supplier-source data (introduced v0.1.37, still current):** All **ten final standardized provider XLSX files** and one **central Shared Reference XLSX** are now included unchanged under `Data/Supplier_Source_Workbooks/`: 52 stable Tour IDs / 80 Rate IDs, original 27 Xcaret supplier rates, 2026 season and zone maps, five source pricing bases including Equipment. Older v0.1.36 remarks that supplier XLSX inputs were *not yet supplied* describe that earlier release only; they are NOT the current data state. New canonical data contract: [`Data/Supplier_Import_Data_Dictionary.md`](Data/Supplier_Import_Data_Dictionary.md). Independent source/constraint QC: [`Data/Supplier_Integration_QC.md`](Data/Supplier_Integration_QC.md). Final source files are not an exhaustive catalog, and missing future calendars or auxiliary charges are not filled in.


**Version:** `0.1.43` · **Captured:** 2026-10-21 · **Status:** CLEANED WORKING DEVELOPER HANDOFF — **not** running-app or production sign-off  
**Latest numbered decision:** Decision 21 — when allocated supplier payment exceeds a lowered payable cost, offer an operator-controlled release of the excess into that supplier's available credit; never release automatically or imply a cash refund (`DEC-021`, `PAY-020`).
**Earlier clarification:** Seller can apply an **overall percentage or fixed-money contract discount** after entering private line sale prices; system allocates it proportionally to sold lines for truthful provider-level revenue/margin (`CON-013`, `FIN-006`, `SC-058`–`SC-059`). The hotel-date match/override (`RES-020`) and per-tour adult/child/infant counts (`CON-012`, updated v0.1.40) remain in scope. **Current developer task (v0.1.43):** inspect existing app and deliver a usable manual-first end-to-end slice; do not reopen historical edge cases.

**Checkpoint integrity:** Run `sha256sum -c SHA256SUMS.txt` inside this folder after extracting the ZIP. See `06_Verification_and_Limitations.md` and `16_v0.1.43_Final_Consistency_Patch_and_Verification.md`.

## Purpose

This package turns the owner's post-sale operational explanation and architectural decisions into a controlled, AI-agent-readable specification. It is intended to let a developer use Cursor, Codex, Claude, ChatGPT, or other tools **without silently guessing business rules**. Preserve owner flexibility, original data, and independent records.

This is a consolidated **developer implementation specification**, not proof of a completed or production-ready application. A substantial app already exists; developer must inspect it, implement gaps, and demonstrate end-to-end UAT.

## Read these files in order (current)

1. [`00_START_HERE_DEVELOPER_HANDOFF.md`](00_START_HERE_DEVELOPER_HANDOFF.md) — first developer action and first working demonstration.
2. [`00_READ_FIRST_CURRENT_AUTHORITIES.md`](00_READ_FIRST_CURRENT_AUTHORITIES.md) — source precedence and which files are live.
3. [`11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md`](11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md) — STILL CURRENT core manual-first/selective-impact authority; historical version label is its creation checkpoint, not an obsolete rule.
4. [`02_Functional_Requirements.md`](02_Functional_Requirements.md), [`03_Data_Architecture_and_Rules.md`](03_Data_Architecture_and_Rules.md), [`05_Acceptance_Scenarios.md`](05_Acceptance_Scenarios.md) — active functional and test requirements.
5. [`04_Decisions_and_Open_Questions.md`](04_Decisions_and_Open_Questions.md) — retained DEC-001–021 and **current** open boundaries (§C); old OQ registry now inside `History/` only.
6. [`Data/README.md`](Data/README.md) and actual XLSX/JPEG/DOCX source files; [`CURRENT_STATUS.md`](CURRENT_STATUS.md) and [`06_Verification_and_Limitations.md`](06_Verification_and_Limitations.md) for live status and QC.

**Historical version-numbered reports and `History/` are preserved archives, NOT missing updates.**

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
2. Revisions retain earlier contract versions/PDFs, keep the same arrival without forced downstream reconciliation. **Admin** sees an impact preview and chooses none, any subset or all; protected/manual/paid values remain unchanged unless explicitly selected, with permanent audit. A seller may upload a returned signed copy to its corresponding contract version; this does not finalize the sale or alter bookings.
3. Contract, operational reservation, provider confirmation data, provider payable, and client wallet are **different linked concerns**. Records remain independently editable. Changes do not silently propagate; Admin may selectively synchronize relevant downstream records.
4. Supplier links are available for every tour/service reservation but **optional to use**; Admin can record WhatsApp confirmations directly. Pickup/code fields are **not universally required**.
5. Individual operational services may be manually added without changing the contract (e.g., yacht marina transfer), and should create corresponding provider financial entries.
6. Each contract tour explicitly shows **its own adult, child and infant attendance counts** even if identical on every line. The seller's **per-tour selling price** is private/internal and varies per sale; it must **not be printed as a tour-line price on the client contract**. A seller may apply an overall **percentage or fixed-money discount**; the system automatically allocates it proportionally to internal line prices, preserving original and net amounts for reporting. The client sees the **discounted contract total**, not the private line-level allocation (`CON-013`, `FIN-006`).
7. Supplier ledger entries are **pre-populated planned costs** on finalization, then separately editable; one-off payees and manually entered costs are allowed.
8. The internal client wallet is independently editable and exportable as a PDF. Unconfirmed services are labeled; incomplete wallet export warns **without blocking**. **Only the latest wallet** appears in routine admin UI, with lightweight **Wallet Update Needed** and manual **Mark as Sent**; no visible PDF version history. Guest website login is **not decided** (`DEC-016`).
9. One canonical hotel zone is a default. Provider-specific tariff-zone and price overrides happen per **reservation**, without modifying the master hotel mapping.
10. The initial tour/provider/hotel spreadsheets are **seed data**, not a complete or immutable system. Catalog maintenance must be possible through the admin web app.
11. The two Phase 1 staff roles are **Seller** and **Admin**. Sellers can access/revise each other's contracts and add/view customer receipts (including repeated installments); **only Admin** corrects/reverses/refunds receipts and manages supplier reservations, costs, ledger and catalog. Supplier URL access is separately scoped to one specific reservation.
12. An **explicit supplier Confirm Booking action** through a valid provider-scoped link confirms only the targeted booking; details-only submission neither confirms the booking nor sets its separate Staff Reviewed indicator. **Neither confirmation nor review is a prerequisite for downstream records**; pending bookings retain planned costs and can appear in wallet PDFs with honest pending labels and warnings (`DEC-012`).
13. Booking statuses are **Not Requested / Awaiting Confirmation / Confirmed / Unable to Confirm / Cancelled**. Keep **Staff Reviewed** separate; do not infer unauthorized transitions, a Completed status or financial cancellation effects (`DEC-013`, `OQ-13`).
14. After Admin actually contacts a provider, **Mark as Requested** explicitly changes that booking **Not Requested → Awaiting Confirmation**. Copying/viewing/generating a supplier link by itself does not change status; this action is not a downstream processing gate (`DEC-014`).

15. When Admin manually marks **Unable to Confirm**, the booking remains visible in the arrival and Action Required until resolved. Admin can edit/delete an individual operational booking; deleting it never automatically amends a contract or master catalog, never implies external supplier cancellation, and never erases an actual paid provider expense. Admin chooses whether to remove an unpaid planned cost or keep it as independent expense (`DEC-015`).

16. Wallet updates after a previously sent PDF are exposed as a simple **Wallet Update Needed** indicator. Admin manually creates/shares the latest PDF, then **Mark as Sent**; the ordinary admin UI must not list old wallet PDF versions (`DEC-016`).

17. Actual provider **cash or bank transfers are separate payment transactions**, manually entered and allocated to one or more supplier payable rows. Support partial payments and never double count cash transfers as new expenses. **Every provider payable row explicitly shows cost / paid / remaining**, rather than reducing the recorded reservation cost on payment (`DEC-017`, `PAY-013`).
18. Provider payments may be booked **without any initial reservation allocation**; their unapplied value remains supplier-specific credit and may later settle even **not-yet-performed tour payables**. The same original outgoing payment is reused on allocation and never booked twice. Display unapplied credit separately from individual unpaid rows and from conceptual net provider account balance (`DEC-018`).

19. If an existing supplier payment allocation is **released**, it becomes available credit with that supplier again, **without cash movement**. A supplier **refund received** is a distinct incoming cash/bank event, not customer revenue; neither action guesses cancellation penalties (`DEC-019`).
20. **Every operational reservation gets its own automatically generated, permanently unique, searchable number**, whether created at finalization or manually. Preserve it across edits; use a different number for a new replacement booking. It is not the provider confirmation code (`RES-018`).

21. On supplier cancellation, Admin may directly adjust the provider payable **Reservation cost** to $0, a partial fee or full charge. Preserve actual supplier payments, release-to-credit and real refunds as independent actions; offer, without automatically executing, release of excess allocations into that supplier's available credit (`DEC-020`–`DEC-021`, `PAY-019`–`PAY-020`).

**Lightweight notes:** Include a short optional free-text note on relevant client receipts, supplier payments, individual payable adjustments and reservations, without requiring notes or adding complex note management (`NOTE-001`, `SC-062`).

**Client balance deadline:** Outstanding client money defaults to payable *before* client arrival, becoming **overdue on the arrival date** if still outstanding. Allow staff to edit the effective payment deadline on that individual contract/arrival without revising the contract or supplier records; due status recalculates (`REC-007`, `SC-063`–`SC-064`).

**Client deposit entry:** Seller may log an **actually received** deposit inside **Finalize Sale** and permitted staff may later record one missed at finalization through the linked arrival/contract or quick payment action. Contractual deposit due and actual cash received are separate; a late receipt does not revise the contract or create another arrival. (`REC-005`, `REC-006`, `SC-060`–`SC-061`.)

## Implementation environment — existing partially built app (codebase inspection pending)

The actual app repository, existing database/schema, auth controls, deployment architecture and code conventions have not been supplied here. The developer/AI agent **must inspect the real application** before translating this conceptual model into tables, routes, migrations or libraries. See `OQ-40`.

## Xcaret 2026 pricing logic and operating-calendar annex — owner approved

See `Data/Xcaret_2026_Rules_And_Zone_Mapping.md` and two original owner-supplied JPEGs for the complete **eight-zone → exact existing supplier region variant defaults**, **2026 regular/high-season date bands**, normal weekly opening days and **special Sunday exceptions**. Seller gets simple tour/date/adult/child input with normal automatic tariff selection and no distracting 'provisional' marker; staff/admin may locally override one booking's variant/season/cost. Pickup information is set later at reservation, **not** used to select supplier tariff. Known closed service dates block seller add/reschedule and offer **View operating days**. Beginning mid-December Admin dashboard reminds user to prepare next year's seasonal and operating schedules without copying one-off 2026 dates.

**Historical v0.1.35/v0.1.36 handoff boundary (superseded in v0.1.37):** Xcaret's corrected 27-row spreadsheet and provider workbooks were not included at that time. They were being independently amended at that time; **v0.1.37 now attaches the final approved source workbooks**, and these agreed logic rules do not purport to contain/import actual production costs. **This updated release derives from v0.1.33, not cancelled v0.1.34.**


## Source-data warning — initial catalog is not exhaustive

The initial curated hotel master (**1,125 properties, eight zones**), **10 original supplier workbooks plus one Shared Reference workbook**, and Xcaret 2026 calendar sources **are physically included** in this ZIP. The 52 tours and 80 base supplier rates are initial, nonexhaustive seed data. Their presence does not prove the developer has imported them into the running app. Do not fabricate missing rates, tour offerings or commercial eligibility. See `Data/README.md`.

## Authority, conflicts, and coding-agent handoff

- **Reading authority:** `00_START_HERE_DEVELOPER_HANDOFF.md` → `00_READ_FIRST_CURRENT_AUTHORITIES.md` → current `11_v0.1.40_*` cross-app manual override rules → active `02_...`/`03_...`/`05_...` plus v0.1.42 corrections → `04_Decisions_and_Open_Questions.md` current §C and DEC evidence → original rate sources for numeric facts. `History/` has no implementation authority.
- If files conflict, **do not select a convenient interpretation**. Log the conflict and request a decision. This initial package is meant to be internally consistent, but it is a work-in-progress.
- A **PROPOSED conceptual data model** is not authorization to prescribe a specific ORM, table name, framework, UI layout, payment gateway, notification channel or authentication provider.
- Confirmed behaviors should be covered by acceptance scenarios before being marked implemented; unresolved scenarios should remain pending, not treated as passing tests.
- Never change a CONFIRMED requirement silently during development. Propose the change, record the owner's approval and update impacted files.

## Update protocol

**After each new approved architectural decision:** immediately update its `DEC-...` entry or add a new decision; change directly affected requirement statuses/invariants; add or revise acceptance coverage when relevant. **Every 3–5 decisions, or when a change cuts across modules:** do a full consistency pass on all files and publish an incremented package version. **Before developer handoff:** finish all implementation-blocking questions, run an adversarial completeness review, then issue an explicitly approved baseline.

Git is recommended as the developer's long-term version history. Keep historical releases available; avoid replacing old baselines without traceability.
