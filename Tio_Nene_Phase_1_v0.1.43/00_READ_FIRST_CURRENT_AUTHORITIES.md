# TÍO NENÊ — CURRENT SOURCES OF TRUTH (v0.1.43)

**2026-10-21 · CLEANED WORKING DEVELOPER HANDOFF SPECIFICATION · owner production/launch approval pending.** v0.1.40 and earlier ZIP archives are preserved independently. This ZIP changes docs/test specs, not executable app code or source supplier XLSXs.

## How to read this ZIP (current priority order)

1. **`00_START_HERE_DEVELOPER_HANDOFF.md`** — overall task and first developer response.
2. **`11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md`** — most recent owner-approved architectural rule. Controls **0-to-all selective impacts**, sticky manual values, nonblocking inconsistency, seller revision behavior and manual-fallback capability. Explicitly supersedes contrary lines in older OQ/requirements history.
3. **`02_Functional_Requirements.md` §M + `03_Data_Architecture_and_Rules.md` §11 + `05_Acceptance_Scenarios.md` §J, alongside all earlier active sections** — active requirements, data behavior and test cases **including v0.1.42 consistency corrections and v0.1.43 direct clarifications**. Older numbered test cases retain their original history; v0.1.42 live rules and current `11_*` govern any apparent conflict.
4. **`09_v0.1.39_Owner_Approved_Decisions.md` and `07_v0.1.38_Owner_Approved_Changes.md`** — provenance of most recent supplier transport/booking, 2027 calendar, contract, payment and permissions decisions.
5. **Supplier data originals:** all **11 unchanged** XLSXs in `Data/Supplier_Source_Workbooks/` (10 provider + shared reference, **52 seller-visible Tour IDs / 80 supplier Rate IDs**). `Data/Supplier_Import_Data_Dictionary.md` and `Data/Supplier_Integration_QC.md` explain formats; raw Rate IDs and commercial rate facts outrank casual prose examples. Never mix a standalone Dolphin transport charge into original 80 base Rate IDs.
6. **2026 Xcaret sources:** immutable 2026 provider XLSX plus `Data/Xcaret_2026_Rules_And_Zone_Mapping.md` and two source JPEG images. These define **2026** only, NOT 2027+ restrictions.
7. **Hotel input:** original approved `Data/Hotel_Master/Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx`, two columns and **1,125 rows / 8 agency zones**; date-effective hotel sets provider-specific tariff selection, exceptions editable.
8. **Contract input:** `Contract_Template/Tio_Nene_Contract_Source_Template_UNSIGNED.docx` and field mapping; preserves current 18 Portuguese clauses with no reusable e-sign token/hash. Customer PDFs must support repeated hotels/tours/payments; signed files stored as separate immutable version attachments.
9. **Current decision register/status:** `04_Decisions_and_Open_Questions.md` retains DEC-001–021 and has a CLEAN current §C open-boundary table; `CURRENT_STATUS.md` is now current v0.1.43 only. **Historic evidence:** `History/` contains verbatim old status, original old OQ/PEND tables and prior README notes; files explicitly named v0.1.38/39/40 preserve provenance. Never revive historical PENDING entries.
10. **This checkpoint verification:** `16_v0.1.43_Final_Consistency_Patch_and_Verification.md` and `06_Verification_and_Limitations.md`. The prior `15_v0.1.42_Independent_Validation_and_QC_Resolution.md` retains the 32-item independent QC baseline. The old `13_v0.1.40_*` report remains historical evidence, **not the v0.1.42 verification report**.

## Current status / prioritized tracker

| Scope | State |
|---|---|
| Original supplier data, 2026 Xcaret mapping, 1,125 hotels, unsigned 18-clause contract | **DONE — packaged; application import still to be tested** |
| Dolphin 8-zone roundtrip, Admin supplier reservation core fields/private notes, future Xcaret config, manual migration policy | **DONE — owner decisions and source seed; implementation unverified** |
| Selective 0-to-all Admin update control, sticky overrides, manual fallbacks and sparse UX | **P0 — owner-approved and specified; developer to implement/validate** |
| Existing partially-built app gap inventory, security, working money ledger, generated PDFs, actual wallet and reports | **P0 — developer first return + running-app UAT required** |
| Per-service infant sell counts and unknown infant base-price handling; owner-entered inclusions/exclusions | **P1 — consistency integration/manual content to complete** |
| Wallet layout, revised Portuguese legal terms, built-in e-signing, auto WhatsApp delivery, auto legacy migration | **DEFERRED** |

**Critical limitations:** A file/hash/source QC proves document integrity only—not actual implementation, live supplier eligibility, legal validity, privacy protection, accounting correctness or production readiness. Missing prices/extras remain **unknown**, never `0` by default. Admin may amend business values without enforcing reconciliation, but real cash history and signed PDFs remain immutable/auditable.

**v0.1.42 correction record (still active; v0.1.43 closes three follow-up wording gaps):** `Audit/v0.1.41_Phase_06_Original_32_Findings.md` is preserved as **historical issue evidence, not active implementation policy**. Each QC item’s current corrective rule is in `02` §M, regression test in `05` §J and final disposition in `15_v0.1.42_Independent_Validation_and_QC_Resolution.md`. Original data XLSXs are unchanged; 2027/role source-cell errata live in `Data/DEVELOPER_IMPORT_NOTES.md`.

**v0.1.43 final consistency checkpoint:** Read `BUILD_CHANGELOG_v0.1.43.md` and `16_v0.1.43_Final_Consistency_Patch_and_Verification.md` for the three directly corrected live-text conflicts. Previous QC42 findings remain binding; only currently unambiguous wording should guide implementation.
