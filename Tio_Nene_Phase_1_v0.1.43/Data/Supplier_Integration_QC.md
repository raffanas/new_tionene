# Supplier integration QC — Tío Nenê Phase 1 v0.1.37

**Review scope:** The verified owner-supplied source workbook bytes, interpreted through `artifact_tool`, cross-referenced to the v0.1.36 business specification and 2026 Xcaret annex. This report does not imply the web application has been coded, bank/provider API access exists, or actual data is imported into a database.

## Proven results

| Check | Result |
|---|---|
| Standardized provider files | **10** files, each with `Tours` (8 columns) and `Supplier Rates` (21 columns) |
| Shared reference | **1** workbook / **1** worksheet / **3** embedded reference tables |
| Total workbook/worksheet count | **11** workbooks / **21** worksheets |
| Seller-facing products | **52**, stable unique Tour IDs, all active/visible |
| Supplier rate rows | **80**, stable unique Rate IDs, zero orphan Tour IDs |
| Pricing bases | 70 Person / 5 Vehicle / 3 Boat / 2 Equipment |
| Currencies | 77 USD / 3 MXN rates |
| Rate statuses | 79 Active / 1 Manual Only (`PLY-R003`), no unknown auto-rate statuses |
| Hotel mappings / seasons / shared rules | 8 canonical zone rows / 6 year-2026 contiguous seasonal windows / 28 rules |
| Xcaret rate matching | **128/128** product×zone×applicable-season cases returned **one and only one source Rate ID**; 10 products, 27 Xcaret rates. |
| Original supplier file byte integrity | Every embedded XLSX sha256 matches owner-supplied `FINAL_MANIFEST.json`; supplier XLSX remains unaltered |
| Xcaret calendar images and rules | Both 2026 original JPEGs and owner-approved Xcaret annex bytes preserved from v0.1.36 |
| ZIP integrity | Every package member checksum and CRC checked after build |

## Resolved discrepancies / authoritative precedence

1. **Tours schema expanded:** v0.1.36 had seven Tours columns and no `Product Subtype`; final source has eight, preserving optional subtype. `Supplier Rates` has 21 defined columns and a fifth valid basis `Equipment`. Requirements and dictionary were updated.
2. **Envatours:** Earlier wording treated private boat cost basis as unknown; final approved source now explicitly confirms USD140/270/200 PER BOAT up to 10 guests for `ENV-R002/R004/R006`. A source rate's adult/child amount not used for fixed-boat units.
3. **Jet skis:** New approved `Equipment` basis, up to two riders per ski, group quantity `ceil(passengers/2)`, two priced rates USD90/USD120. Parasailing stays per person.
4. **Coco Bongo:** Six products, eleven weekday-specific adult net rates, no child tickets. Earlier unverified Regular Saturday rate is resolved as **unavailable**, not missing/zero; weekday eligibility is separate from general tour operating calendars.
5. **Dolphin:** Final 17 base-cost experiences, no Columbus or invented transport/dock/tax add-ons.
6. **Miguel:** five rate IDs, eight mapped hotel zones; source `MIG-R001` explicitly groups Downtown and Cancun Hotel Zone in a single $39 source tariff while retaining the earlier rule's same $39 default in both zones. No additional price reconciliation needed.
7. **Xcaret:** original owner-approved map and 2026 calendar remain governing; 128 possible zone×product×season combinations resolve to exact XLSX Rate IDs. Source Xcaret 27 rates are now present; no need to invent transport charges or new rates.
8. **Playa Mía:** exact source rate IDs match approved eight-zone Cancun/PDC mapping, preserved native MXN; third Cozumel departure remains `Manual Only`.
9. **Earlier 'source files pending' text:** outdated status was changed in major spec/front-matter locations to **source files now included**, while future provider tours/annual calendars/inclusion text remain legitimately incomplete.

## Important still-open implementation / external facts

- The attached input is an **incomplete tour offering list by owner choice**, intended as an editable initial seed, not an exhaustive all-supplier commercial catalog. Client inclusion/exclusion descriptions and final contract wording remain outside supplier-price workbooks.
- Year 2027+ Xcaret seasons and exceptions, non-supplied supplier effective dates and true child age cutoffs (outside explicitly adults-only Coco Bongo) cannot be invented.
- Some exceptional fares need quote/review: Miguel above 7 or hotel↔hotel, Envatours above one boat's 10-passenger capacity, owner-approved supplier tariff overrides, extra Dolphin charges and generic manual boats/yachts.
- Xcaret zone mappings are approved defaults, not physical pickup-eligibility certification; no provisional badge is required by owner.
- Customer refunds, protected contract revisions, partial supplier FX credit/refund subtleties, access controls, actual client contract template and executable code/base deployment remain separate WIP gaps.
- The supplier importer, booking engine, UI and financial report software **have not been executed** here. Price examples test the source logic mathematically, not the final application.

## Reconciliation gate for developer

A coding agent should first import the exact source XLSX into source-keyed master tables; implement provider-specific rate selection, amount computation, override audit and source snapshots; verify the updated `SC-113`–`SC-130` test cases alongside all 112 retained original tests; and inspect the existing deployed repository and its data/auth model before writing migrations. Do not use source-data success as proof of final business/legal signoff.


## v0.1.39 supplemental owner-provided Dolphin transport (separate from source QC)

The original 17 Dolphin base-cost products and 80 global supplier Rate IDs were frozen **before** owner later supplied a separate transportation chart. `Data/Dolphin_Transportation/Dolphin_Transport_Zone_Seed_USD.xlsx` and its source image now supply known ROUND-TRIP USD transport rates by canonical eight-zone map and adult/child/infant. They are **separate supplemental config**, not an edit to original source sheets; the phrase "no invented transport" remains accurate historically but does NOT mean all Dolphin transport is still unpriced. Other dock fees/taxes remain genuinely unknown. Admin can turn transport OFF per reservation or edit category/zone amounts.
