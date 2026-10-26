# START HERE — TÍO NENÊ PHASE 1 | DEVELOPER HANDOFF v0.1.43

**Issued:** 2026-10-21  | **Status:** OWNER REVIEW / WORKING DEVELOPER HANDOFF — **not a claim that the app is built or production-approved**.

## What this ZIP is — and what it is not

This v0.1.43 ZIP is the consolidated **business specification, approved decisions, realistic source data, sample unsigned contract template, operating policies and human-readable acceptance scenarios** for Tío Nenê Tours. Its purpose is to guide implementation of a **usable, manually recoverable** management application based on **the substantial amount of code the developer has already built**. Do not start by replacing the current app or treating these documents as evidence that the code works. Do not mistake historical unresolved questions for active business policy.

**Owner's top priorities:** (1) the app must be **super, super simple** to operate; (2) **Admin must be able to edit operational business data, fields, prices, statuses and bookings without code changes**; (3) **manual workflows must remain usable even when any automation is wrong or fails**; (4) for an edit affecting several fields/records, Admin chooses **none, any subset, or all** of the proposed updates and can leave values intentionally inconsistent; (5) silent changes must never overwrite manual corrections, old signed PDFs or actual cash movement history.

**Important distinction:** operational flexibility is not authorization to bypass authentication, reveal private data, reuse electronic signatures, forge cash receipts, erase real payments or break record identity. Financial corrections remain possible through traceable reversal/adjustment, not through destructive history edits.

## What to do FIRST — before changing the app

1. **Inspect the existing repository, DB, routes, auth/roles, current screens, deployment and environment.** Identify which functions already work, which are partial and which are missing. Do not infer from this ZIP that app behavior passed tests.
2. **Read these files in order:** `00_READ_FIRST_CURRENT_AUTHORITIES.md` → `11_v0.1.40_Usable_App_Manual_Override_and_Impact_Rules.md` → `02_Functional_Requirements.md` → `03_Data_Architecture_and_Rules.md` → `05_Acceptance_Scenarios.md`. Refer to `04_Decisions_and_Open_Questions.md` **confirmed DEC-001–021 plus its current §C boundaries**; old OQ/PENDING tables are archived under `History/`. Inspect `09_v0.1.39_Owner_Approved_Decisions.md` and `07_v0.1.38_Owner_Approved_Changes.md` for owner decision provenance.
3. **Inspect data instead of guessing:** `Data/Supplier_Source_Workbooks/` has all 11 ORIGINAL approved spreadsheets (10 suppliers + shared reference; **52 products, 80 original rates**), `Data/Hotel_Master/` has **1,125 hotels**, `Data/Dolphin_Transportation/` has separate eight-zone × adult/child/infant ROUND-TRIP transport costs, and `Data/Xcaret_2026_*` has the original 2026 calendars. Read `Data/Supplier_Import_Data_Dictionary.md` and `Data/DEVELOPER_IMPORT_NOTES.md` before importing. Supplier spreadsheets are immutable source evidence, not an invitation to edit historical tariffs.
4. **Inspect contract source:** `Contract_Template/Tio_Nene_Contract_Source_Template_UNSIGNED.docx` and `Contract_Generation_and_Field_Map.md`. Repeating hotels, tours and actual receipts are required. Current 18 Portuguese clauses are baseline text, legal rewording deferred; no reusable signed/hash footer.
5. **Use the existing implementation as the baseline and return a short evidence-based gap assessment**, using `12_v0.1.40_Developer_First_Return_and_Priorities.md`: implemented / partial / missing / conflict, what can be reused, blockers, expected migration approach, and first demonstrable end-to-end path. **Do this before writing large amounts of code.**

## What to BUILD and DEMONSTRATE first

**First usable vertical path:** seller creates multi-tour sale → previews and finalizes versioned contract PDF → one arrival is created (or Admin makes it manually if automation fails) → Admin can create/manage one or more supplier reservations, relevant payable costs, customer payment receipts and real supplier payments → customer wallet can be prepared/issued → clear gross-contribution/receivable/payable reports. Multi-hotel date selection and per-service adults/children/infants must work. Each crucial step must have a **manual fallback**.

**First override demonstration:** Admin edits a field with five consequences, sees all five with current → proposed values, chooses **0 / arbitrary subset / all**, explicitly decides whether a manually overridden supplier cost is changed, and saves even if some linked records diverge. Relevant items remain **Changed / Needs Attention** until dismissed. No actual cash transaction or earlier PDF is rewritten. Retrying failed automation must not duplicate records.

**Second pass:** broaden the declared dependency map and automated source mapping, add no-code field/schema settings, finish financial and security regression tests, polish reports and PDFs. Avoid postponing the basic selective-impact review entirely until late work.

## Interpretation and safety rules

- **Use latest active spec precedence in `00_READ_FIRST_CURRENT_AUTHORITIES.md`.** `11_*` defines the owner-approved central operating contract. Where ambiguous, list a concrete question in the gap assessment; preserve manual operability rather than guessing a new supplier rate or blocking all work.
- **Manual overrides are sticky.** A source edit does not automatically reapply a formula to manually corrected destinations. Every offered recalculation is optional and inspectable; Admin may expressly update a selected overridden field or switch it back to automation.
- **No forced cascades/reconciliation.** Only explicitly selected impacts are changed. Non-selected records stay as they are, with warnings/attention where material. Admin may modify confirmed, paid or out-of-sync operational records; actual cash history stays truthful and auditable.
- **Source-vs-actual distinction:** catalog rate vs booking cost snapshot vs effective payable vs native-currency supplier liability vs actual cash paid/allocated vs guest selling value are different concepts. A price edit does not mean a bank transfer occurred.
- **Privacy:** Seller and Admin are the two staff roles; supplier links disclose only one permitted reservation. Supplier-visible observations never expose private internal notes, CPF, guest payments, company financials or unrelated bookings. Custom fields are supplier-private by default until explicitly shared.
- **Treat unknowns as unknown**, not free, confirmed or zero. 2027 Xcaret dates are selectable, **not supplier-confirmed**; no copied 2026 restrictions, no guessed future-season dates; Admin chooses provisional current rate/season if needed.
- **Financial/payment corrections:** Sellers can add client receipts, but only Admin can correct/reverse/refund; preserve original receipts and write separate dated money-out/adjustment. Actual supplier payments/credits similarly retain money trail.
- **Interface:** normal operation should show few fields and simple statuses; put long audit/change logs behind **View History**, and show detailed impact choices only when they are relevant.

## Evidence, approval and scope

**Historical v0.1.41 package integrity:** `14_v0.1.41_Independent_Verification_and_Consistency_Report.md`. **v0.1.42 audit:** `15_v0.1.42_Independent_Validation_and_QC_Resolution.md`. **Current v0.1.43 ZIP/source verification:** `16_v0.1.43_Final_Consistency_Patch_and_Verification.md`. **The existing app has NOT been tested.** Do not describe the 52/80 spreadsheet import, 167+ written scenarios or this ZIP as passing application tests. Demonstrate security isolation, duplicate-safe retry, calculations, PDF output and actual persisted ledgers in a test environment before owner approves launch.

**Deferred, not launch blockers by themselves:** rewording the 18 Portuguese clauses; visual polish for wallet; in-app e-signature; WhatsApp sending automation; fully automatic Trello/Sheets/WhatsApp migration; every supplier-specific exceptional field; complex incident/cancellation administration; statutory accounting; catalog completeness beyond supplied rates. Manual entry of upcoming historical bookings is acceptable.

**Requested first return:** gap inventory + first usable milestone plan + identified true blockers and questions. The owner will review the real UI/PDF/financial output before final deployment approval. This ZIP does **not** authorize uncontrolled production import, security shortcuts, or user-data exposure.

**v0.1.43 cleanup note:** Prior v0.1.38/39/40 filenames in the package are deliberate decision/verification artifacts. Read `00_READ_FIRST_CURRENT_AUTHORITIES.md`, `CURRENT_STATUS.md` and `04_*` §C for live guidance. The original supplier source spreadsheets and 2026 images have not been modified.

## v0.1.42 audited corrections and v0.1.43 clarification — required reading before coding

Read `02_Functional_Requirements.md` §M and `05_Acceptance_Scenarios.md` §J for the 32 issue-resolution invariants; `03_Data_Architecture_and_Rules.md` §11 for cross-module record identity, financial integrity and privacy. Start with critical corrective tests QC1-001, QC5-002 and QC5-003. Original supplier XLSXs are immutable source evidence; the two Shared Reference instruction-cell errata are clarified in `Data/DEVELOPER_IMPORT_NOTES.md` without changing originals. This ZIP contains **specifications and example calculations, not proof that the partially built running app is correct**.
