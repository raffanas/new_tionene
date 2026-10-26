# Xcaret 2026 — Confirmed pricing, zone defaults and opening calendars

**Status:** Owner-approved booking/pricing RULES and default map; the **final provider Xcaret XLSX is NOW PRESENT** as `Supplier_Source_Workbooks/Tio_Nene_Xcaret_Standardized.xlsx` in v0.1.37 with 10 Tour IDs and 27 source Rate IDs. Owner-approved mapping/calendars remain unchanged. This document is a **rules annex**, NOT a tariff import file. Join the tour-specific package region/season combinations to the verified 27-row workbook by stable Tour ID and source Rate ID at seed time; 128 applicable zone×product×season combinations have been verified. Keep supplier prices in actual source data, do not transcribe/guess missing values from this annex. Based directly on v0.1.33 (v0.1.34 was intentionally excluded).

**Primary source images supplied by the owner:** `Xcaret_2026_Temporadas_y_Domingos.jpeg` and `Xcaret_Weekly_Operating_Days.jpeg` included in this directory. The earlier owner-provided `TARIFAS TIO NENE.pdf` and in-progress `Xcaret_Tours_Cost_Prices.xlsx` were used to reason about **existing** regional package names but **were not part of v0.1.35/0.1.36**; their final standardized replacement supplier workbook is now attached in v0.1.37. Do not treat this annex as substitute source pricing or publish unverified amounts.

## A. Confirmed pricing sequence

1. Seller adds a **simple customer-facing Xcaret tour/display name** and chooses service date plus individual adult and child counts. Seller does **not** choose a supplier tariff region in normal sale flow.
2. From the arrival's dated hotel stays, find the **hotel valid on the service date**; use its canonical Tío Nenê zone. Existing missing/overlap free-text-hotel exceptions remain governed by `RES-020` and `OQ-07`; if no date-matched classified hotel exists, do not invent a geographical zone or cost.
3. Resolve the selected customer-facing tour to an **existing, transportation-inclusive Xcaret supplier-package row** for its designated region. The region map below is the owner's **approved operational default**, including Tulum fallback. It is not proof of individual-hotel pickup availability. **The user does not want any 'provisional' or 'unverified zone' badge/marker on routine screens**. Internal historical trace of selected rule/source and manual changes still applies.
4. Determine **regular/high temporada from the tour service date** using the 2026 schedule below, and choose the corresponding existing row if the tour offers different seasonal prices. For tours that have one tariff independent of season, reuse their single listed price (do not invent seasonal variants).
5. Calculate suggested supplier cost from that exact existing row's per-adult and per-child rates times that booking's attendance. Do not split Xcaret's transport-inclusive price into artificial admission/transport components and do not create a separate included-transport provider payable for these Xcaret packages.
6. At **Finalize Sale**, snapshot the selected supplier package, hotel zone/date inputs, selected season/source rate, attendance, and supplier cost as the planned reservation/payable basis; this is earlier than supplier confirmation. Later provider confirmation may record the actual chosen details without erasing the original planned snapshot or actual money records. Supplier cost remains independently editable on each booking and its payable under existing selective-sync rules.
7. **Pickup place/time is decided separately when arranging the Xcaret reservation.** Hotel pickup eligibility, a meeting-point list and chosen pickup are **NOT inputs to the automatic supplier price calculation**. Do not require a provider×hotel pickup exception matrix to price a sale.
8. If the suggested package, season or price is wrong, authorized staff can change **only that individual reservation's** selected package, season, adult/child quantities, effective supplier cost and actual pickup detail. Choosing another existing package offers recalculation; a direct manual cost override is permitted. Do not mutate the original contract, hotel-zone master, other reservations, price master or historic supplier payments. Preserve an auditable trace without noisy routine flags.

## B. Eight-zone default package mapping (CONFIRMED owner-approved defaults)

The first column of package options covers **Xcaret Full Day, Xcaret Plus, Xplor, Xplor Fuego, Xenses** with their appropriate tour-specific region variants; *CUN/RM* means choose the **exact existing package for that tour** whose label contains Cancún/Riviera Maya (or equivalent); *PYC/PDC* similarly means use that tour's existing Playacar/Playa del Carmen (for Xplor Fuego, label may simply read `Pyc`). **Never invent a tariff row or multiply a base admission charge.**

| Agency hotel zone | Xcaret Full Day/Plus, Xplor, Xplor Fuego, Xenses | Xcaret de Noche | Xoximilco |
|---|---|---|---|
| Puerto Juarez | CUN/RM | RM | CUN/Playa Mujeres |
| Isla Blanca (includes Costa/Playa Mujeres) | CUN/RM | RM | CUN/Playa Mujeres |
| Cancun Center | CUN/RM | RM | CUN/Playa Mujeres |
| Cancun Hotel Zone | CUN/RM | RM | CUN/Playa Mujeres |
| Maya Riviera | CUN/RM | RM | RM/Playa del Carmen |
| Playa del Carmen | PYC/PDC | PYC/PDC | RM/Playa del Carmen |
| Tulum Center | CUN/RM | RM | RM/Playa del Carmen |
| Tulum Hotel Zone | CUN/RM | RM | RM/Playa del Carmen |

**Special decisions:** The Tulum rows deliberately fall back to **available Riviera Maya-labelled packages**. Xcaret de Noche's `RM` row is also the approved default for Cancún-area hotels despite its narrower-looking source title. These are **staff-correctable defaults only**, not assertions that the supplier will physically pick up the guest at that hotel or honor every territorial interpretation. The owner's preference is **NO provisional label or warning on these automatic selections**. Staff still has free manual override in the individual booking. 

**Products without a regional tariff split among the selected source rows:** Xel-Há All Inclusive, **Tulum + Xel-Há** (distinct customer-facing tour, not a Tulum hotel-zone variant of Xel-Há), and Xenotes Oasis Maya. For these, geography is not a cost selector. For future added product-specific regional labels with no eligible actual Rate ID, cost remains Unknown until an actual rate is supplied; **the current 27 source rows match the existing 8-zone policy for all 10 current Xcaret products**. Do not manufacture a package.

## C. 2026 high and regular seasons (exact date ranges, inclusive)

The source image calls non-high periods **Temporada Regular**; for packages labelled `Temporada Baja` this is the **Regular/Baja** cost. All dates below are local calendar dates in **2026** (not reused automatically for 2027).

| Inclusive period | Supplier season for matching |
|---|---|
| 2026-01-01 — 2026-03-29 | Regular / Baja |
| 2026-03-30 — 2026-04-12 | Alta |
| 2026-04-13 — 2026-06-30 | Regular / Baja |
| 2026-07-01 — 2026-08-15 | Alta |
| 2026-08-16 — 2026-12-25 | Regular / Baja |
| 2026-12-26 — 2026-12-31 | Alta |

Season must be derived from **TOUR DATE** not sale, arrival, or provider payment date. Seasonal tariff only applies where the **selected source supplier tour variant** has corresponding high/regular rows. Example: Xplor Fuego, Xoximilco and Xenses have no seasonal price split in the 27 source rows. These periods and applicable rate variants are admin-editable. A later year's calendar and any supplier tariff changes require their own explicit values; missing future-year data must not be guessed or treated as a zero supplier cost. Existing booking snapshots do not reprice when general dates/rates are edited.

## D. Weekly operating-day schedule (source image; 2026 reference)

`Open` means normal recurring weekday; `Closed` means seller cannot add/reschedule to that date **unless an explicit operating-date exception permits it**. Only configure restrictions on catalog offerings for which the row is applicable; the image also includes tours NOT YET part of the approved 27-row source catalog.

| Tour / source group | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Xcaret | Open | Open | Open | Open | Open | Open | Open |
| Xel-Há | Open | Closed | Open | Open | Open | Open | Open |
| Xplor | Open | Open | Open | Open | Open | Open | Closed |
| Xplor Fuego | Open | Open | Open | Closed | Open | Open | Closed |
| ATV’s Cancún | Closed | Open | Open | Open | Open | Open | Closed |
| ATV’s Playa del Carmen | Open | Open | Open | Open | Open | Open | Closed |
| Xenses | Open | Open | Closed | Open | Open | Open | Closed |
| Xoximilco / Xoxi | Closed | Open | Open | Open | Open | Open | Closed |
| Xenotes | Open | Open | Open | Open | Open | Open | Closed |
| Xichén de Lujo | Open | Open | Open | Open | Closed | Open | Closed |
| Xichén Clásico | Open | Open | Open | Open | Open | Open | Open |
| Catamarán IM 09:00 | Open | Open | Open | Open | Open | Open | Open |
| Catamarán IM 12:00 | Closed | Open | Closed | Open | Open | Open | Open |
| Fury | Open | Closed | Open | Closed | Open | Open | Closed |

**Scope safeguard:** Do not import ATV, Xichén, Catamarán or Fury products solely because they appear on these supplier calendars: this addendum **does not expand** the intentionally incomplete 27-row Xcaret catalog. If the final catalog includes new variants later, Admin links them to the appropriate actual schedule, rather than guessing variant operation from their names. E.g. `Tulum + Xel-Há` is not independently named in the weekly calendar, so its precise weekday restriction must not be invented from the park's row without confirmation.

## E. Special Sunday **2026** operating-date exceptions

Document supplies these dates: **2026-04-05**, **2026-07-12**, **2026-07-19**, **2026-07-26**, **2026-08-02**, **2026-08-09**, **2026-12-27**. Each below is a 2026 Sunday. `Open` and `Closed` are copied from explicit marks in the owner's supplier image; an exception can **open a normally closed Sunday** or explicitly keep it closed. These exceptions take precedence over the corresponding weekly row *for that date only*.

| Tour / source group | Apr 05 | Jul 12 | Jul 19 | Jul 26 | Aug 02 | Aug 09 | Dec 27 |
|---|---|---|---|---|---|---|---|
| Xcaret | Open | Open | Open | Open | Open | Open | Open |
| Xel-Há | Open | Open | Open | Open | Open | Open | Open |
| Xplor | Open | Open | Open | Open | Open | Open | Open |
| Xplor Fuego | Closed | Closed | Closed | Closed | Closed | Closed | Closed |
| Xenses | Open | Open | Open | Open | Open | Open | Open |
| Xoximilco / Xoxi | Closed | Closed | Open | Open | Open | Open | Closed |
| Xenotes | Open | Closed | Open | Open | Open | Open | Open |
| Xichén Clásico | Open | Open | Open | Open | Open | Open | Open |
| Xichén de Lujo | Closed | Closed | Open | Open | Open | Open | Open |
| Catamarán (unqualified group) | Open | Open | Open | Open | Open | Open | Open |
| ATV’s Playa del Carmen | Open | Closed | Open | Open | Open | Open | Open |
| ATV’s Cancún | Closed | Closed | Closed | Closed | Closed | Closed | Closed |
| Fury | Closed | Closed | Open | Open | Open | Open | Closed |

**Caveat:** The Sunday image labels a generic `Catamarán`, while the weekday image differentiates two Catamarán IM departure times. Do not infer a time-specific Sunday override for an unlisted departure if it would change availability; refer to exact variant when added to the curated catalog. Historical or future dates require the applicable year-specific exception data.

## F. Seller date validation and Admin maintenance (CONFIRMED)

- Before accepting a seller-selected tour and **date**, evaluate the product's configured recurring weekday rule plus the specific-date exception for that year (special-date rule takes precedence). **If explicitly closed, prevent the seller from adding the tour or changing to that date**. Error example: `Xoximilco does not operate on Monday. Select another date.` Include an actionable **View operating days** option showing that tour's regular open weekdays and known special opening dates, rather than only rejecting without explanation. A date-picker may also visually disable known closed dates.
- Do not block a tour simply because no operating calendar has ever been provided for an unrelated provider. Missing/unknown future-year Xcaret rules are distinct from an **explicit closed** date: they require admin confirmation or data completion rather than pretending a specific opening rule was verified. Preserve the existing ability to save drafts or finalize sales with an unknown supplier cost under `CON-015` as applicable; the owner has not approved automatically carrying 2026 exceptions/season dates into 2027.
- Admin can edit weekly weekday schedule, year-specific opening/closing exceptions and season date ranges in the app. Supplier package/season/cost are also **locally overrideable for individual Xcaret reservations**. No change to a general rule may silently rewrite an older finalized booking, provider payment, hotel zone or contract PDF.
- For each year, **begin showing a dashboard reminder around December 15** to update/confirm **NEXT YEAR's Xcaret high/regular-season dates, special operating dates (especially Sundays), and weekly operating schedules**. The admin dashboard reminder should clearly identify the target year; do not infer that 2026 annual dates apply to 2027. When the following year's data has been entered/confirmed, clear the relevant outstanding reminder. This reminder is informational, not a booking/payment/readiness gate, and requires no invented external notification or automation service.

## G. Cost snapshot and import-boundary tests

- **Normal flow:** Xoximilco, Cancun Hotel Zone, service date in 2026 → package `CUN/Playa Mujeres` cost using existing adult/child amounts; no pickup input or zone choice by seller.
- **Tulum:** Xcaret Plus, hotel Tulum Hotel Zone → use existing `CUN/RM` supplier row as the approved fallback; no provisional badge. Can change package/cost on *only* this booking.
- **de Noche in Cancún:** Xcaret de Noche in Cancun Center → existing `RM` supplier row; no provisional marker; overrideable.
- **Manual correction:** Change local package, cost, season or pickup on one confirmed/paid booking; preserve original source snapshot and paid transactions, do not alter rate master/other clients.
- **Sunday checks:** Xplor Sunday 2026-07-19 allowed by listed special exception; Xplor Sunday 2026-09-06 denied; Xoximilco Sunday 2026-07-12 denied and Sunday 2026-07-19 allowed; Xel-Há Tuesday denied (subject to explicit future exception); Xenotes Sunday 2026-07-12 denied.
- **Season checks:** 2026-03-29 regular, 03-30 high; 04-12 high, 04-13 regular; 07-01 high, 08-15 high, 08-16 regular; 12-25 regular and 12-26 high. Changes to temporada/price table later leave existing saved estimates unchanged.
- **Annual maintenance:** On/around 2026-12-15 Admin dashboard flags that **2027** calendar/season/operating schedules need review, independent of whether clients can see the calendar reminder. It must not auto-clone 2026 high-season or special Sunday dates into 2027.

**IMPORTANT: Provider XLSX source is now included in v0.1.37; actual software/database import remains developer work.** Keep every new Xcaret rule implementable as configurable admin reference data. No amount, missing tour, season for 2027, pickup eligibility or external supplier guarantee has been invented here.


## v0.1.38 superseding 2027+ policy (2026 sections above unchanged)

The owner explicitly allows **every 2027 date to be selected** until new applicable future-year calendar rules are entered. Do not block 2027 based on old weekly 2026 closed days or special Sunday/season exceptions. Current configured Xcaret **supplier costs**, not blanket Unknown, apply to future-year bookings; a tour with both seasonal source Rate IDs needs an explicit Admin-selected active default when its future-year season is not yet verified (still unresolved exact fallback selection). When Admin updates rates anytime, offer intentional all-future-*not-yet-commenced* **supplier cost-only** repricing (including previously entered bookings), with preview/audit. Never modify customer selling prices, actual cash payments, historical PDFs or the 2026 supplier spreadsheets. Annual mid-December reminder remains informational. Consult `../07_v0.1.38_Owner_Approved_Changes.md`.
