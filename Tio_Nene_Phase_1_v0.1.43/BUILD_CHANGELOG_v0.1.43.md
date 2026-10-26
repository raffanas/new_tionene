# BUILD CHANGELOG — v0.1.43 (2026-10-21)

**Scope:** Three owner-requested final consistency corrections after the v0.1.42 review. This is documentation/test-specification cleanup, not app implementation or new business policy. v0.1.42 and the 32-item historical QC record remain intact outside this ZIP.

1. **Supplier confirmation semantics.** Replaced conflicting live `RES-003`/`RES-006`, architecture point 10 and original `SC-008` (rather than layering another override): Save Details never confirms; only explicit provider `Confirm Booking` can confirm after scope/version checks. `Staff Reviewed` is independent and unchanged. Stale forms are protected.
2. **Admin-only supplier operations.** Clarified ambiguous `staff`/`authorized staff` text in active README, requirements, architecture and early tests where it concerned supplier bookings, rates, payables, supplier payment allocations/credits/refunds and wallets. This does not remove Seller's approved ability to manage contracts and add/view customer receipts, or a supplier's scoped ability to confirm their own booking.
3. **Current references.** Updated live release headers, version labels, source-of-truth read order and QC pointers to v0.1.43; retained dated historical filenames and original binary source names intentionally. Added this changelog and a current verification note.

**Protected sources:** Original supplier/reference XLSX, hotel XLSX, Dolphin transport XLSX/PNG, Xcaret source JPEGs and unsigned contract DOCX are byte-identical to v0.1.42. No original source workbook or historical report was altered.

**Status:** Ready for developer specification handoff, subject to genuine codebase inspection, permissions/security checks, PDF tests, data import and owner production sign-off.
