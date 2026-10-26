# Tío Nenê — Approved supplier catalog/pricing architecture and vendor maps (v0.1.36)

**Recorded:** 2026-10-19  
**Historical approval integration baseline:** `Tio_Nene_Phase_1_v0.1.35_VERIFIED.zip`  
**Status:** Current v0.1.38 appendix with historical v0.1.36 rules; complete 10-provider XLSX source files were integrated in v0.1.37 and preserved in v0.1.38. This document describes business rules; numeric rates are in immutable supplier source workbooks.  
**Authority:** User-approved decisions supplied in the current conversation. **Do not treat this file as a complete 10-provider tariff import.**

## A. Canonical import architecture — APPROVED

Each of ten provider pricing spreadsheets will use exactly two sheets:

**1. Tours:** `Tour ID`, `Provider`, `Supplier Product Name`, `Display Name`, `Product Type`, `Seller Visible`, `Status`.

**2. Supplier Rates:** multiple rows can belong to one `Tour ID`; each row carries `Rate ID`, `Tour ID`, supplier's original tariff/rate name; pricing basis (`person`, `vehicle`, `boat`, `package`); per-adult, per-child, or flat price as appropriate; supplier currency; geographical rate variants; seasons/effective dates; applicable weekdays; departure area/route; min/max passengers; transportation inclusion; additional charges and supplier conditions. Inapplicable fields remain blank and unknown prices stay unknown, not zero.

Canonical shared data (hotel zones, provider-zone mapping rules, seasons/operating schedules, transport reference rates, centrally edited FX) belong in app reference data; avoid duplicating the same shared rule ten times. Support import/update by stable IDs and do not overwrite referenced history.

## B. Stable product identity and Display Name — APPROVED

- `Display Name` drives **seller search and selection** and, for ordinary tours, **the customer-facing contract**. It can differ completely from `Supplier Product Name`, which remains unmodified for reservation communications, vendor accounting and reconciliation. Retain the supplier's original rate/tariff labels per Supplier Rates row.
- Different consumer experiences are different `Tour ID` products. Differences solely by weekday, season, tariff territory, hotel, route-dependent backend price etc. belong under the **same Tour ID** as multiple `Rate ID` rows, unless they define a genuinely different customer experience.
- Display Names are admin-editable; Tour IDs remain stable; previously generated contracts retain their original display-name text snapshot.
- `Seller Visible` and `Status` must be distinct controls (hidden from search is not the same as archived/inactive); preserve booked history when edited.

## C. Approved product display names

### Baktun — 3 products (unchanged)
- Chichén Itzá Clássico
- Chichén Itzá Deluxe
- Chichén Itzá 2 Cenotes

### Coco Bongo — 6 products
- Coco Bongo Drink Pack
- Coco Bongo Regular
- Coco Bongo Premium
- Coco Bongo Royal Service
- Coco Bongo Gold Member
- Coco Bongo Front Row

Weekday-dependent tariff differences are **rate variants**, not distinct visible tour names. Missing Regular Saturday supplier rate and blank child rates remain unresolved; do not invent amounts, implicitly set zero, or assume children are allowed/disallowed.

### Envatours — 6 products
1. Barco de Vidro – Bajo el Mar Cozumel
2. Barco de Vidro – Bajo el Mar Cozumel (Privado 10 pax)
3. Barco de Vidro – Colores de Cancún
4. Barco de Vidro – Colores de Cancún (Privado 10pax)
5. Barco de Vidro – Tour Isla Mujeres
6. Barco de Vidro – Tour Isla Mujeres (Privado 10 pax)

Original supplier `(Coletivo)` designation for shared experiences must be retained in `Supplier Product Name` though intentionally removed from `Display Name`.

**Resolved in v0.1.37:** Private boat cost basis is NOW source-verified as fixed **per one boat** for 1–10 people: `ENV-R002` USD140, `ENV-R004` USD270, `ENV-R006` USD200. For other unquoted private vessels, retain the manual quote/Unknown Cost safeguard.

### Miguel Shuttle — 1 seller-visible product
`Transfer Privado Aeroporto ↔ Hotel`

Five supplier tariffs are **one product's backend rate variants**, selected using the date-matched hotel zone:

| Tío Nenê hotel zone | Miguel supplier tariff | USD cost per vehicle / one-way |
|---|---|---:|
| Puerto Juarez | Cancún Downtown | 39 |
| Isla Blanca | Costa Mujeres | 60 |
| Cancun Center | Cancún Downtown | 39 |
| Cancun Hotel Zone | Cancún Hotel Zone | 39 |
| Maya Riviera | Playa del Carmen | 65 |
| Playa del Carmen | Playa del Carmen | 65 |
| Tulum Center | Tulum Centre | 120 |
| Tulum Hotel Zone | Tulum Hotel Zone | 135 |

**Explicit owner exception:** ALL accommodations in canonical `Maya Riviera` map to Miguel's `Playa del Carmen` USD 65 tariff—do not subdivide by actual coast location. Puerto Juarez/Cancún Downtown and Isla Blanca/Costa Mujeres mapping are accepted **working defaults requiring coverage verification**, with per-reservation admin override. This vendor-specific verification note does not imply a provisional badge on ordinary Xcaret bookings.

- Unit = **vehicle**, capacity **1–7 passengers**, not per passenger. Each airport arrival and departure direction is a **separate dated operational reservation and supplier payable**, even if the two are arranged via one WhatsApp message.
- Same zone tariff for airport→hotel and hotel→airport; thus a round trip is two priced one-way legs, not one flat cost.
- **8+ passengers**: explicitly handle vehicle allocation/quote; do not silently multiply by an unapproved rule or charge only one vehicle.
- Hotel→hotel is manually quoted. Unsupported routes = no inferred tariff.

## D. Automatic booking supplier cost calculation — APPROVED

1. Use the customer hotel whose stay covers each **specific tour/transfer service date** (not the first hotel on a multi-hotel arrival).
2. Read the hotel's canonical one-of-eight geographic zones from Tío Nenê's hotel database.
3. Apply provider- and product-specific zone→supplier tariff rules, not a universal provider region assumption.
4. Select the correctly eligible rate variant based on the actual price basis and configured other selectors (date, season, weekday, route, capacities, etc.).
5. Compute supplier cost from **existing verified supplier price**; do not invent missing amounts.
6. Snapshot exact rate ID/label, Tour ID, mapped hotel zone, cost basis/currency, quantity, estimated supplier amount, selected standard FX rate where relevant, and all deliberate single-booking overrides and audit metadata.
7. If hotel, stay date, zone or required rate is missing or ambiguous, use existing unknown-cost / operational-review mechanisms; sale finalization remains allowed where previously confirmed (`CON-015`).
8. Admin/authorized staff can override one booking's tariff zone, package/rate, quantity, or effective cost without modifying hotel-zone masters, original supplier tariff master, other bookings, prior contract PDFs or actual payment transactions.

## E. Contract/financial rules — APPROVED / preserve from v0.1.35

- Contract displays ordinary tour `Display Name`, service date and relevant service metadata, never provider tariff labels or private supplier cost. Seller's negotiated USD price is independent from supplier cost.
- **Airport-transfer presentation exception (preexisting v0.1.35):** the client contract remains ONE dated arrival/departure itinerary with `Arriving with/without transfer` and `Departing with/without transfer` and purchased-leg flight details, not duplicate tour lines labeled `Transfer Privado Aeroporto ↔ Hotel`. The new name primarily serves catalog/seller selection. If owner later wishes the literal transfer Display Name printed alongside the itinerary wording, that is a separately authorizable formatting refinement.
- Accurate supplier liability in native currency and snapshot USD planning valuation; supplier payments, credit and payable allocations distinct from cost, with no double-count or historical repricing.
- Existing Xcaret region/package fallbacks, no provisional badge, seasons, operating dates, per-booking overrides, and yearly calendar reminders are **unchanged**.

## F. Compatibility findings / developer implementation requirements

- **No fundamental architectural conflict** with existing `CAT-001`–`CAT-009`, `CON-005`, `CON-014`, `RES-020`, `TRF-001`–`TRF-010`, `PAY-*`, existing v0.1.35 Xcaret annex. New two-sheet import formalizes formerly generic provider-linked catalog and rate-variant model.
- One product ID for Miguel must not collapse the two separate supplier reservation IDs/payables for a purchased round trip. Both legs may reference the same Tour ID but have different booking IDs/service dates and distinct Rate/Cost snapshots.
- **Potential literal wording conflict:** new general 'Display Name on contract' rule versus special existing transfer rows. Preserve prior express `CON-014`/`TRF-010` transfer formatting as exception (as in §E); no duplicative customer-facing tour lines.
- **Different verification policies:** Miguel Puerto Juarez/Isla Blanca geographic coverage verification, not supplier-guaranteed; Xcaret owner specifically declined provisional badges. Don't transfer the supplier-specific badge semantics from one to the other.
- `Pricing basis = Boat` is now explicitly verified for Envatours private `ENV-R002/R004/R006`. Treat other, genuinely unsupplied boat/yacht quotes as Unknown until verified.
- Per-rate allowed weekdays represent **rate eligibility** (e.g. Coco Bongo different weekday charges), not necessarily the tour's **operating-day calendar** that blocks closed dates (existing Xcaret `OPS-012`). Keep them distinct.
- Imported `Tour ID` and `Rate ID` must be globally stable/unique across ten workbooks; use provider-qualified IDs or equivalent stable IDs and validate missing/duplicate references. Never identify products by editable display names. Preserve raw supplier labels/currency and source origin for traceability. Avoid reimport duplicate tours/rates or rewriting historical booking snapshots.
- `Seller Visible` and `Status` should control search availability while maintaining references and historical issued contracts.
- **v0.1.38 current-state correction:** Envatours private boat unit is VERIFIED per boat (1–10), Coco Bongo adult-only and weekday rate statuses plus all 10 provider source display names/rates are in the v0.1.37/v0.1.38 XLSXs. True child age eligibility and unspecified extras remain unknown, and cannot be invented. This preceding supplier-data caveat applied only during v0.1.36 source collection.

## G. Staged source-data boundary

- **Historical context (v0.1.36, not current policy):** v0.1.35 remains an intact ZIP; at that earlier stage supplier workbooks had not yet been packaged. **Current v0.1.43 contains all approved source workbooks, preserved unchanged.**
- Historical v0.1.36 note (superseded): other supplier workbooks were then under review; all 10 final standardized provider workbooks are now attached in v0.1.37 and are authoritative for current imported seller names/rates.
- This v0.1.36 release incorporates the approved rules across catalog requirements, rate schema, auto-cost selection, transfers, financial semantics, acceptance scenarios and import instructions while preserving earlier v0.1.35 decisions.
- Completed in v0.1.37: final standardized supplier XLSX and Xcaret tariff source are attached under `Supplier_Source_Workbooks/`. This record remains explanatory rules; source XLSX files are the authoritative price feed.


## H. Playa Mía — Additional owner-approved configuration (2026-10-19)

**Authority:** Owner-approved Playa Mía tariff mapping preserved from 2026-10-19. The final standardized source workbook **is now included and approved as packaged source data**; whether Rafael has imported it into the live app remains unverified.

### H1. One customer-facing product; three supplier rates

- Provider: **Playa Mía**.
- Approved `Display Name`: **Cozumel el Cielo**. Seller searches/selects this **one** product, not three region-based choices.
- Model as one stable Tour ID with three separate stable supplier Rate IDs. Preserve each of the **original supplier tariff names exactly as present in the final source workbook**, separately from `Display Name`, for reservation requests, liability records, and reconciliation. Do not fabricate original supplier names from descriptions below.
- Approved cost data (supplier costs, **not** customer selling prices):

| Supplier departure-rate variant | Adult native cost | Child native cost | Supplier currency | Default auto-mapping |
|---|---:|---:|---|---|
| Cancún | 1,960 | 1,780 | MXN | Eligible by specific zones below |
| Playa del Carmen | 1,660 | 1,480 | MXN | Eligible by specific zones below |
| Cozumel | 1,350 | 1,170 | MXN | **Manual selection only** |

Pricing basis for this tour is **per person** by adult/child quantities; price does not include additional invented charges. If extra charges or tax rules are later received from Playa Mía, those facts require verified catalog data; do not infer them.

### H2. Explicit owner-approved automatic eight-zone mapping

For the hotel in which a customer stays on the **specific Cozumel el Cielo service date**:

| Canonical Tío Nenê hotel zone | Default Playa Mía supplier departure tariff | Native cost basis |
|---|---|---|
| Puerto Juarez | Cancún | Adult MXN 1,960; child MXN 1,780 |
| Isla Blanca | Cancún | Adult MXN 1,960; child MXN 1,780 |
| Cancun Center | Cancún | Adult MXN 1,960; child MXN 1,780 |
| Cancun Hotel Zone | Cancún | Adult MXN 1,960; child MXN 1,780 |
| Maya Riviera | Playa del Carmen | Adult MXN 1,660; child MXN 1,480 |
| Playa del Carmen | Playa del Carmen | Adult MXN 1,660; child MXN 1,480 |
| Tulum Center | Playa del Carmen | Adult MXN 1,660; child MXN 1,480 |
| Tulum Hotel Zone | Playa del Carmen | Adult MXN 1,660; child MXN 1,480 |

**These are explicitly approved defaults**, with NO automatic hotel-zone assignment to the Cozumel supplier tariff. Do not replace user-authorized provider-specific mappings with a general geographical inference, even if some real hotels are geographically closer to another departure. Do not alter Miguel's or Xcaret's distinct provider-specific mappings.

### H3. Cozumel departure: controlled manual exception

- Keep the original Cozumel per-adult/per-child MXN supplier tariff accessible for **authorized** manual selection only; it is never returned by eight-zone auto pricing.
- On manual selection, record **reason**, user identity/time, source rate ID/name, old default vs selected rate, quantities, currency, and effective cost; preserve source zone and stable IDs.
- Do not add a ninth 'Cozumel' hotel zone or create new supplier prices.
- Authorized booking-level override may also replace the applicable default departure tariff or effective booking cost, without rewriting hotel master classification, master Playa Mía tariffs, other customers' bookings, already-issued contracts, or real recorded supplier payments.

### H4. Contract finalization, snapshot and accounting

1. At sale creation/finalization, select ordinary product `Cozumel el Cielo`; determine the hotel whose dated stay covers this tour date, including multi-hotel trips.
2. Resolve the canonical zone using the existing eight-zone hotel master and apply §H2. If hotel/date/zone/rate selection is missing or ambiguous, surface **review / Cost Required** rather than guessing a value; consistent with v0.1.35 permission to finalize with unknown provider cost.
3. Retrieve adult/child MXN supplier costs for the selected exact rate and calculate the total MXN supplier liability from quantities.
4. At sale finalization, snapshot selected `Tour ID`, `Rate ID`, actual source tariff label, hotel identity, dated stay/service date, zone, selected departure variant, adult and child quantities, per-unit MXN rates, total MXN provider payable, then-current centrally configured MXN/USD standard rate and estimated USD cost (and later any authorized override). Keep original and corrected values traceable.
5. Subsequent confirmation, edits, costs and real MXN provider payments follow existing independent booking/payable/payment records; preserve historical estimates and source tariff price, and capture actual USD paid value at payment time. No duplicated expense, no silent retrospective exchange-rate/cost rewrite.
6. Contract and seller search use only **Cozumel el Cielo**, without `from Cancún`/`from Playa del Carmen`, internal tariff names or costs. Normal service/date/hotel/actual pickup/departure details may appear in the designated fields where relevant. Customer selling price is separately negotiated in USD.

### H5. Compatibility and unresolved data (not additional owner decisions)

- **No architectural conflict found** with v0.1.35 `CON-003` (dated stays), `CON-015` (unknown provider cost), `RES-020` (dated hotel), supplier tariff-zone override `DEC-008`, `PAY-022`/`PAY-023` (MXN native liability and immutable historical USD planning snapshot), `FIN-007` (payment-date actual USD outlay), and existing arrival-date cohort reporting.
- **Provider mappings must not be universalized:** `Maya Riviera → Playa del Carmen` is already owner-approved for Miguel and now separately approved for Playa Mía, but the cost/currency and tariff IDs differ; Xcaret uses its own mapping rules.
- The source supplier tariff departure area is an **internal price variant**, not an additional seller-facing tour or independently mandated pickup site. Actual arrangements may be decided at reservation time, with optional manual booking adjustment.
- No material new clarification is required for the described pricing/zone structure. - **Supplier-cost overrides are Admin-only** under the approved Seller/Admin matrix; no Playa Mía-specific exception.
- **Current:** The final approved Playa Mía two-sheet XLSX is already packaged under `Supplier_Source_Workbooks/`; **use the supplied file** and do not edit original rate labels/IDs. Actual application import/upsert must still be done by developer.

### H6. Integration completed in this release; import tasks still outstanding

**Current:** The approved v0.1.43 package source file and §H mapping are ready for app-side import/upsert. The developer must seed idempotently from packaged originals and verify the resulting database; never replace the source with illustrative numbers.

**Boundary:** This prose appendix is not a price import file; the packaged original XLSXs are authoritative for numbers. Versioned earlier source-stage wording is historical only, not a blocker.

## I. Final supplier data reconciliation (v0.1.37 authoritative update)

This annex was written when rates were pending. All final owner-supplied workbooks are now included in `Supplier_Source_Workbooks/`; numerical price and Rate ID truth comes from those immutable originals plus central `Shared Reference`. In this update, `Tour` gains nullable `Product Subtype` as the eighth source column and supplier pricing adds `Equipment`. Envatours private boat basis is verified (per boat 1–10), Coco Bongo children's ticket/cost fields are not applicable (adults-only) and Regular Saturday is unavailable, and Dolphin has 17 approved base-cost products with Columbus removed. No original v0.1.35 Xcaret zone/season/operation rule is superseded. See `Supplier_Import_Data_Dictionary.md` and `Supplier_Integration_QC.md`.


## v0.1.39 source priority for Dolphin transport

Original Dolphin supplier base rate sheets remain unchanged; separate owner-supplied USD-per-person ROUND-TRIP transport tariff/zone/age seed added under `Dolphin_Transportation/`. Transport default ON for Dolphin booking with Admin opt-out; additional extras otherwise unknown. This approved later input supersedes any earlier statement that Dolphin transport remained wholly unpriced. Refer to latest authority index.
