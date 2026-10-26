> **CURRENT v0.1.43 IMPORT INSTRUCTIONS:** The data and pricing specifics below must be read alongside `00_START_HERE_DEVELOPER_HANDOFF.md` and `11_v0.1.40_*`; standalone older export wording is historical. All ORIGINAL XLSX assets must remain intact.

> **ARCHIVED ORIGINAL SUPPLIER SOURCE-EXPORT NOTES:** the source-only standalone supplier ZIP described below did not physically include the Xcaret calendar annex. **The current combined v0.1.43 handoff DOES include** `Xcaret_2026_Rules_And_Zone_Mapping.md`, both original JPEGs, the actual hotel master and the sanitized unsigned contract template. Do not treat this earlier note as current combined-package status.

# Tío Nenê — Final standardized supplier data | 2026-10-19

## Package layout
- 10 provider XLSX workbooks: each has `Tours` and `Supplier Rates`.
- 1 shared XLSX workbook: one `Shared Reference` sheet with three named Excel tables (hotel-zone mappings, Xcaret 2026 seasons, and cross-provider rules).
- **11 XLSX files / 21 worksheets / 52 seller-facing products / 80 supplier rate records.**
- Every provider's `Tours` sheet has exactly 8 standardized columns:
  `Tour ID`, `Provider`, `Supplier Product Name`, `Display Name`, `Product Type`, `Product Subtype`, `Seller Visible`, `Status`.
- Every `Supplier Rates` sheet has the same 21 columns. Allowed pricing bases:
  `Person`, `Boat`, `Vehicle`, `Equipment`, `Package`.

## Developer import requirements
- `Tour ID` and `Rate ID` are permanent identifiers. Display Name appears in seller search and customer contracts; supplier names remain distinct.
- High-level `Product Type`: **Tour, Activity, Transfer, Package**. More specific classification is in `Product Subtype` (Nightclub Ticket, Shared Boat, Private Boat, Jet Ski, Parasailing, Airport Transfer, etc.).
- `Rate Status=Manual Only` cannot be used for unattended auto-pricing; `Review Required` blocks it. Blank costs are **unknown/not applicable, not zero**.
- Select rates using service-date hotel zone, region, season, weekday, passenger quantity and approved overrides.
- Record supplier liabilities in native currency, maintain separate USD FX conversions, and snapshot all selected booking costs and display names.

## Jet Ski — explicitly approved quantity rule
- Seller selects **Jet ski 30min** or **Jet ski 60min**, then enters **passenger count**. The seller does not select equipment quantity.
- Maximum **2 passengers per jet ski**.
- **Number of jet skis = ceiling(passengers ÷ 2)**.
- Supplier costs: **USD 90 for 30min, USD 120 for 60min, per jet ski**.
- **Total supplier cost = number of jet skis × fixed cost per jet ski.**
- Example: 1–2 guests = 1 jet ski; 3–4 = 2; 5–6 = 3.
- Both Jet Ski supplier rate records use `Pricing Basis=Equipment`; `Fixed Cost` contains one ski price. Rate fields `Minimum Passengers=1`, `Maximum Passengers=2` define **capacity per equipment unit**, not booking limits.
- Where a different allocation is required, an authorized user must explicitly override the booking with an audit trail. Do not treat per-jet-ski prices as per-person prices.

## Dolphin Company — original base-cost input (supplemental transport v0.1.39 still applies)
- **17 approved base-cost products** are included. Columbus is excluded.
- **Round-trip transportation pricing IS included** as a separate, Admin-configurable ancillary table (see `Dolphin_Transportation/`); defaults ON, with rare booking-level Admin opt-out; 8 zones × three age categories. This is distinct from 80 original base Rate IDs.
- Other **unsupplied** dock fees/taxes/extras remain unknown. Base tour costs alone must never be called all-in.

## Coco Bongo
- Adults-only products, six customer-facing names, eleven weekday-specific net-cost rate records.
- Drink Pack Monday–Wednesday only at USD 64; Regular Sunday/Thursday separated at USD 75.
- Do not import public prices or recalculate commissions during booking: supplier net costs are already stored.

## Xcaret developer specification
- Shared reference workbook includes all eight hotel-zone-to-tariff mappings and six 2026 seasonal windows. Xcaret provider workbook includes 27 original supplier tariffs.
- The **2026 Xcaret annex, mapping and both source JPEG images are physically included** in this ZIP: `Xcaret_2026_Rules_And_Zone_Mapping.md`, `Xcaret_2026_Temporadas_y_Domingos.jpeg`, `Xcaret_Weekly_Operating_Days.jpeg`. Preserve their 2026 source facts. For 2027+ dates, Admin-configured yearly rules prevail; no copied 2026 calendar.
- Do not carry 2026 date restrictions to 2027+. Dates remain selectable; for existing High/Regular supplier rate alternatives, Admin chooses a provisional active rate or completes a focused cost selection, using currently stored costs. No automatic assumption of supplier operating confirmation.
- The Shared Reference worksheet contains three distinct Excel tables, each to be imported separately into the appropriate reference/policy layer.

## Scope boundaries
This package contains standardized supplier records and approved decision rules. It does **not** represent implementation of those rules in the application. Existing developer handoff ZIPs are unchanged.


## v0.1.38 incremental inputs (read current authority first)

Hotel source now included: `Hotel_Master/Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx` 1,125 `Hotel Name`/`Location` rows. Customer contract starter included at `../Contract_Template/Tio_Nene_Contract_Source_Template_UNSIGNED.docx`, with separate repeatable-block field spec; current original rates and all 11 workbooks unchanged. Old paragraph declaring no client template/hotel source applies to v0.1.37 historical release only. No real client signed examples included. Future-year Xcaret seller-date opening and supplier-cost defaults apply per `../07_v0.1.38_Owner_Approved_Changes.md`; do not carry 2026 season dates into 2027.


## Approved v0.1.39 Dolphin transportation addition (still current in v0.1.43)

**Owner supplied and approved Dolphin transportation rates.** Import `Dolphin_Transportation/Dolphin_Transport_Zone_Seed_USD.xlsx` into a *separate configurable transport ancillary-price table*, **not** into 52 original products / 80 original Rate IDs. Supplier raw original transport chart attached in same folder. Round trip ON by default, once per transported person, 8 mapped agency zones, adult/child/infant separate USD values, Admin override OFF for rare no-transport booking. Other unsupplied dock fees/taxes remain UNKNOWN and must not be invented. `09_v0.1.39_Owner_Approved_Decisions.md` is controlling. The original supplier source XLSXs and price values stay unchanged.

The prior historical line above saying Xcaret 2026 annex not included describes the standalone 2026-10-19 supplier export ONLY; the current combined v0.1.43 ZIP includes the annex and both JPEG images. Xcaret 2027+ provisional season is editable Admin setup and full calendar remains selectable pending confirmed year rules.

## v0.1.42 current-policy errata for immutable Shared Reference source

This section governs **implementation** without altering the original Shared Reference workbook or its original tariff facts:

- **REF-015, Shared Reference `E40` (Xcaret future-year Cost Required)** is superseded for **2027+**: seller dates are selectable, and use **current configured supplier rates** with Admin-selected provisional High/Regular where required. Do not infer 2027 season windows, 2026 operating restrictions or confirmed supplier availability. Unknown separate provider extras remain Cost Required, not fabricated.
- **REF-025, Shared Reference `E50` (`authorized admin/staff` override)** is permission-narrowed: **Admin only** may override supplier rates, payables, booking supplier status and credit/allocations. Ordinary Sellers cannot. Keep source wording as historical evidence, never implement broad Seller access from it.
- Data presence is **not proof of import into Rafael's application**. Seed idempotently, preserve original source Rate IDs, original source currency and original file hash.
- Passenger snapshots include adults, children **and infants**, separate from unknown infant base-admission price; supplier transport may have an independently known infant tariff.
