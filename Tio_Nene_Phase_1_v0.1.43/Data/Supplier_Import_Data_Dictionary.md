# Tío Nenê v0.1.37 — Supplier source import contract and pricing dictionary

**Authority:** The eleven unchanged owner-supplied XLSX workbooks under `Supplier_Source_Workbooks/`. Numeric costs, names, Rate IDs, status values and provider-rate applicability come from those files; this file defines importer/renderer behavior and does **not** replace the source datasets. The actual application/repository was not inspected.

## Provider data inventory

| Provider source workbook | Tours | Supplier Rates | Source ID prefix |
|---|---:|---:|---|
| `Tio_Nene_Baktun_Standardized.xlsx` | 3 | 3 | `BAK` |
| `Tio_Nene_Coco_Bongo_Standardized.xlsx` | 6 | 11 | `COC` |
| `Tio_Nene_Envatours_Standardized.xlsx` | 6 | 6 | `ENV` |
| `Tio_Nene_Miguel_Shuttle_Standardized.xlsx` | 1 | 5 | `MIG` |
| `Tio_Nene_MTZ_Tours_Standardized.xlsx` | 4 | 4 | `MTZ` |
| `Tio_Nene_MUSA_Standardized.xlsx` | 1 | 1 | `MUS` |
| `Tio_Nene_Parasailing_Jet_Ski_Standardized.xlsx` | 3 | 3 | `PJS` |
| `Tio_Nene_Playa_Mia_Standardized.xlsx` | 1 | 3 | `PLY` |
| `Tio_Nene_The_Dolphin_Company_Standardized.xlsx` | 17 | 17 | `DOL` |
| `Tio_Nene_Xcaret_Standardized.xlsx` | 10 | 27 | `XCA` |
| **TOTAL** | **52** | **80** | |

One more workbook `Tio_Nene_Shared_Reference_Standardized.xlsx` contains a single **`Shared Reference`** worksheet. Its **THREE** separate sections/tables must be parsed separately: section A eight canonical hotel-zone mappings; section B six 2026 Xcaret inclusive season windows; section C 28 cross-provider rules. Do not attempt to import it as `Tours` or as a provider.

## `Tours` — required eight columns

| Column | Meaning and control |
|---|---|
| `Tour ID` | Stable unique source key; never replace with name. |
| `Provider` | Source provider string; normalize provider relationship without changing source label. |
| `Supplier Product Name` | Original supplier product identity; available for provider booking/reconciliation. |
| `Display Name` | Seller searchable choice and standard contract label; snapshot on contract generation/finalization. Editable by Admin. |
| `Product Type` | High-level Tour / Activity / Transfer / Package. Actual attached data has 42 Tour, 9 Activity and 1 Transfer; zero current Package is fine. |
| `Product Subtype` | Optional descriptive subtype (e.g., Private Boat, Jet Ski, Nightclub Ticket); blank is valid. |
| `Seller Visible` | `Yes`/`No` seller-selectability. All current 52 source products are Yes. |
| `Status` | `Active` / inactive catalog lifecycle. All initial 52 are Active. |

## `Supplier Rates` — required 21 columns

| Column | Meaning / interpretation |
|---|---|
| `Rate ID` | Stable unique rate key; never synthesize by name/row number. |
| `Tour ID` | Foreign key to exact `Tours.Tour ID`. Multiple Rate IDs may share one Tour ID. |
| `Supplier Rate Name` | Preserve exact source tariff variant name for provider reconciliation. |
| `Pricing Basis` | `Person`, `Vehicle`, `Boat`, `Equipment`, or `Package`; choose formula accordingly; do not reinterpret person count as unit count for Boat/Vehicle/Equipment. |
| `Adult Cost`, `Child Cost` | Source amount in declared `Currency` per passenger when basis Person. Empty may mean not applicable or missing; NEVER automatically coerce null to 0. |
| `Fixed Cost` | Source native-currency amount **per priced unit** for Boat/Vehicle/Equipment/Package when applicable; null for Person. |
| `Currency` | Original supplier currency; USD for 77 rows, MXN for three Playa Mía rows. |
| `Tariff Region` | Provider-specific supplier region label; not itself the agency hotel zone. |
| `Season` | `Regular`/`High` for applicable Xcaret products, else blank. 2026 date calendar joined from shared section B by Tour ID and service date. |
| `Days of Week` | Semicolon-separated allowed weekdays where supplied (especially Coco Bongo). Blank means **no rate weekday criterion provided**, not a verified tour opening calendar. |
| `Departure Area` | Supplier departure/route discriminator when present; may differ from source hotel location. |
| `Route` | Supplier directional service route when applicable (Miguel). Roundtrip = TWO independent one-way reservations/payables. |
| `Minimum Passengers`, `Maximum Passengers` | Capacity for a single priced unit, when supplied. In Jet Ski `1–2` means PER SKI, NOT the max total group on a booking. |
| `Transportation Included` | Supplier package inclusion indication, not permission to invent a transport rate or auto-book extras. Xcaret source already includes transport. |
| `Additional Charges` | Source-supplied extra charge details; if missing, do not invent; Dolphin's base-cost note explicitly means ancillary costs may be excluded. |
| `Effective From`, `Effective To` | Optional actual dates only when provided; blank is not an invented universal valid period. Xcaret season 2026 windows are separate central data. |
| `Rate Status` | `Active` normal candidate, `Manual Only` never automatically selected, `Review Required` not auto-selectable, inactive excludes new automatic use. 79 Active and `PLY-R003` Manual Only in supplied data. |
| `Notes` | Source supplier qualifiers and provenance; not customer contract text unless separately reviewed/approved. |

## Provider-specific automatic rate mapping

**Miguel Shuttle `MIG-001`:** one seller product, five source Vehicle rates. Map every service-date hotel zone via Shared Reference A: Puerto Juarez, Cancun Center, Cancun Hotel Zone→`MIG-R001` USD39; Isla Blanca→`MIG-R002` USD60; Maya Riviera and Playa del Carmen→`MIG-R003` USD65; Tulum Center→`MIG-R004` USD120; Tulum Hotel Zone→`MIG-R005` USD135. These are fixed PER ONE-WAY VEHICLE for 1–7 passengers; two directions create two independent booking/payable rows. Other routes or above-capacity travelers require an explicit quote/allocation. Note shared `MIG-R001` source label *Cancún Hotel Zone / Downtown* combines earlier conceptual Downtown and Hotel Zone aliases without changing the 39 USD tariff. Puerto Juarez/Isla Blanca supplier geographic coverage remains owner-approved operational default but not verified provider transport coverage.

**Playa Mía `PLY-001`:** one seller product Cozumel el Cielo; Puerto Juarez, Isla Blanca, Cancun Center, Cancun Hotel Zone→`PLY-R002` Cancún costs MXN1960/adult+MXN1780/child; Maya Riviera, Playa del Carmen, Tulum Center, Tulum Hotel Zone→`PLY-R001` Playa del Carmen MXN1660/adult+MXN1480/child. `PLY-R003` Cozumel MXN1350/adult+MXN1170/child must **never** be automatic; allow only authorized audited manual selection. Original liability always MXN; USD snapshot from then-current agency rate, then actual USD payment from real settlement.

**Xcaret:** ten source products `XCA-001`–`XCA-010`, 27 rates `XCA-R001`–`XCA-R027`; all existing source supplier prices are transportation-inclusive. For `XCA-001`,`002`,`006`,`007`,`010`, choose Shared Reference A Xcaret Core Region; `XCA-003`, de Noche Region; `XCA-009`, Xoximilco Region. For `XCA-004`,`005`,`008`, no geographic rate variant exists. For `XCA-001`–`006` apply year-2026 six high/regular season bands by TOUR SERVICE DATE; `XCA-007`–`010` have no seasonal rate split in the 27 rows. All **128** provider Tour ID × canonical zone × applicable season cases resolve to exactly one of the 27 Rate IDs (verified). Source Xcaret annex `Xcaret_2026_Rules_And_Zone_Mapping.md` governs owner-approved provisional regional fallbacks without customer-visible provisional badges, plus actual weekly closures/special Sunday exceptions and annual December calendar-update reminder. Pickup place/time is decided later; it is not a rate input. 2027+ dates are unknown and must not reuse 2026.

**Envatours:** three shared boats per Person; three private boats `ENV-R002/004/006` fixed **ONE boat up to ten passengers**, native USD140/270/200. Preserve supplier `(Coletivo)` product names where present, while Display Name omits it for shared experiences. Group above ten needs separate supplier quote/allocation; do not pretend one boat covers 11.

**Parasailing/Jet Ski:** `PJS-R001` per-person USD55 (adult/child amount equal does NOT establish all ages eligible). `PJS-R002` / `PJS-R003` fixed USD90/120 **per individual jet ski** and 2 passengers max per ski: units `ceil(passengers/2)`; cost = units×fixed amount. Authorized booking-level override required to change unit allocation.

**Coco Bongo:** six adult-only seller products, 11 weekday net-cost records, source `Days of Week` filters by tour date; no child cost field. Regular is unavailable Saturday, Royal Service Thu–Sat unavailable, Drink Pack Mon–Wed only. Do not infer commission formulas from notes; already net unit costs. No invented rate on unlisted days.

**Dolphin:** `DOL-001`–`DOL-017` only, no Columbus. Person-basis supplier amounts are BASE COST and do not guarantee extra transport, dock fees, tax or incidentals are included. Add attributable actual extras as independent payable/expense where they occur; mark unknown meaningful costs honestly.

**Other providers:** Baktun `BAK-001`–`003` separate classic/deluxe/2 Cenotes per-person USD, independent of zone; MTZ `MTZ-001`–`004` Person; MUSA `MUS-001` Person. Never invent season/zone/age conditions for these blank source fields.

## Versioning, accounting and acceptance policy

On Finalize Sale, snapshot `Tour ID`, Display Name, selected source Rate ID/name, native supplier unit/total cost, zone, service-date hotel, route/season/weekday, capacity/rate basis, adult/child/**infant** counts (with explicit unknown infant base admission treatment) or calculated vehicle/boat/equipment units, USD estimate rate/amount, and any manual change with user/reason. Generated historic PDF uses the snapped Display Name (arrival/departure airport rows use agreed contract phrasing). Provider-Confirmed status is independent; it does NOT trigger initial planned payable creation. One supplier payable cost with paid/remaining, cash allocations separate, preserve genuine source native currency. Supplier master, source exchange-rate or hotel-zone edits must never alter prior snapshots or cash history. Unknown supplier cost remains null + `Cost Required`; known-price listing is not full profit without unrelated incurred costs. All seller products remain editable/admin-extendable.

**Source files must be imported via an idempotent seed/upsert keyed on permanent IDs.** Never overwrite existing local Admin adjustments silently. Preserve checksum, source filename and per-row provenance. Application runtime import, schema migration, row-level authorization and API validation remain to be built and independently tested.

## v0.1.42 immutable-source import exceptions (binding for runtime policy)

Original Shared Reference cell `REF-015/E40` predates owner approval of **2027+ open Xcaret seller dates at current configured High/Regular provisional supplier costs**. Original `REF-025/E50` predates the approved **Admin-only** supplier-rate edit permission. Both cells remain untouched in their source XLSX, but importer/runtime MUST use current policy as set out in `Data/DEVELOPER_IMPORT_NOTES.md` and `02_Functional_Requirements.md` §M. Keep original cell provenance, verify exact Rate IDs/currencies, and avoid treating old instruction text as permission to override more recent policy.
