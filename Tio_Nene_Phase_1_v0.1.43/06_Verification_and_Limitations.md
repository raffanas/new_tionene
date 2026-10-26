# 06 — v0.1.43 Verification and Limitations (CURRENT)

**2026-10-21 · DOCUMENT/SOURCE CONSISTENCY CLEANUP — NOT AN APP TEST.**

For machine-verifiable final file counts, unchanged source hashes, source workbook checks, document consistency changes and known limitations, read `16_v0.1.43_Final_Consistency_Patch_and_Verification.md` and `SHA256SUMS.txt`. The v0.1.42 independent Phase 7 report (`15_v0.1.42_Independent_Validation_and_QC_Resolution.md`) and v0.1.41 historical report (`14_v0.1.41_Independent_Verification_and_Consistency_Report.md`) remain available for provenance.

## What the package verification establishes

- The finalized ZIP opens, CRC passes and every manifest file hash matches its packaged bytes.
- Original 11 supplier/reference XLSX files and six other approved binary input assets remain **byte-for-byte identical to v0.1.40**. Supplier price/zone/season rules and original 2026 Xcaret images were not amended.
- Source-backed consistency checks cover the 52 seller-facing products / 80 original rate identities, 128/128 2026 Xcaret rate joins, hotel master 1,125 records / eight zones, 24 Dolphin transport age-zone prices, and 18-clause unsigned contract template.
- Requirement IDs and acceptance scenario headings can be enumerated and checked; these are **written test definitions, not passing software tests**.
- Active instructions are clearly separated from legacy revision notes and formerly open decision tables. Current-business policy is not inferred from archival 'PENDING' lines.

## What the verification does NOT establish

- Actual codebase, DB migrations, authenticated roles, cross-record update engine, PDF generation and true UAT are **not examined**; supplier-link security and financial recording must be tested by Rafael in the running app.
- Neither Xcaret nor Dolphin supplied 2027 calendar/season/pickup certification, nor an exhaustive supplier/guest tour catalog. Incomplete source costs stay unknown rather than becoming zero.
- Approval or legal enforceability of the 18 Portuguese clauses, electronic signatures or privacy-law compliance was **not certified**.
- Manual future-arrival migration from Trello, Sheets and WhatsApp has **not occurred**. Financial simulation samples are not real bank/ledger tests.
- Owner approval for production go-live has **not occurred**.

## First developer action

Read `00_START_HERE_DEVELOPER_HANDOFF.md`, inspect the current substantial app, map implemented/partial/missing features against active requirements, then build and demonstrate the manually recoverable contract → arrival → supplier reservation/payable → customer and supplier cash → wallet → reports slice. Verify selective (none / subset / all) impact application and permission/security boundaries. The old full release/verification history is preserved in `History/Pre_v0.1.41_06_Verification_and_Limitations.md` but is not the current state.
