# v0.1.41 — Documentation Consistency and Source Preservation

**2026-10-21 · WORKING DEVELOPER HANDOFF.** Created from actual verified v0.1.40 package, without altering original XLSX, JPEG, PNG or DOCX source assets.

- Current `README.md`, `CURRENT_STATUS.md` and `06_Verification_and_Limitations.md` now consistently identify **v0.1.41** and point to the correct final QC report.
- Removed obsolete active-looking status and OQ/PENDING tables from the live read path; their exact prior full text remains inside `History/` for audit. The numbered confirmed architectural decisions DEC-001–DEC-021 remain in the live `04_*` document.
- Corrected live minimum rules: seller can log repeat customer receipts; Admin controls corrections/refunds and supplier reservations; contract revisions never force reconciliation; changes offer zero/any subset/all propagation and protect manual overrides; per-service infant counts; yacht ancillary transport only when specifically configured; Xcaret future-year rate/calendar configuration; approved Dolphin round-trip pricing.
- Historical v0.1.38, v0.1.39 and v0.1.40 report filenames are intentionally retained and explicitly labeled; `11_v0.1.40_*` is STILL CURRENT for core operational architecture despite its original creation version.
- Kept **196 requirement IDs and SC-001–SC-183** stable. No new pricing facts, legal amendments or supplier rates introduced. Later catalog/provider sanitation is expected and NOT a build gate.
- Source and package verification is recorded in `14_v0.1.41_Independent_Verification_and_Consistency_Report.md`; application code/security/UAT still require developer proof.
