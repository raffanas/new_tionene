# Tío Nenê — Data and supplier import handoff (v0.1.43)

**This release DOES include the final standardized supplier source data.** The current initial seed has **10 provider XLSX workbooks, 52 seller-visible Tours, 80 Supplier Rates, plus one Shared Reference XLSX with eight zones, six 2026 seasonal windows and 28 rule rows**. The source workbooks are immutable/unaltered attachments, not screenshots, simulated data, or manually transcribed markdown. This is an approved initial seed, NOT the complete Tío Nenê catalog. The owner will sanitize/add future providers, tours and rules during operational use; developer must not wait for exhaustive supplier data.

## Read order / data authority

1. `Supplier_Import_Data_Dictionary.md` — exact 8 Tours / 21 Supplier Rates column schema; provider-dependent rate selectors and IDs; safe import and historical cost snapshot rules.
2. `Supplier_Source_Workbooks/*.xlsx` — numeric and naming authority. Ten provider spreadsheets have `Tours` and `Supplier Rates`; `Tio_Nene_Shared_Reference_Standardized.xlsx` has a single `Shared Reference` sheet with three separate tables.
3. `FINAL_MANIFEST.json` / `DEVELOPER_IMPORT_NOTES.md` — immutable ORIGINAL supplier export manifest/notes, retained for provenance and unchanged since supplier export. **It is NOT the current v0.1.40 whole-ZIP manifest**; use top-level `SHA256SUMS.txt` for every present package file.
4. `Xcaret_2026_Rules_And_Zone_Mapping.md` and two unchanged JPEGs — year-2026 tour date/zone/specific weekday and special Sunday availability policy, plus annual update reminder.
5. `Supplier_Catalog_and_Pricing_Decisions.md` — owner-approved prior vendor distinctions and how some v0.1.36 uncertainties were resolved in this data release.
6. `Supplier_Integration_QC.md` / `Supplier_Integration_QC.json` — data-only independent verification and outstanding implementation/release caveats.

## Import contract

Key on permanent Tour ID and Rate ID, **never supplier name or Display Name**. Load rate rows without coercing missing values to $0. Check rate eligibility by provider/tour/zone/season/weekday/status and unit basis; use central season/zone rules rather than duplicate references per tour. `PLY-R003` is intentionally manual only; Xcaret actual pickup decided separately later; provider accounts payable stored at native supplier currency with snapshot standard USD estimate and separate actual USD paid transaction. Product additions/edits managed by Admin inside application; reimport/reprice must not override an Admin edit or historical booking unless explicit reconciliation is approved.

The **unsigned client contract source template and final 1,125-hotel zone master are now physically present** in v0.1.38 (paths below); historical imported real client bookings are **not** included. The developer must inspect actual app/repo before coding database/auth changes. No provider full-coverage claim, child-age limit, supplier eligibility certification or unsupplied 2027 seasonal calendar/extras is implied by this source.


## Approved physical inputs (introduced in v0.1.38; remain included in v0.1.43)

- **Final hotel master now PRESENT:** `Hotel_Master/Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx`, 1,125 user-confirmed hotels, two columns, 8 zones. See `Hotel_Master/README.md`. Supersedes the older referenced unbundled 1,201-record file.
- **Unsigned contract source template now PRESENT:** `../Contract_Template/Tio_Nene_Contract_Source_Template_UNSIGNED.docx` and field map. The old template's fixed electronic-signature proof has been stripped. Four real client PDFs were consulted for source mapping but are EXCLUDED from package for privacy.
- **Approved overrides:** `../07_v0.1.38_Owner_Approved_Changes.md` and `../00_READ_FIRST_CURRENT_AUTHORITIES.md`.


## v0.1.39 — Dolphin supplemental transport seed (NOT new supplier Rate IDs)

`Dolphin_Transportation/Dolphin_Transport_Zone_Seed_USD.xlsx` is a standalone, editable 8-zone × Adult/Child/Infant USD tariff **configuration seed**, with supporting owner-provided original transport screenshot. It is **not part of** the original immutable 11 provider/shared-reference source workbooks and must **not change** 52/80 source totals. Source supplier MXN 150/200/250 per person at fixed planning 16.65; agency USD 9.01/12.01/15.02 round trip once per passenger. Dolphin transport defaults ON and is removable by Admin per reservation; Admin can modify age/category prices and zone mapping anytime. **Never assume southern pickup coverage merely from fallback pricing**; details and provenance in `../09_v0.1.39_Owner_Approved_Decisions.md`.

Standard provider reservation fields, future-year Xcaret pricing/year setup and manual upcoming arrival migration are **settled at owner-policy level** in latest source; do not implement old 'PENDING' wording as a gate.

**Current whole-ZIP manifest and QC:** `../SHA256SUMS.txt` and `../16_v0.1.43_Final_Consistency_Patch_and_Verification.md`; `FINAL_MANIFEST.json` is retained for the original supplier export ONLY.
