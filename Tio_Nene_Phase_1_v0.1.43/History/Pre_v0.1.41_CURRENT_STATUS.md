> **ARCHIVED VERBATIM v0.1.40 COPY — NOT AN ACTIVE IMPLEMENTATION INSTRUCTION.** The current files at the main ZIP root have precedence. This archive is provided only to preserve the decision/audit trail.

**LATEST v0.1.40 (2026-10-21):** Start with `00_START_HERE_DEVELOPER_HANDOFF.md`, `00_READ_FIRST_CURRENT_AUTHORITIES.md` and `11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md`. The owner approved selective impact propagation (none/any subset/all), persistent manual overrides, manual-first recovery, nonblocking out-of-sync records and simple default UI. Prior v0.1.39/v0.1.38/pre-v0.1.38 status below is historic. Spec seed verified; actual app, security, PDF and money correctness NOT verified. Owner launch approval still required.

**LATEST v0.1.39 (2026-10-21):** READ `00_READ_FIRST_CURRENT_AUTHORITIES.md` and `09_v0.1.39_Owner_Approved_Decisions.md` first. Earlier v0.1.38 and pre-v0.1.38 `WIP remains` lists lower in this document are historical. Supplied: 1,125-hotel master; clean unsigned contract DOCX; 52/80 original immutable supplier data; Dolphin independently seeded 8-zone per-age USD round-trip tariffs with default transport ON and optional Admin OFF; core supplier reservation field set/notes privacy; Xcaret 2027+ admin on-demand calendar/prices/provisional season; Trello/Sheets/WhatsApp manual migration policy. No real app code/security/ledger/PDF-generation tests are claimed. **Not final developer approval.**

> **LATEST v0.1.38 (2026-10-21):** Owner-approved hotel master (1,125), unsigned existing-clause contract DOCX + repeat rules, receipt/refund permissions, seller revisions with Admin attention flag, unlimited Admin operational editing and form configuration, 2027 Xcaret date selection and supplier-cost repricing and optional ancillaries are documented in `00_READ_FIRST_CURRENT_AUTHORITIES.md` and `07_v0.1.38_Owner_Approved_Changes.md`. **v0.1.37 notes below are HISTORICAL. No app/runtime or legal certification.**

# CURRENT STATUS — Tío Nenê Phase 1

**Checkpoint:** 0.1.38 · 2026-10-21 · **WORK IN PROGRESS — owner decisions still in progress**

## Historical v0.1.37 — Finalized supplier XLSX sources integrated, reconciled, and independently validated

**This ZIP is built directly from VERIFIED v0.1.36** and retains all existing contracts/reservations/payments, Xcaret 2026 calendar images, historical accepted behavior and earlier acceptance cases. The previously outstanding supplier inputs are **NOW ATTACHED**: ten provider workbooks and one Shared Reference workbook (52 seller choices, 80 rates). They are immutable exact source files and administratively editable **after import** in the future app, not edited spreadsheets. See `Data/Supplier_Import_Data_Dictionary.md` for all 21 rate columns and the provider-specific resolver and `Data/Supplier_Integration_QC.md` for a discrepancy report.

- Envatours private boat price basis, formerly unknown, is now **confirmed fixed per boat for 1–10** people; jet skis use **per-equipment** rate USD90/120 and passenger-derived `ceil(n/2)` equipment units; Coco Bongo is adults-only with 11 weekday-specific net prices and Regular unavailable Saturday; Dolphin's imported 17 tours exclude Columbus and have **base costs only**.
- Provider maps use original supplier Rate IDs, 8 canonical dated hotel zones, 2026 Xcaret seasons and source weekday/date constraints; Playa Mía `PLY-R003` is **manual-only**, and no invented missing rate becomes $0. Xcaret has **128 checked combinations** mapping source Tour ID × agency hotel zone × applicable season to unique Rate IDs.
- Seller Display Name is distinct from original supplier product/tariff name; 52 Tour IDs and 80 Rate IDs are stable. On Finalize Sale, persist source rate/region/cost/quantity/FX snapshots. Re-import may not overwrite earlier booking/cash history or silent Admin edits.
- Original 112 acceptance scenarios retained, 18 new supplier-import cases `SC-113`–`SC-130`. All 11 XLSX files remain byte-identical to source archive, source checksums and new package member SHA256 verified.
- **WIP remains:** app/codebase, real hotel master import, contract template/clauses, expanded tour coverage, 2027+ seasonal/operating dates, ancillary Dolphin costs, sensitive permissions and certain refund/FX/revision workflows. This v0.1.37 is a validated **specification/data package**, NOT final developer sign-off or proof of running software.

## Historical v0.1.36 — Approved supplier/catalog decisions, before XLSX source import

**New version is derived directly from VERIFIED v0.1.35**, keeping its 2026 Xcaret tariff-zone defaults, 2026 seasons/operating-day screenshots and annual calendar reminders. Business specifications have advanced; **the completed ten provider XLSX files have NOT yet been uploaded and are NOT part of this release**.

- Two-sheet importer (`Tours`, `Supplier Rates`) for all ten providers, stable Tour/Rate IDs, distinct searchable/client `Display Name` versus original supplier labels, admin editability, source rate variants, historical snapshots and no fictitious values (`CAT-014`–`016`, `CON-017`).
- **Historical at v0.1.36:** visible identities were approved for Baktun, Coco Bongo, Envatours, Miguel Shuttle and Playa Mía, but other provider XLSX files and the Envatours/Coco rate details were not yet supplied. These supplier questions are resolved by the now-attached v0.1.37 source files; the historical status does not apply to the current ZIP.
- Miguel Shuttle: one search result, five supplier USD per-vehicle one-way price categories allocated across eight zones; Maya Riviera ALL $65; incoming and outgoing legs separate bookings/payables, informal one-message booking preserved; 8+ travelers/hotel-to-hotel quote unresolved (`TRF-011`).
- Playa Mía: `Cozumel el Cielo` one search result, automatic Cancún or Playa del Carmen MXN adult/child supplier prices from date-matched hotel zone; **Cozumel tariff manual-only with audit**; native MXN debt and independent standard USD estimate/actual paid FX preserved (`TRF-012`, `PAY-026`).
- All provider rate resolution uses each service's dated hotel, per-provider tariff mapping, correct pricing unit, local booking override, and safe cost-unknown handling (`RES-023`, `FIN-010`, `SC-101`–`SC-112`).
- Comprehensive approved source decision record is inside `Data/Supplier_Catalog_and_Pricing_Decisions.md`; no pending decision text needs to be sent separately at developer handoff once XLSX files are finalized.

**Current implementation readiness:** rule architecture available; supplier data import **incomplete on purpose**. Never misrepresent v0.1.36 as final/signed-off supplier cost dataset.


## Historical v0.1.35 update — Xcaret geo pricing / 2026 calendars (supplier spreadsheets have since been imported)

**New release** derives from **v0.1.33**, deliberately **not** the withdrawn v0.1.34 (which had bundled earlier/unapproved supplier files). No original v0.1.33 business requirements are removed or rewritten.

- **Pricing:** Seller selects a *simple Xcaret display tour*, date, per-tour adults and children. System finds hotel for **that service date**, gets its one agency zone, matches **owner-approved eight-zone, per-tour source package**, then uses the **existing transportation-inclusive provider tariff**. Do not invent a transport breakdown or second Xcaret provider payable. Exact prices still depend on the owner-forthcoming curated provider spreadsheets; if absent use unknown-cost safeguard.
- **Zone mapping:** Full initial eight-zone defaults agreed, including Riviera Maya-labelled Tulum fallback and `RM` for Xcaret de Noche in Cancun-side zones. Owner **does not want any 'provisional' marker** or extra selection work for sellers. Staff/Admin may edit **one booking's** supplier package, season and cost; local edits do not rewrite other bookings, master tariffs, hotel zone, original PDF or actual payments. Mapping is an operational default, **not** supplier pickup certification. Actual pickup details are separately arranged at supplier reservation, not used to determine supplier cost.
- **2026 season dates:** 01-01–03-29 regular, 03-30–04-12 high, 04-13–06-30 regular, 07-01–08-15 high, 08-16–12-25 regular, 12-26–12-31 high. Apply according to **tour date** and only when the existing source supplier price has high/baja versions.
- **Tour calendar:** Owner supplied official weekly operating days and **specific 2026 Sunday openings/closures** (two source images included) — seller may NOT add or reschedule a tour on an **explicitly closed** date; clear error and **View operating days** option. Date overrides supersede normal weekly schedule. Admin editability maintained.
- **Yearly update:** **Mid-December (around Dec 15)** Admin dashboard reminder to review/update **next-year** Xcaret season dates, special opening days and regular weekly operating days. Do not roll 2026 season/Sunday exceptions into 2027, and reminder does not block operational work.
- **Historical stage note, now superseded:** At v0.1.35 the Xcaret 27-row provider XLSX was not yet supplied; v0.1.37 now contains all 11 approved standardized workbooks and their source tariffs. Future catalog additions remain incomplete by owner choice. Do not fabricate absent source inputs or claim an exhaustive provider catalog.

**Reference:** `Data/Xcaret_2026_Rules_And_Zone_Mapping.md` and attached two original screenshots, `CAT-011`–`013`, `CON-016`, `RES-022`, `PAY-025`, `OPS-012`–`013`, `SC-093`–`100`.


## Latest confirmed clarification — Unknown supplier costs do NOT block Finalize Sale

Owner confirms seller may finalize sales containing unusual free-text tours or yachts **before the provider cost is known**. Booking and payable-placeholder records are still created; the amount is **unknown, not $0**. The system automatically raises **Cost Required** on the staff action queue and relevant arrival until the provider cost is entered. Profit reports must prominently distinguish incomplete cost-based margins, instead of presenting an artificially high profit. This expands already-approved manual/variable provider pricing and downstream nonblocking behavior (`CON-015`, `PAY-024`, `OPS-011`, `FIN-009`, `SC-090`–`092`).

**Next material topics:** Verify pricing source sheets and import plan; resolve materially important ownership/assignment for missing cost/provider data only if workflows require it; examine partner/provider data security and client-sensitive data exposure. No need to ask dozens of minor pricing edge cases.

## Previous confirmed clarifications — future-only FX defaults; arrival-cohort profitability

**Standard exchange rate:** Owner edits the standard MXN/USD rate as needed (perhaps monthly or less frequently). The current rate is used for new provisional supplier-cost conversions until the next edit. All existing records retain their original rate and USD estimate snapshots, even when the global setting changes (`PAY-023`, `SC-087`, `PAY-022`). No retrospective repricing.

**Profit reporting period:** Owner defines **“profit this month”** as profit on the cohort of clients whose **arrival date** falls within the chosen month. October 31 arrival belongs to October, even with November-only tours, independent of September/October sale date, provider payment dates and customer cash receipt dates. Apply same arrival-date basis for weekly/yearly/custom profitability filters and provider-attributed profit over that cohort. Keep cash in/out reporting separate using actual payment dates (`FIN-008`, `SC-088`–`089`, partially resolved `OQ-24`). This is **operational profit attributed to arriving customers**, not a claim about legal or statutory revenue recognition.

**Next material questions (do not micro-interrogate):** Verify the source tour/provider pricing files and provider-rate settings before importer signoff. Clarify any *material* remaining basis of “realized” margin when some provider costs are unpaid, plus substantive partner/provider security and financial permissions. Current project is still work-in-progress.

## Previously confirmed clarification — MXN provider estimate and actual USD payment cost

Owner CONFIRMED that when MXN provider charges (e.g. Playa Mía) are added to a USD client's booking, the system uses the **agency's centrally editable standard currency rate** to save a provisional **USD estimate** of the original **MXN price**. When staff actually pay the provider, they typically know the **actual USD cost**, so this is entered with the real cash/bank payment (not by rewriting the original MXN supplier amount, not by adding another expense). Updating the standard rate later does not retroactively rewrite historical estimates. Keep `PAY-022`, `FIN-007`, `SC-085`–`SC-086` and refined `OQ-23` aligned.

**Still open for a targeted later pass:** Different FX rates for multiple partial payments, supplier credit/refunds in another currency, timing basis and treatment of taxes/IVA; don't force complex rules now. **Next substantial priority:** Define period-based financial-report meanings and verify actual rate/cost seed data before developer signoff. Avoid repetitive micro-questions.

## Latest confirmed clarification — Client-side USD with occasional BRL deposit

The owner confirmed that **client-facing contract prices and all outstanding client balances are USD**, with regular client receipts in USD. Occasionally a deposit is tendered in Brazilian reais, but staff credits the **explicit USD equivalent** to the contract, optionally noting the original BRL tender and/or conversion details. No mandatory multi-currency client contract module or invented automatic rate. Preserve accurate cash-receipt tracking with no double counting (`REC-008`, `SC-084`), while detailed supplier-side FX profit/accounting remains open (`OQ-23`).

**Next substantive focus:** MXN supplier cost and payment FX treatment, estimated vs actual USD reporting; then reconcile actual tour-price/provider files. Avoid low-value exception interrogations.

## Latest confirmed clarification — Two transfer reservations / one chronological contract itinerary

**Two legs:** Owner confirmed purchased inbound airport→hotel and outbound hotel→airport transfers must be **two independently editable operational reservation records**, each with unique booking ID and supplier payable. Staff normally may arrange both through **one informal provider conversation**, or separately; booking records do not imply mandatory multiple messages (`TRF-008`–`009`, `SC-081`).

**Client-facing contract:** Dated arrival row says **Arriving with transfer** (flight number/time) or **Arriving without transfer**; dated tour lines follow; dated departure says **Departing with transfer** (flight number/time) or **Departing without transfer**. Transfer data belongs in the same chronological itinerary and must not cause a duplicate client-facing tour. A *without transfer* statement creates NO operational transfer booking (`CON-014`, `TRF-010`, `SC-082`–`083`).

**Next priorities:** Actual data handoff and provider tariff mapping; cross-currency financial-reporting definitions; essential security/access controls. Remaining transfer exceptions are OPEN under `OQ-09`, but the basic two-booking model is settled. Avoid micro-decision loops.

## Latest confirmed clarification — Automatic Ready + practical transfer arrangements

**Auto Ready clarified:** An arrival should automatically display **Ready** when all required reservations (including mandatory included transport) exist and are Confirmed, and the current wallet is ready to send. A Confirmed yacht alone must not hide its unbooked required marina transfer. Admin's independent override still changes only the displayed status and never deletes Action Required (`OPS-005`, `OPS-009`–`010`, `SC-077`–`078`).

**Airport transfers clarified:** For airport transfer service(s) sold, capture relevant **flight number and flight time on contract**. The regular transport provider is contacted informally via WhatsApp/text, without a confirmation code; inbound and outbound are often arranged in one conversation, but sometimes separately. Do not force two separate messages/provider-link submissions. Two independent leg records are now confirmed in v0.1.29 (`TRF-009`, `SC-081`); no mandatory separate supplier conversations (`TRF-008`).

**Now settled in v0.1.29:** Two separately editable operational legs/IDs and payables; single supplier interaction remains valid. Next substantive focus: provider tariff data, currency/profit and actual data import, not more minor booking-status decisions.

## Latest confirmed clarification — Admin overrides readiness label; Admin can manually confirm a booking

Owner CONFIRMED that the arrival-level **Ready / Not Ready indicator is a label, NOT an operational gate**. The system still calculates the default from recorded arrangements, but Admin can explicitly mark any arrival **Ready OR Not Ready**, even with still-unconfirmed bookings. **The actual supplier booking statuses and all unresolved Action Required tasks remain present and visible**, including a required yacht transfer that has not yet been booked. No contract/finance/wallet workflow is blocked or triggered solely by this display override (`OPS-010`, `SC-074`, `SC-075`).

Owner further CONFIRMED that Admin can manually mark an individual unconfirmed provider booking **Confirmed** without a provider link or mandatory pickup/code fields (`RES-021`, `SC-076`). It is an internal override/status entry, not automatic proof of supplier acceptance, and does not check Staff Reviewed or complete other bookings.

**Next discussion:** High-impact open end-to-end gaps (airport transfers outbound/return and flight details, financial currency/profit, security/access, data handoff), plus any genuinely material outstanding automatic readiness threshold. Do NOT return to low-value micro-decisions.

## Latest confirmed clarification — Included transport must create a pending operational task

Owner CONFIRMED an important gap found in the v0.1.25 audit: a yacht may be confirmed even though its *included transport* has not been separately booked yet. The configurable catalog requirement for an included additional service must therefore generate **Book transportation** as an **Action Required** item when a sale is finalized, before a transport booking exists. Staff **manually add/associate** the transfer in the same arrival, which clears this missing-booking item and creates its own linked supplier booking/payable; further provider follow-up is tracked normally. The customer contract is unchanged, and no auto-booking or second charged contract line occurs (`CAT-010`, `RES-011`, `OPS-009`, `SC-072`, `SC-073`). A known required ancillary service still unarranged prevents overall Ready; the other positive readiness conditions remain undecided (`OQ-26`).

**Next discussion:** Focus on remaining material operational-readiness criteria (for example, when a manually handled but still-unconfirmed provider booking can qualify for Ready) and other substantial data-flow gaps, not isolated technical edge cases.

## Latest confirmed clarification — Wallet ready to send; sending not part of operational Ready

Owner explicitly CONFIRMED: **Operational Ready requires that the current client wallet be prepared/ready to send, NOT that staff have already sent or marked the wallet sent.** A ready arrival can still show **Send Needed / Not Sent** independently, without downgrading operational readiness solely because of distribution. Retain manual PDF sharing and Mark as Sent for communication follow-up (`OPS-008`, `WAL-008`, `SC-071`). Exact other Ready conditions for provider reservations/transfers and exceptional arrangements, and final wallet-completeness criteria, remain OPEN (`OQ-26`). Do not equate `Ready` with proof of client receipt.

**Next discussion:** Resolve whether a supplier booking still awaiting provider confirmation can ever count as operational Ready after staff resolves/acknowledges an exception; prioritize high-impact workflow questions rather than micro-decisions.

## Latest confirmed clarification — Financial and operational readiness are separate

The owner has CONFIRMED that **unpaid/overdue customer balances must not prevent an arrival being labeled operationally Ready**, provided the trip meets the later-approved operational requirements. Financial receivables and overdue warnings remain clearly visible but **separately** from the Ready/Not Ready badge and Action Required operational booking queue (`OPS-007`, `SC-070`, `REC-007`). The precise positive criteria for operational Ready (bookings, hidden/included transfers, wallet up-to-date, optional exception acknowledgment) are still OPEN under `OQ-26`; don't treat this as approval to mark unconfirmed trips Ready.

The owner also asked whether free-type hotel entry for missing accommodations had been specified already: **yes**, it was part of their original voice note and is already confirmed in `CON-003`/`SC-005`, including multiple date-ranged stays and independent pickup overrides (`RES-020`). No new policy or data model is needed here.

**Next discussion:** Resolve remaining high-impact operational readiness criteria as a **single practical decision**, then return to other material unresolved workflow gaps; avoid repetitive micro-questions.

## Latest confirmed clarification — Both arrival readiness and action queue (not a new numbered architectural decision)

The user explicitly wants **BOTH**: an easy-to-read **Ready / Not Ready** indicator beside every arrival in the overview/list, **AND** an actionable, prioritized **Action Required** list showing exactly what needs attention. Opening a Not Ready arrival should expose its unresolved operational items. These are complementary views derived from the same records, not a mutually exclusive design choice or duplicate manually maintained task system (`OPS-005`, `OPS-006`, `SC-068`–`SC-069`). Exact readiness criteria/overrides remain open in `OQ-26`; neither compulsory staff review nor payment gating was approved, and the calendar view has explicitly been set aside for now.

**Next discussion:** Resume high-impact end-to-end workflow completeness, especially what conditions truly constitute an arrival being ready; avoid small status/financial edge-case questions.

## Latest confirmed clarification — Baktun per-person tariffs (not a new numbered architectural decision)

**Baktun's Chichén Itzá Deluxe, Classic and Two Cenotes variants each charge per adult and per child**, summed from each reservation's adult/child counts, with **no hotel-zone adjustment**. The owner illustrated the structure with $80/adult and $60/child; these are **NOT confirmed actual tariffs**. Other providers also use this model, but complete per-service pricing classification and real rate mapping will be a **separate later catalog/data audit** (`CAT-009`, `PAY-021`, `OQ-10`, `SC-067`).

**Other confirmed models remain:** Airport↔hotel transfers charge one fixed vehicle fee for 1–7 travelers, zone/direction-dependent; yachts are boat-specific manual quotes. Missing tariffs/quotes are never silently treated as $0.

**Earlier priority:** Materially significant operational workflow gaps; the complementary readiness indicator and action list have now been confirmed, while their exact criteria remain open. Avoid further granular pricing questions until real provider spreadsheets are ready.

## Latest confirmed clarification — Client balance deadline (not a new numbered architectural decision)

**Default:** An unpaid client balance is due **before arrival**, so for December 12 arrival it becomes **Overdue on December 12** if not fully paid. Staff can change the effective deadline for that client to a specifically agreed later payment date (e.g. December 14), and overdue status is recalculated from that override and actual collected payments, without rewriting the original contract, arrival or supplier records (`REC-007`, `SC-063`–`SC-064`). Remaining questions: which seller role can edit the due date and whether moving arrival date should revise a manually overridden deadline. Do not ask micro-decisions.

## Previously confirmed clarification — Lightweight notes (not a new architectural decision)

The owner approved a simple optional note on relevant records, especially client receipts, supplier payments, independent payable/expense adjustments and reservations. Notes support free text such as which bank account received money; they are never mandatory and do not change underlying payment or booking data (`NOTE-001`, `SC-062`). Do not build a separate note-management module or ask additional micro-questions.

## Previously confirmed deposit clarification

**Seller deposit collection at sale finalization:** The owner estimates about 95% of sellers have already received a deposit when they click **Finalize Sale**. Seller must be able to record the **actual received deposit** right within that workflow (amount, cash/bank transfer and real received date). It is **not a finalization prerequisite**. The contract's agreed/stated deposit remains separate from money actually received (`REC-005`, `SC-060`).

**Forgotten receipt recovery:** If the seller finalized without recording a deposit that was already received, staff can simply record it later via existing contract/arrival or quick payment entry, with the original receipt date; updates incoming-payment history/client balance, **not** the original contract/arrival/reservations (`REC-006`, `SC-061`). Existing rights for Seller/Admin outside finalization remain open under `OQ-28`.

## Previously confirmed

The latest numbered architectural decision is **DEC-021** (supplier cost reduced below already-allocated payment; optional release of excess to same supplier credit, no automatic transfer or refund). Following functional requirements are also confirmed: individual adult/child tour counts appear on each tour line of client contract; tour pickup hotel defaults based on dated hotel stays with local override; contract-wide percentage **or** fixed discount is proportionately allocated to internal tour-line revenue. See `04_Decisions_and_Open_Questions.md` and respective acceptance scenarios.

## Work method and next questions

**Do not over-engineer or drill into trivial edge cases.** Continue auditing the originally described critical post-sale workflow for meaningful missing capabilities, costly assumptions and implementation blockers. Infer harmless obvious outcomes from agreed principles; ask only material questions, and group them. Current high-priority areas include supplier tour cost inputs, contract-level amounts vs received payments, accurate projected/realized reporting/FX, operational readiness, security and source-data import. Existing small technical exceptions remain documented, not owner-interrogation targets.

**The package is a verified documentation checkpoint, not final developer sign-off.** Independent hotel/tour/provider catalogs being prepared by owner are not included.

## Continuation protocol

Read `README.md`, decision register, and the current status. Update approved behavior as it is decided; preserve earlier versions and do not promote open assumptions to approved requirements. Validate package before release.
