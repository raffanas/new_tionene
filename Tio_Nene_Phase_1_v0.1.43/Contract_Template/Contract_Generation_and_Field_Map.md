# Contract template — generation mapping and security rules (v0.1.38)

**Physical input:** `Tio_Nene_Contract_Source_Template_UNSIGNED.docx` reproduces owner-provided **current** Portuguese service contract layout and 18 clauses but **removes fixed signature-validation footer evidence**. This starter is not a final automation-engine implementation. Developer may use a different DOCX/PDF renderer if it preserves the business content and secure output. Admin must later be able to edit reusable clauses, labels and structured fields through the app.

## Single-value placeholders in source DOCX

| Source token | Meaning / authoritative source | Rule |
|---|---|---|
| `{{date_sold}}` | Contract version issue/finalize date | Fixed on generated version, never recomputed from viewing time |
| `{{who_sold_it}}` | Seller user display name | Stored at finalized version |
| `{{client_name}}`, `{{cpf}}`, `{{phone_number}}`, `{{email}}` | Customer-entered data | PII in protected file storage; supplier link MUST NOT receive CPF/email by default |
| `{{pax}}` | Overall party summary | Not a substitute for per-service adult/child/infant counts |
| `{{arrival_flight_number}}`, `{{arrival_flight_time}}`, `{{arrival_flight_date}}` | Inbound flight | Required for **purchased inbound agency transfer** when known per prior `TRF-*` rules; otherwise optional/omit if unavailable |
| `{{depart_flight_number}}`, `{{depart_flight_time}}`, `{{depart_flight_date}}` | Outbound flight | Corresponding bought outbound leg; no invented unknowns |
| `{{total_contract_value}}` | **Total USD customer sale after global discount** | Do not show internal individual tour line prices or original private line amount |
| `{{client_signer_name}}`, `{{company_legal_name}}`, `{{company_representative_name}}` | Signature labels | Unsigned signature lines only; no old hash/QR/reused validation |

## Repeatable structures (do NOT interpret template's one row as a system limit)

1. **HOTEL_STAYS[]:** repeat `{{hotel_name}}`, `{{hotel_checkin}}`, `{{hotel_checkout}}` for each date-bounded hotel. Name selected from approved master or free-typed exception. Dated master zone used internally for provider pricing; **agency zone is not a customer-facing hotel label**.
2. **ITINERARY_ITEMS[]:** show date-ordered arrival (with/without agency transfer), each purchased tour/service (may be multiple on one date), and departure (with/without agency transfer). Tour items bind `{{tour_date}}`, `{{tour_name}}` (`Display Name` or approved per-contract custom label), required per-service adult/child/infant counts (seller entry; unknown infant cost is NOT automatically free), `{{tour_included}}` and `{{tour_not_included}}` **only where real owner-entered content exists**. The template line is a *repeatable block*, not a single global `tour_date`.
3. **CUSTOMER_PAYMENT_SUMMARY:** existing DOCX shows fixed `{{deposit_amount}}` / `{{deposit_observation}}`, `{{pay_in_cancun}}` / `{{saldo_observation}}` and `{{total_contract_value}}`. These fields serve as a **visual example only**: actual payment ledger supports any number of installments, including no deposit, multiple deposits, late logging, occasional BRL tender credited once in USD, and Admin-only refunds. Rendering must distinguish **contract agreed payment terms**, **already received payments** and **outstanding amount**. Snapshot truth as at contract issue; do not assume manually noted intended deposit was actually paid. Omit bank-internal/commission notes from guest PDF.
4. **LEGAL_CLAUSES[]:** initial content is the 18 Portuguese owner current clauses in the DOCX, stored with template/version. Do not rewrite legal clauses based on inferred best practice; future Admin edits take effect only for newly generated versions.
5. **SIGNATURES:** blank customer/company line on unsigned PDFs. A later *uploaded signed contract* is stored with exact contract version; do not invent e-sign proof or show fixed past `valida.ae` validation URL.

## Preflight and version behavior

- Seller may preview/export draft without Finalize Sale; only explicit Finalize Sale initializes arrival/reservations once. Revision finalization is seller-allowed regardless of protected downstream records; mark **Changed / Needs Attention** and retain previous signed/issued PDF.
- All generated PDFs require: date/currency formatting; pagination of many tour/hotel/payment rows; no orphan clauses/signature/empty row in the layout; no fabricated includes/excludes; verified Portuguese text glyphs/accents; clear missing-field handling. Saved PDF must be access controlled and associated with issue version, original source seller and generation timestamp.
- Do not show actual amount of individual private tour selling lines, supplier rates, commissions, internal notes or unrelated customer financial records.
- No real customer PDF, electronic signing QR/hash, or signed sample is included in developer ZIP. The layout is an indicative starter only; actual rendering must pass UAT against the real sample patterns.
