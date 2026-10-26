# 05 — Acceptance scenarios and regression contract

**Version:** 0.1.43 · **Status:** WIP test-design baseline. These are human-readable business scenarios, not executable test code. Early-stage scenario names, dates and example prices are illustrative unless explicitly identified as **source-backed** in `SC-113`–`SC-151`; newer source-specific rates must match original XLSX files and new financial examples are hypothetical cases, not operating ledgers. Keep status **CONFIRMED** separate from **PENDING RULE** and **DESIGN GUARDRAIL**. Do not mark a pending scenario as approved merely because a developer finds one implementation convenient.

## Test principles

- A created **sale** is not proof of a supplier **reservation**, and a created supplier booking record is not proof of a supplier **confirmation**.
- Test UI behavior **and database integrity**: links, original contract versions, independent edits, no duplicate financial rows, no contamination of master records.
- Verify at least one normal and one exception path for each main module.
- Each test should eventually map to automation where practical; mobile/WhatsApp/PDF legibility requires human review too.
- A dollar amount in this document is a fabricated test fixture, **not a real supplier quote**.

## A. Contracts and initialization

### SC-001 — Save and resume draft (CONFIRMED)

**Given** a seller enters John's name, CPF, arrival, hotel, three tours and prices, **when** seller saves a draft and returns later, **then** all draft values remain editable. **Assert:** no active arrival, provider link, individual reservation, provider payable, operational action or wallet was generated (`CON-006`).

### SC-002 — Finalize exactly once (CONFIRMED)

**Given** John's draft has three sold tours, **when** the seller deliberately clicks **Finalize Sale** and downloads the PDF multiple times, **then** exactly one arrival is linked to that sale, with corresponding tour records and planned provider costs. **Assert:** PDF download/retry cannot create duplicate arrivals, reservations or payables (`CON-007`, `PAY-001`, `DEC-009`).

### SC-003 — Seller-specific negotiated prices remain private (CONFIRMED)

**Given** John is quoted $150 for a Baktun tour and Maria $130 for that same standard catalog tour, **when** each contract is issued, **then** each sold line retains its own internal revenue figure, and master tour/cost reference remains unchanged. **Assert:** neither client's contract PDF lists that individual tour-line selling amount; total client-agreed financial terms are permitted (`CON-005`).

### SC-004 — Versioned contract revision without data destruction (CONFIRMED; Admin selective impact review)

**Given** a finalized John's V1 has three unconfirmed/untouched tour records, **when** seller replaces one tour and generates V2, **then** V1 PDF remains available, V2 is associated with same sale/arrival and straightforward new/removed lines are reconciled. **Assert:** no second arrival and no wholesale deletion/recreation of unrelated records. If a changed service was paid, confirmed or manually edited, it is protected and flagged for operational review (`CON-008`–`009`, `OQ-02`).

### SC-005 — Multiple dated accommodations and free-text exception (CONFIRMED)

**Given** John stays at Hotel A December 10–13 and a rented apartment December 13–17, **when** seller creates contract, **then** both stays and their dates can be stored; Hotel A comes from search catalog and apartment can be entered manually. **Assert:** a missing hotel must not prevent capturing a genuine stay (`CON-003`). Tour-to-hotel pickup defaults and per-reservation overrides are confirmed (`RES-020`); ambiguous move-day or missing-stay cases remain `OQ-07`.

### SC-006 — Unknown/custom tour is still bookable (CONFIRMED)

**Given** seller cannot find a bespoke excursion, **when** seller enters its name as free-text in contract and finalizes, **then** arrival contains a manageable service record. **Assert:** it isn't discarded for lack of catalog ID; Admin can subsequently supply provider/cost details. Missing supplier/cost must not be invented (`CON-004`, `RES-010`).

### SC-007 — Seller permissions (CONFIRMED Seller/Admin minimum matrix)

**Given** a seller-role user, **when** they create/save/revise a contract, including one originated by another seller, **then** this is permitted, while company-wide financial reporting, every supplier ledger and global bookings are **not automatically granted**. Only Seller and Admin staff roles exist in Phase 1. Sellers also add/view customer receipts, but only Admin corrects/reverses/refunds; Admin controls supplier reservations, payable ledgers and sensitive financial administration. Enforce this role matrix in backend routes and UI (`SEC-001`, `REC-*`, `DEC-011`, current `04_*` §C).

## B. Supplier booking, ancillary reservations and review

### SC-008 — Provider uses unique booking link (CONFIRMED baseline)

**Given** John has an unconfirmed Chichén Itzá booking, **when** the correct provider uses the individual link to **Save Details**, **then** only the entered fields on John's booking change; its booking status remains unconfirmed and **Staff Reviewed** remains unchecked. **When** that provider separately chooses **Confirm Booking** against the current booking version, **then** exactly John's booking becomes **Confirmed**, without requiring a universal pickup/code field. **Assert:** no other booking changes, stale provider forms cannot overwrite later Admin edits, repeat submissions are idempotent, and the link remains optional (`DEC-012`, `RES-002`–`006`, `QC42-022`, `QC42-024`).

### SC-009 — WhatsApp confirmation without supplier link or code (CONFIRMED)

**Given** yacht provider agrees by WhatsApp, with no confirmation code/pickup time/location, **when** Admin marks the yacht booking confirmed, **then** it can be confirmed without dummy data and without supplier using the link. **Assert:** review state remains independently editable (`RES-004`–`006`).

### SC-010 — Staff manually changes provider-approved date (CONFIRMED)

**Given** Baktun confirms December 12 but later messages staff to move yacht/tour to December 13 keeping the same code/pickup details, **when** Admin edits the booking date to December 13 and retains “confirmed,” **then** date changes locally; unchanged booking fields remain. **Assert:** a new link is not compulsory, original contract/master data unchanged, and Admin can select related updates; an internally proposed date must **not** be presented as supplier-confirmed without approval (`DEC-001`, `RES-004`, `RES-008`).

### SC-011 — Manual yacht transport as included service (CONFIRMED)

**Given** John's sale contains one “Private yacht with transportation” sold line, **when** operations opens his arrival and manually adds hotel→marina transfer with a different supplier, **then** a separate transport booking/link and associated provider payable are created. **Assert:** customer contract remains one sold yacht line; no extra selling charge; yacht supplier does not need to supply transfer pickup details (`ARR-003`, `RES-009`, `PAY-006`).

### SC-012 — Two services have separate confirmation and staff review (CONFIRMED)

**Given** yacht confirmed and transfer pending, **when** Admin inspects John's arrival, **then** both booking states are visible, and a staff-reviewed indicator is separate from confirmation. **Assert:** completing yacht doesn't automatically confirm transportation; staff review is not a universal blocking gate (`RES-006`, `OPS-004`).

### SC-013 — Cancel/replace booking after supplier has confirmed (CONFIRMED manual correction; exotic fees deferred)

**Given** a provider has confirmed but service is canceled or moved, **when** Admin amends, **then** old booking/provider payment must not be destructively wiped and the downstream effects must follow the owner's eventual cancellation/sync decision. **Do not implement a guessed refund/liability effect** (`OQ-02`, `OQ-20`).

### SC-014 — Added service without booking in catalog (CONFIRMED)

**Given** an unlisted provider is hired for a small extra transport, **when** operations manually creates the service in an arrival, **then** a new operational record can exist and Admin can supply provider/cost. **Assert:** no forced master catalog update or source contract rewrite (`RES-009`–`010`).

## C. Zone and cost overrides

### SC-015 — Same hotel, supplier-specific billing zone (CONFIRMED)

**Given** agency hotel master says “Cancún Hotel Zone” and transport provider B's specific reservation is billed as “Cancún Center,” **when** operations overrides *this booking's provider tariff zone*, **then** the master zone and unrelated provider A's reservation stay unchanged. If the supplier's Cancun Center tariff exists, the booking can use it to propose a revised cost; otherwise staff enters cost manually (`TRF-002`–`003`).

### SC-016 — Change only cost, leave zone unchanged (CONFIRMED)

**Given** default provider cost $30, **when** operations sets only this booking's supplier cost to $25, **then** tariff zone, hotel master, source tariff, original contract and other customer bookings remain unchanged. **Assert:** ledger change is optional/selectable, never a silent overwrite (`TRF-004`).

### SC-017 — Provider ledger local override persists (CONFIRMED)

**Given** John's initial planned provider row cost $120, **when** Admin changes that row's effective payable amount to $135, **then** the supplier balance/reporting use $135. **Assert:** contract, booking cost (unless separately edited), tour master price and other supplier rows remain unaffected (`PAY-003`).

### SC-018 — Manual override not overwritten by later sync (CONFIRMED safety and approved selective review; visual polish UAT)

**Given** ledger row has been manually set to $135, **when** related booking is changed and its suggested cost becomes $125, **then** system must **not silently overwrite $135**. **Assert:** both values remain discernible and user choice/conflict policy is enforced once `OQ-16` is approved.

## D. Payments and reporting

### SC-019 — Planned supplier liability visibility before booking (CONFIRMED)

**Given** John finalized Chichén Itzá with supplier cost estimate $100 and provider has not been contacted, **when** Baktun ledger is opened, **then** John's row is present as **planned**. **Assert:** provider isn't falsely shown as confirmed/paid; once booking progresses, the same financial relationship is updated, not an extra duplicate row (`PAY-001`, `PAY-007`).

### SC-020 — Paid and outstanding supplier balance (CONFIRMED baseline)

**Given** four supplier charges, **when** Admin marks two paid, **then** the paid/outstanding totals change and the other two stay unpaid. **Assert:** row independence. Partial and bulk payments remain `OQ-19` (`PAY-004`).

### SC-021 — Manual emergency Uber expense (CONFIRMED)

**Given** client misses pickup and agency spends $25 on Uber, **when** operations records an expense in Provider Payments with one-off payee “Uber” without a reservation, **then** it appears in period reports and may optionally be attached to John's arrival. **Assert:** master provider/tour catalog and John's contract do not acquire a new charged tour (`PAY-005`, `FIN-004`).

### SC-022 — Quick client cash/transfer installment (CONFIRMED)

**Given** John has a finalized contract and already paid a deposit, **when** an authorized user uses quick “Record payment,” searches `John`, selects the correct John Doe contract, enters $100 by bank transfer, received date and note, **then** John's receipt history and outstanding balance reflect the installment. **Assert:** name matches are not automatically allocated without selection; no bank sync is claimed (`REC-001`–`003`).

### SC-023 — Select planned/confirmed/paid report measures (CONFIRMED)

**Given** multiple supplier entries in mixed planning/booking/payment states, **when** owner views a month, switches to planned, confirmed, paid or a combination, **then** the figures are correctly labeled and a single supplier row is not counted twice as an expense. **Assert:** date/provider filters and manually entered supplier expenses are recognized (`FIN-003`–`004`).

### SC-024 — Provider margin uses net discount-allocated sold-line revenue (CONFIRMED ordinary discount case; complex bundles deferred)

**Given** John sold a Baktun tour for $150 with no overall contract discount and the effective Baktun cost is $100, **when** reporting attributes revenue to that tour, **then** the inputs support a $50 illustrative *gross contribution* before other allocations/costs. **If** a confirmed contract-wide discount applies, provider-level revenue must instead use **net proportionally allocated sales** (`FIN-006`, `SC-058`, `SC-059`). **Assert:** do not falsely declare exact full group/contract profit while other bundle costs, FX, refunds or taxes remain unresolved (`FIN-002`, `FIN-005`, `OQ-22`–`24`).

## E. Digital wallet, operations and catalog maintenance

### SC-025 — Wallet can diverge intentionally (CONFIRMED)

**Given** John's operational pickup detail is 7:00, **when** staff independently edit wallet presentation to 8:00 for a legitimate reason, **then** internal booking, contract and provider payable do not automatically change. **Assert:** no claim that supplier independently agreed to 8:00. Mismatch warning design is `OQ-17` (`WAL-005`).

### SC-026 — Export incomplete wallet with honest status (CONFIRMED)

**Given** John has four purchased tours and only three provider-confirmed, **when** Admin generates wallet PDF, **then** the fourth clearly shows pending, an incomplete-itinerary warning appears and Admin can proceed to PDF. **Assert:** PDF exists despite missing pickup/code and no pending tour is relabeled confirmed (`WAL-004`).

### SC-027 — Revised wallet PDF doesn't rewrite old shared copy (CONFIRMED)

**Given** wallet PDF V1 was shared in John's WhatsApp group and wallet data is later edited, **when** staff generates another PDF, **then** updated snapshot reflects changes; previously distributed file is not silently modified and sending replacement remains a manual step (`WAL-003`).

### SC-028 — Arrivals and today/tomorrow board (CONFIRMED)

**Given** client A arrives next week, client B is already in town and tours tomorrow, **when** operations checks dashboard, **then** arrival list and today/tomorrow service list expose respective records irrespective of arrival already having occurred (`OPS-001`, `OPS-003`).

### SC-029 — Automatic outstanding-work detection (CONFIRMED)

**Given** John arrives soon with two confirmed tours and one not sent to provider, **when** dashboard Action Required is displayed, **then** unsent booking is flagged and urgency considers arrival and service date without manual task creation. **Assert:** exact notification threshold isn't fabricated (`OPS-002`–`003`).

### SC-030 — Catalog edit cannot retroactively reprice John (CONFIRMED)

**Given** John finalized a $100-cost tour and later tour admin changes master standard cost to $115, **when** operator opens John's issued contract, booking and payable, **then** the historical sale/plan data remain unchanged unless an explicit authorized update is applied. **Assert:** new contracts can use new catalog value (`CAT-004`, `CAT-006`).

### SC-031 — Initial incomplete catalog is acceptable (CONFIRMED)

**Given** seed spreadsheet doesn't include a special new tour or hotel, **when** seller makes the sale, **then** free-text entry permits the contract; operations can resolve structured details later. **Assert:** don't invent metadata for missing source rows (`CAT-005`, `CON-003`–`004`).

### SC-032 — Supplier-specific master hotel mapping is not compulsory (CONFIRMED)

**Given** a curated agency hotel list with one zone per property and no per-provider mapping table, **when** seller selects a hotel, **then** default transfer selection can still proceed from standard zone and available tariffs. **Assert:** operations can override tariff zone/cost per booking; absence of the matrix must not block deployment of the confirmed default/manual path (`DEC-008`).

### SC-033 — Finalize Sale is distinct from signing and allows later changes (CONFIRMED)

**Given** a draft contract is ready and a seller has generated a preview PDF but the client has not yet returned a signature, **when** the seller chooses **Finalize Sale**, **then** the sale becomes operational once and one arrival, linked reservations and planned provider costs are created without requiring a signed PDF. **Assert:** preview alone did not create downstream records; subsequent client request to change a tour creates a preserved contract revision and a separate Admin-selected none/subset/all impact review rather than forced downstream reconciliation (`DEC-002`, `DEC-009`, `CON-007`–`009`). Details of legally binding signature handling remain open (`OQ-03`).

### SC-034 — Signed contract upload is separate and version-specific (CONFIRMED)

**Given** a seller has finalized John's V1 contract and its operational arrivals, bookings and planned payables already exist, **when** John returns his signed contract and the seller uploads it to V1, **then** the file is retained and viewable on V1 without creating or changing operational records. **And when** the seller later issues V2, **then** V1 and its returned signed attachment remain available rather than being erased or automatically treated as V2's signature. **Assert:** upload is not a finalization trigger, signing authenticity is not automatically certified, and no e-signature product is implied (`DEC-010`, `CON-011`, `OQ-03`).

### SC-035 — Sellers share contract view and revision; other back-office access stays restricted (CONFIRMED)

**Given** Seller A creates John's finalized contract V1, **when** Seller B signs in and searches for John, **then** Seller B can view that contract and revise it as a preserved V2, without creating another arrival or destroying V1. **And** Seller B is not thereby entitled to company-wide financial reports, supplier cost ledgers or unrestricted operational tools. **Assert:** both users have the Seller role (not a special third role), with protected operational/finance access still subject to approved permission rules (`DEC-011`, `SEC-001`, `CON-008`–`010`, `OQ-28`).

### SC-036 — Downstream work exists without provider confirmation (CONFIRMED)

**Given** John's contract is finalized but Baktun has not been contacted and its booking is unconfirmed and unreviewed, **when** operations opens the arrival, Baktun provider ledger, reports and client wallet, **then** the operational booking, planned payable and applicable projected financial figures exist, and the wallet can be generated/exported with the booking clearly pending and an incomplete-itinerary warning. **Assert:** no supplier confirmation or staff review is required to enable any of those actions; confirmed/paid amounts are not fabricated (`DEC-012`, `PAY-001`, `FIN-003`, `WAL-004`, `RES-012`).

### SC-037 — Provider form submission never approves staff review (CONFIRMED)

**Given** an unconfirmed provider reservation, **when** its provider submits **Save Details** using a valid booking link, **then** confirmation status stays unchanged and Staff Reviewed remains unchecked. **When** the provider explicitly selects **Confirm Booking** on its valid current-version link, **then** that specific booking becomes **Confirmed** but remains **Not Staff Reviewed** until an Admin review action. **Assert:** no mandatory pickup/time/code fields and no system-imposed staff review gate are inferred (`DEC-012`, `RES-003`, `RES-006`).

### SC-038 — Booking status vocabulary and separate staff review (CONFIRMED)

**Given** staff inspect an individual booking or an arrival roll-up, **when** they inspect provider booking status, **then** the available booking-state labels are **Not Requested**, **Awaiting Confirmation**, **Confirmed**, **Unable to Confirm**, and **Cancelled**. **Assert:** the separate Staff Reviewed indicator is not represented as a booking status; provider-link submission sets Confirmed for its booking without completing staff review, and downstream wallet/financial records remain available when unconfirmed (`DEC-012`, `DEC-013`, `RES-013`). Outreach recording is specified separately in `DEC-014`; other transitions remain open (`OQ-13`).

### SC-039 — Actual provider outreach must be marked explicitly (CONFIRMED)

**Given** John's Baktun booking is **Not Requested**, **when** staff generates, views or copies its provider link, **then** it remains **Not Requested**. **When** staff actually sends a booking request by WhatsApp and clicks **Mark as Requested**, **then** only John's targeted booking changes to **Awaiting Confirmation**; it is not marked **Confirmed** or **Staff Reviewed**. **Assert:** planned payables, reporting and pending wallet/PDF were available even before outreach, and copying alone did not count as a message sent (`DEC-012`, `DEC-013`, `DEC-014`, `RES-014`).

### SC-040 — Supplier refuses; staff sees unresolved booking (CONFIRMED)

**Given** Baktun tells Tío Nenê via WhatsApp it cannot accept John's December 12 Chichén Itzá reservation, **when** staff manually marks that booking **Unable to Confirm**, **then** John's arrival retains the booking and **Action Required** surfaces it until addressed. **Assert:** contract, wallet and payable are not silently rewritten/deleted, no automated WhatsApp detection or substitute booking is claimed (`DEC-015`, `RES-015`).

### SC-041 — Remove unconfirmed booking and unpaid planned provider cost (CONFIRMED)

**Given** John has a no-longer-needed, not-paid tour booking with a $100 planned Baktun cost, **when** staff deletes the operational booking and chooses to remove its unpaid planned provider cost, **then** that service disappears from the active arrival and planned financial totals no longer include the discarded charge. **Assert:** original finalized contract is not silently amended; wallet treatment follows the explicitly selected option, no master records change, and no fake provider-side cancellation is recorded (`DEC-001`, `DEC-015`, `RES-016`, `RES-017`).

### SC-042 — Retain provider expense after removing reservation (CONFIRMED)

**Given** Baktun charged a legitimate $30 cancellation fee despite John's tour being cancelled, **when** staff deletes John's operational reservation but chooses to retain the provider charge independently, **then** the $30 remains a valid, reportable Baktun expense attributable to John where possible. **Assert:** no dangling required active-booking reference and no automatic second payable/fee is invented (`DEC-015`, `RES-017`, `PAY-005`).

### SC-043 — Do not erase supplier payment when booking is deleted (CONFIRMED)

**Given** staff have recorded a real $100 payment to Baktun for John's tour, **when** they remove the operational reservation, **then** the $100 paid transaction is preserved and remains reportable. **Assert:** deleting a booking does not erase a bank/cash payment, cancel an actual supplier booking, silently refund John, or rewrite the original contract (`DEC-015`, `RES-017`, `OQ-19`, `OQ-20`).

### SC-044 — One current wallet and client replacement reminder (CONFIRMED)

**Given** John already received his itinerary PDF and staff marked it as sent, **when** his tour date is edited in the internal wallet, **then** the arrival/wallet view shows a small **Wallet Update Needed** indicator. **When** staff generate a new PDF, share it externally and click **Mark as Sent** for the current output, **then** the indicator clears. **Assert:** only the latest wallet is presented in normal admin screens; no visible PDF V1/V2 list or mandatory edit-history view; earlier WhatsApp PDFs are not remotely altered, and marking sent does not assert verified delivery (`DEC-016`, `WAL-007`, `WAL-008`).

### SC-045 — One supplier payment settles several reservations (CONFIRMED)

**Given** Baktun has three open payable entries and staff make **one** bank transfer covering all or parts of them, **when** staff record the single actual supplier payment with date, provider, amount and selected payable allocations, **then** each linked entry reflects the allocated paid amount and updated outstanding balance. **Assert:** there is one outgoing cash transaction, not three fictional bank transfers; payable cost is not recorded again as an additional expense (`DEC-017`, `PAY-004`, `PAY-010`–`012`).

### SC-046 — A booking can be paid in multiple installments (CONFIRMED)

**Given** Baktun has a $100 payable for John's tour, **when** staff record a $40 partial cash payment allocated to that payable, **then** the row shows $40 paid and $60 still outstanding. **When** a later $60 payment is allocated, **then** the outstanding balance becomes $0. **Assert:** the original $100 expense is still a single expense and both cash payment events remain identifiable even if the operational booking is later removed (`DEC-017`, `PAY-011`–`012`, `DEC-015`).

### SC-047 — Supplier cost is stable when a partial payment is recorded (CONFIRMED)

**Given** Baktun's payable row for John's tour has a total effective **Reservation cost** of $100 and no allocated payment, **when** staff record and allocate a $20 cash or bank payment, **then** the row shows **Reservation cost $100**, **Amount paid $20**, **Remaining balance $80**. **Assert:** the $100 supplier cost and corresponding expense/profit measure are NOT reduced to $80; only paid and outstanding measures change. A later payment affects those latter measures, while an explicitly entered cost override is the only permitted way to modify the effective provider charge (`DEC-017`, `PAY-013`).

### SC-048 — Provider advance payment sits as credit and settles a future tour (CONFIRMED)

**Given** staff record an actual $500 bank transfer to Baktun today and choose **no payable allocation**, **then** supplier payments show exactly **one $500 money-out transaction**, Baktun has **$500 unallocated credit**, and no fabricated reservation or new supplier cost exists. **When** staff later apply that credit to an existing **$500 planned payable** for John's tour taking place in two days, **then** the payable displays **Reservation cost $500 / Amount paid $500 / Remaining balance $0**, while Baktun's unallocated credit becomes **$0**. **Assert:** one genuine payment only, original payment date unchanged, no duplicate expense, no change to master tariffs or customer contract (`DEC-018`, `PAY-014`, `PAY-015`).

### SC-049 — Credit and payable are distinguishable before allocation (CONFIRMED)

**Given** Baktun has a $500 future-service payable and a separate $500 **unallocated** supplier payment credit, **when** owner views the provider account, **then** it shows **$500 gross payable / $500 unapplied credit / $0 conceptual net position**, while the individual payable remains **$500 cost / $0 allocated paid / $500 remaining** until staff explicitly allocate the existing credit. **Assert:** financial reports distinguish paid cash out, supplier cost, and unapplied credit, and cannot falsely label the individual booking as settled without an allocation (`DEC-018`, `PAY-016`).

### SC-050 — Release booking payment allocation to supplier credit (CONFIRMED)

**Given** an actual $500 Baktun payment has already been allocated to John's $500 provider-payable for a future tour, **when** staff release that allocation because the tour was cancelled and supplier agrees funds stay on account, **then** Baktun has **$500 unapplied credit**, the original outgoing $500 supplier payment still exists exactly once and **no refund received** or new payment has been recorded. **Assert:** the booking's amount allocated is reduced and its remaining due follows its separately maintained effective cost; deleting/reducing that cost is a different action governed by as-yet-undecided cancellation fee rules (`DEC-019`, `OQ-20`).

### SC-051 — An actual supplier refund is a different cash event (CONFIRMED)

**Given** the $500 Baktun payment is available as unallocated credit, **when** Baktun returns $500 in cash/bank and Admin records the refund received, **then** the provider's unapplied credit is **$0**, the historical outgoing $500 transaction is preserved, and there is **one actual $500 incoming refund event**, not a new client sale or provider cost. **Assert:** merely releasing an allocation never creates such a refund; separate real cash receipt must be recorded. Partial refund and currency conversion details are intentionally pending (`DEC-019`, `OQ-19`, `OQ-23`).

### SC-052 — Every reservation gets a stable, unique identifying number (CONFIRMED)

**Given** John's finalized sale creates a Chichén Itzá operational reservation and staff later manually add a yacht-marina transport reservation, **when** records are created, **then** each receives an automatically generated, distinct, human-usable reservation number visible and searchable internally. **When** either reservation is edited or moved to a new date, **then** its number is unchanged. **If** staff remove one and create a replacement, **then** the replacement has a new, never-reused number. **Assert:** neither number is confused with the external supplier's confirmation code or the contract/arrival ID (`RES-018`).


### SC-053 — Cancellation changes supplier cost, not original contract or supplier payments (CONFIRMED)

**Given** John's Baktun tour has an effective $100 payable, **when** the booking is cancelled and Baktun charges **nothing**, Admin changes only the affected payable cost to **$0**; if Baktun instead charges **$30**, Admin may set it to **$30**; or keep it at **$100** if Baktun charges in full. **Assert:** the selected amount is reflected in supplier cost/profit reporting and unpaid balance (if no previous allocations); the master tour tariff, John's original contract, other clients' bookings and supplier cash ledger are unchanged. Cancelled booking does not imply automatic cash refund or release-to-credit (`DEC-020`, `PAY-019`).

### SC-054 — Paid supplier cost reduced after cancellation prompts credit release (CONFIRMED — DEC-021)

**Given** Baktun was actually paid $100 and that $100 was allocated to John's payable, **when** staff edit the cancelled service's provider charge from $100 to **$30**, **then** the effective cost becomes **$30** and the original actual $100 supplier payment remains recorded. **Assert:** the system identifies the **$70 excess allocation** and offers staff the option to release it to Baktun’s **unallocated credit**; it must not silently release it, present minus $70 as amount owed, invent an incoming refund, or destroy the original paid transaction (`DEC-021`).

### SC-055 — Releasing excess money does not pay or refund twice (CONFIRMED — DEC-021)

**Given** Baktun was paid $100 and $100 was allocated to one reservation whose payable cost is revised to $30, **when** staff explicitly accept the offered **release of $70** to Baktun credit, **then** $30 remains allocated to the reservation, $70 becomes usable provider credit, and the original actual $100 supplier cash-out stays recorded exactly once. **Assert:** no second cash-out, new payable cost, refund received, customer revenue, negative remaining balance, or automatic wallet/contract change is created (`DEC-017`–`DEC-021`).

### SC-056 — Per-tour adults and children are explicitly printed on each contract tour (CONFIRMED)

**Given** John signs a contract for six total travelers and books three tours with adult/child attendance of 4/2, 2/2 and 2/0 respectively, **when** seller creates and finalizes the contract, **then** each tour line explicitly shows its own adults and children on the customer-facing contract PDF, retains structured counts in that sold service line, and initializes its operational reservation, provider request, cost inputs and wallet accordingly. **Assert:** no tour silently inherits the overall party count. **Also assert:** if all three tours instead have the same 2-adult/0-child attendance, the contract **still** displays counts on all three lines (`CON-012`, `RES-019`, `WAL-002`). Exact child age pricing remains open (`OQ-10`).

### SC-057 — Tour pickup defaults to date-matched hotel; override stays local (CONFIRMED)

**Given** John stays at Hotel A December 10–13 and Hotel B December 13–17, with a Chichén Itzá tour on **December 14**, **when** the finalized contract creates the tour reservation, **then** that reservation's pickup accommodation defaults to **Hotel B**, based on the tour date, and not Hotel A. **When** staff changes only this reservation's pickup to Hotel A (or another location) before asking the provider, **then** the reservation uses the edited pickup; John's contract and hotel master remain unchanged, and only relevant downstream sync options are offered. **Assert:** no changes to unrelated tour reservations or automatically applied supplier payments (`RES-020`, `RES-007`, `RES-008`, `DEC-001`). A tour on the exact hotel-change date is an **unresolved boundary case** (`OQ-07`), not authorization to guess.

### SC-058 — Percentage discount reconciles line revenue and contract total (CONFIRMED)

**Given** seller quotes three tours privately at $150 / $200 / $150 ($500 pre-discount), **when** they choose a **10% overall contract discount**, **then** the client total is $450 and the internal net-attributed revenue is $135 / $180 / $135. **Assert:** the original negotiated line prices remain unchanged, the $50 aggregate discount is not manually distributed by seller, the total net line revenue equals $450, and neither the original nor allocated **per-tour dollar figures** appear on the client PDF (`CON-013`, `FIN-006`).

### SC-059 — Fixed money discount reconciles and affects provider margin (CONFIRMED)

**Given** the same $500 tour price lines, **when** seller enters a **fixed $50 discount** instead of percentage, **then** client total and net lines are again $450 and $135 / $180 / $135. **Assert:** the fixed amount is not also treated as a percentage, line/provider revenue or gross contribution uses the net prices rather than pre-discount values, and a minimal rounding residual for other totals is allocated deterministically so the saved net lines equal the agreed discounted contract total (`CON-013`, `FIN-006`).

### SC-060 — Seller records already received deposit during Finalize Sale (CONFIRMED)

**Given** John agrees to a $500 contract stating a $100 deposit and the seller has already received **$100 cash**, **when** the seller clicks **Finalize Sale** and enters an **actual $100 receipt** with cash method and actual received date, **then** exactly one client receipt is attached to John's new contract/arrival, actual amount received is $100 and outstanding client balance is $400. **Assert:** the seller did not need to open the general finance module, the contract's agreed deposit field is not counted as a second receipt, and no additional operational arrival or booking is created by recording payment (`REC-005`, `CON-007`).

### SC-061 — Forgotten deposit can be recorded after finalization (CONFIRMED)

**Given** John has an already-finalized $500 contract stating a $100 agreed deposit, and the seller did receive $100 cash but **forgot to log it**, **when** permitted staff open John's arrival/contract or quick Record Payment and record that earlier $100 receipt with the **actual original date received**, **then** the existing client's payment history shows the payment and the outstanding balance becomes $400. **Assert:** John's contract PDF and its agreed deposit remain unchanged, the arrival and reservations are not recreated, and the same receipt isn't duplicated if already recorded during finalization. **Also assert:** an otherwise agreed $100 deposit with no confirmed real receipt is **not** included as cash collected, and the sale can still be finalized without a receipt (`REC-005`, `REC-006`).

### SC-062 — Optional note on payments and operational records (CONFIRMED)

**Given** John pays a $100 deposit into a particular bank account and Tío Nenê pays a supplier in cash, **when** staff record these transactions, **then** each can have a brief optional note (e.g. "Received in BBVA account" or "Paid Miguel in cash"). **Assert:** the notes can be left blank; entering or editing a note changes no financial values, allocations, linked reservations, provider status, contract content or reports (`NOTE-001`, `REC-002`, `PAY-010`). Staff can also annotate an individual reservation or manual supplier cost adjustment where useful, without triggering unwanted synchronization.

### SC-063 — Client balance overdue immediately on arrival day (CONFIRMED)

**Given** John has arrival date **December 12**, a $500 contract, a recorded $100 actual deposit received and $400 remaining unpaid, **when** the calendar reaches **December 12**, **then** the $400 is flagged **Overdue** in the arrival and relevant receivables/dashboard views. **Assert:** the default deadline is before arrival (December 11), not end of December 12; the promised contract deposit alone never qualifies as a received payment, and no reservation, contract or payment amount is changed by the overdue indicator (`REC-007`, `REC-005`).

### SC-064 — Locally extend client's payment deadline (CONFIRMED)

**Given** John arrives December 12 and still owes $400, and Tío Nenê agrees he can **pay on December 14**, **when** an authorized staff member changes the client payment deadline to **December 14**, **then** the balance is not flagged overdue on December 12–14 and will become overdue **December 15** if still unpaid. **Assert:** the original arrival date and contract remain unchanged, payment receipts and provider bookings are unchanged, and receipt of the remaining $400 by the effective deadline clears the unpaid/overdue balance (`REC-007`). Exact role beyond Admin and arrival-date amendment rules remain `OQ-27`/`OQ-28`.

### SC-065 — Airport transfer price does not multiply by passengers (CONFIRMED)

**Given** the same airport→hotel leg, same provider tariff zone, and two otherwise equivalent reservations with **one** and **seven** passengers, **when** supplier cost is suggested from the entered tariff, **then** both bookings use the **same fixed one-vehicle charge**, not passenger-count multiplication. **Assert:** zone/direction changes select the appropriate known fee; an eight-person booking must not automatically reuse the up-to-seven quote or manufacture a vehicle split (`CAT-009`, `TRF-006`, `PAY-021`). Rates are test fixtures only, not actual supplier prices.

### SC-066 — Yacht price is manually quoted for the chosen boat (CONFIRMED)

**Given** John purchases a private yacht and the actual boat is chosen per booking, **when** the contract/operational booking is prepared, **then** Admin can enter the boat-specific supplier cost manually without inventing a standard yacht catalog price. **Assert:** the yacht tour, planned payable and gross-margin estimate retain a distinct per-sale quote; another yacht reservation can have a different quote without changing John's record, the contract sale price or any master catalog standard (`CAT-009`, `PAY-021`, `DEC-001`). A genuinely unentered cost is unknown/needs pricing, not $0.

### SC-067 — Baktun variants are separate, per-head and not zone-priced (CONFIRMED)

**Given** Baktun has Chichén Itzá Deluxe, Classic and Two Cenotes as three catalog offerings, and the chosen variant has **verified test-fixture tariffs** of $80 per adult and $60 per child, **when** John books for 2 adults and 1 child, **then** the suggested provider cost is **$220** (2 × $80 + 1 × $60), regardless of whether the hotel is in Cancun Center or Cancun Hotel Zone. **Assert:** the three variants remain separate products with their own imported tariffs; booking quantity increases per-head cost; no zone surcharge is added for Baktun. **The $80/$60 amounts are hypothetical test fixtures, NOT real Baktun rates** (`CAT-009`, `PAY-021`, `OQ-10`).

### SC-068 — Arrival overview shows readiness and detailed action list together (CONFIRMED)

**Given** John has an outstanding supplier reservation request and Maria has no recorded outstanding operational arrangements, **when** staff open the arrivals overview and Action Required, **then** each arrival row visibly carries a **Ready / Not Ready** summary while Action Required separately lists the specific unresolved work that exists in the source records. **Assert:** neither display is omitted because the other exists; selecting John's Not Ready arrival exposes its unresolved booking(s); no user has to create a parallel manual task just to make the issue visible. Core Ready rule (all configured required bookings Confirmed plus a current wallet ready to send) is APPROVED; only edge refinements remain in current `04_*` §C (`OPS-002`, `OPS-005`, `OPS-006`).

### SC-069 — Readiness is not a sixth booking status or mandatory calendar (CONFIRMED)

**Given** operational services retain the five approved booking statuses and optional Staff Reviewed, **when** staff browse arrivals and action work, **then** **Ready / Not Ready** is an arrival-level summary—not a new service status or manually synchronized status field. **Assert:** list-based overview and action list work without requiring calendar development; readiness rules must not quietly convert optional staff review, client payment, contract signatures or other undecided matters into hard gates (`OPS-004`, `OPS-005`, `OPS-006`, `OQ-26`).

### SC-070 — Unpaid balance does not override operational Ready (CONFIRMED)

**Given** John's operational arrangements meet the eventual agreed criteria for Ready, but he still owes $200 (whether due later or already overdue), **when** the arrivals dashboard evaluates John's records, **then** the arrival can display **Ready** and must independently display the outstanding/overdue $200 as a financial warning. **Assert:** the financial amount does not automatically force **Not Ready** or suppress a genuine operational readiness state; payment collection remains visible in the receivables workflow. This test applies the APPROVED core booking-confirmation + prepared-wallet readiness criteria; exceptional status refinements may be handled during UAT under `OQ-26` (`OPS-005`–`007`, `REC-007`).

### SC-071 — Ready to send is sufficient; actual sending is tracked separately (CONFIRMED)

**Given** Maria's operational reservations meet the currently approved required-bookings-confirmed readiness criteria and her digital wallet is prepared, up to date and **ready to send**, but the PDF has **not yet been shared** and staff have not clicked **Mark as Sent**, **when** the arrivals overview evaluates her case, **then** Maria may show **Ready**; the wallet's **Not Sent / Send Needed** state remains visible separately for follow-up. **Assert:** the Ready badge does not falsely claim the wallet was sent, and clicking Mark as Sent is never a prerequisite for Ready. **Also assert:** merely having an editable but incomplete wallet does not automatically qualify it as ready; wallet must be prepared/ready to send, not merely a draft; cosmetic/further service-specific completeness choices remain configurable/UAT (`OPS-005`–`008`, `WAL-008`, current `04_*` §C).

### SC-072 — A configured required yacht transfer is detected before booking exists (CONFIRMED; optional per yacht)

**Given** the admin-edited “Private yacht with transport included” offering specifies **separate transport booking required**, and John has finalized a sale of that offering, **when** operations opens John's arrival **before** manually booking the marina transfer, **then** Action Required shows **Book transportation** despite there being no transfer reservation yet. **Assert:** yacht supplier confirmation alone does not erase this action or make the arrival Ready; no second tour sale/contract charge, transport supplier booking or payable is automatically invented (`CAT-010`, `RES-011`, `OPS-009`).

### SC-073 — Manually booking included transport resolves only that missing-work item (CONFIRMED)

**Given** John's yacht arrival has the outstanding **Book transportation** action, **when** staff manually add the hotel→marina transfer reservation and associate it with the included service, **then** the missing-booking action clears and the new transport booking creates its own provider-facing link and planned provider cost. **Assert:** its ordinary booking status (such as Not Requested/Awaiting Confirmation) remains independent and can still generate follow-up work; the yacht contract still has one sold yacht item and no new client charge. Other operational Ready rules are not silently bypassed (`ARR-003`, `RES-001`, `RES-011`, `OPS-009`, `OQ-26`).

### SC-074 — Admin overrides Not Ready to Ready while supplier confirmation remains pending (CONFIRMED)

**Given** John's arrival is calculated **Not Ready** because a required provider booking is still Awaiting Confirmation, **when** Admin overrides only the arrival label to **Ready**, **then** the arrivals overview displays Ready while John's booking remains Awaiting Confirmation and Action Required continues to show the outstanding provider work. **Assert:** no automatic supplier confirmation, financial/contract change, task deletion, wallet delivery or provider communication is triggered (`OPS-005`, `OPS-010`, `OQ-26`).

### SC-075 — Admin explicitly marks Ready arrival Not Ready without disrupting other work (CONFIRMED)

**Given** Maria's arrival is calculated Ready and her wallet is prepared, **when** Admin overrides the displayed status to **Not Ready**, **then** the list shows Not Ready while existing reservations, wallet, payment records and the underlying calculated readiness remain unchanged. **Assert:** the readiness label must not block unrelated workflows; the override is distinguishable internally from the calculated condition (`OPS-010`).

### SC-076 — Admin manually marks an unconfirmed booking Confirmed (CONFIRMED)

**Given** a specific reservation is Awaiting Confirmation and no supplier form was submitted, **when** Admin deliberately marks that individual booking Confirmed in the internal app, **then** only that booking's provider booking status changes to Confirmed, without requiring pickup location/time or provider confirmation code. **Assert:** Staff Reviewed stays independently unchanged, no automated supplier submission is fabricated, and the action does not silently confirm other services or clear missing ancillary bookings (`RES-003`–`006`, `RES-021`, `OPS-009`).

### SC-077 — All required bookings confirmed automatically makes arrival Ready (CONFIRMED)

**Given** John's contracted tour bookings and every mandatory additional included service are present and Confirmed, and his current wallet is complete/prepared to send, **when** the readiness summary recalculates, **then** his arrival automatically displays **Ready** without staff manually changing the badge. **Assert:** unpaid balance, unsigned contract, unmarked Staff Reviewed or not-yet-sent PDF do not prevent the default Ready result (`OPS-005`, `OPS-007`–`010`).

### SC-078 — Existing confirmed tours must not mask a separately **configured required** included transfer (CONFIRMED)

**Given** the yacht booking is Confirmed but its catalog-required transport reservation has not been created, **when** readiness recalculates, **then** the arrival is automatically **Not Ready** and Action Required still shows **Book transportation**. **Assert:** an Admin may separately override the displayed badge without erasing the missing-service task or manufacturing a transfer record (`CAT-010`, `OPS-009`–`010`).

### SC-079 — Contract captures flight details for airport transfer (CONFIRMED)

**Given** John buys inbound and outbound airport transfers and the seller enters the flight numbers and scheduled flight times for each relevant journey, **when** the contract is finalized and rendered, **then** the respective information is retained in structured data and shown on the contract. **Assert:** unrelated tours do not acquire invented flight details (`CON-002`, `TRF-007`).

### SC-080 — Both transfers can be arranged with one informal supplier conversation (CONFIRMED)

**Given** the client requires inbound and outbound transfers, **when** Admin agrees both with the transport contact through one WhatsApp conversation, **then** Admin can record the relevant arrangements and confirmations without a supplier form or confirmation code, and without sending two mandatory booking requests. **Assert:** arrival and departure remain **two separately editable reservation IDs** but do not require two supplier messages or provider-link submissions (`TRF-008`–`009`, `RES-004`–`005`).

### SC-081 — Both airport transfers generate two independent operational reservations (CONFIRMED)

**Given** John's finalized contract sells airport pickup on Dec 10 and departure airport transfer on Dec 20, **when** finalization creates the arrival, **then** there are exactly **two separate dated airport transfer reservation IDs**, one inbound and one outbound, each with its own lifecycle and planned provider payable. **Assert:** editing, confirming or cancelling the return does not silently edit the inbound leg, original contract or master rates; staff may coordinate both in a single provider WhatsApp conversation (`TRF-008`–`009`, `DEC-001`).

### SC-082 — Dated contract itinerary shows transfer choices beside tours (CONFIRMED)

**Given** John's trip runs Dec 10–20 with airport transport purchased in both directions and tours on Dec 12 and Dec 13, **when** the seller generates his client-facing contract, **then** the date-ordered itinerary contains **Dec 10: Arriving with transfer (flight number/time)**, **Dec 12: tour**, **Dec 13: tour**, **Dec 20: Departing with transfer (flight number/time)**, plus the existing per-tour adult/child counts. **Assert:** the transfers are visible as travel items in one itinerary, not duplicated as additional tour lines or separately itemized internal supplier-payable rows (`CON-014`, `TRF-007`, `TRF-010`).

### SC-083 — Explicit without-transfer itinerary entries do not create provider bookings (CONFIRMED)

**Given** John chooses airport arrival **without** Tío Nenê transfer and departure **with** transfer, **when** the contract is generated and finalized, **then** the dated arrival row says **Arriving without transfer**, the dated departure row says **Departing with transfer** and carries its flight details, and only the **outbound** operational transfer booking/payable is created. **Assert:** no fictional inbound provider booking, provider payment obligation or mandatory flight details for the without-transfer direction (`CON-014`, `TRF-009`–`010`).

### SC-084 — Client balance stays USD when deposit is paid in BRL (CONFIRMED)

**Given** John's client contract total is **USD $500** with a remaining receivable in USD, **when** staff receives a deposit in Brazilian reais and enters the **USD $100 equivalent actually credited** with the optional note “BRL deposit”, **then** John's recorded client receipt is **USD $100** and his outstanding client balance decreases by **USD $100**. **Assert:** original BRL tender is not mistakenly counted as another payment, no unprovided exchange rate is invented, and the tour's internal sales price/contract original is not rewritten (`REC-008`, `REC-002`–`003`, `NOTE-001`, `OQ-23`). Figures are illustrative, not an asserted BRL/USD rate.

### SC-085 — MXN supplier charge uses preserved estimated USD cost (CONFIRMED)

**Given** Playa Mía has a native supplier cost of **MXN 2,000** and the currently configured planning rate is **MXN 20 per USD** (illustrative), **when** staff finalize the related USD-priced sale, **then** the booking stores the **MXN 2,000** original provider charge and the estimated USD cost **$100** together with the rate used. **When** the operator subsequently changes the general planning rate, **then** the historical booking still shows its original $100 estimate unless an authorized local edit explicitly changes that booking. **Assert:** neither the MXN charge nor the contract's agreed USD selling price is rewritten; new bookings may use the new standard rate (`PAY-022`, `CAT-006`).

### SC-086 — Actual USD payment value does not overwrite original MXN price (CONFIRMED)

**Given** the same Playa Mía payable for MXN 2,000 has an estimated USD cost of $100, **when** the operator pays the full provider charge and records that it actually cost **USD $111.11**, **then** the payment retains the actual USD amount and real payment date, and the financial view distinguishes **estimated $100** from **actual $111.11** in its cost reporting. **Assert:** the provider's original MXN 2,000 charge remains preserved, the payment does not create a second expense, client price is unchanged, and reporting does not count both USD amounts as two supplier charges. Examples are artificial; partial/multi-rate payments require additional rules (`PAY-022`, `FIN-007`, `OQ-23`).

### SC-087 — New standard FX rate affects future estimates only (CONFIRMED)

**Given** Playa Mía booking A for MXN 2,000 was estimated at **USD $100** with the **20 MXN/USD** standard rate (illustrative), **when** Admin changes the standard rate to **16 MXN/USD**, **then** booking A still displays its saved **20** rate and **$100** original estimate. **When** a new booking B for MXN 2,000 is created thereafter, its planning estimate is **USD $125** at the new standard rate. **Assert:** booking A's estimate, both original MXN provider prices and any logged actual USD supplier payments stay unchanged; the new rate remains in effect until subsequently changed (`PAY-023`, `PAY-022`).

### SC-088 — Arrival month controls business profit cohort (CONFIRMED)

**Given** John's contract is finalized in September, John **arrives October 31**, and every tour is dated November, **when** Admin requests **October profit**, **then** John's relevant net selling prices and linked supplier cost measures appear under **October arrival-cohort profit**, not September or November. **Assert:** do not use sale finalization date or the individual tour service dates as the cohort selector. The report labels the measure as profit *attributable to arrivals* and honors planned/confirmed/paid cost selections without double-counting (`FIN-008`, `FIN-003`, `OQ-24`).

### SC-089 — Arrival-cohort profit differs from cashflow dates (CONFIRMED)

**Given** a client arrives October 31, pays a deposit in September, completes tours in November and a provider receives payment in November, **when** staff review **October arrival-cohort profit** and separately a report of **actual September receipts** or **actual November supplier payments**, **then** the booking's profit stays attributed to **October**, while real receipts/payments remain attributable to their actual transaction dates within separate cash-flow metrics. **Assert:** no payment is counted twice or relabeled as a sale and no statutory recognition policy is inferred (`FIN-008`, `REC-008`, `FIN-007`, `OQ-24`).

### SC-090 — Finalize custom tour with genuinely unknown supplier cost (CONFIRMED)

**Given** seller enters a legitimate free-text tour on John's USD contract, with its agreed selling price but no known provider quote, **when** seller presses **Finalize Sale**, **then** the sale is finalized, the same arrival and an individually identified operational reservation exist, the planned provider-cost placeholder is explicitly **Unknown** (NOT $0), and the standard downstream workflow remains available. **Assert:** no fabricated supplier, price or zero-cost profit is created; the seller is not forced to obtain a quote first (`CON-015`, `PAY-024`).

### SC-091 — Unknown yacht quote creates and clears Cost Required (CONFIRMED)

**Given** a yacht tour has a boat-dependent supplier quote not yet obtained, **when** that sale is finalized, **then** staff see an automatic **Cost Required** item for that booking in Action Required and on the linked arrival. **When** staff later enter an actual confirmed/suggested supplier cost locally, **then** that task clears and the applicable payable amount updates without changing the original contract, master yacht offering, or other reservations. **Assert:** original missing amount was unknown rather than $0 (`OPS-011`, `PAY-024`, `CAT-009`).

### SC-092 — Reporting never assumes missing supplier cost is zero (CONFIRMED)

**Given** John's arrival cohort includes one $150 sale line with no provider cost yet and another service whose provider cost is known, **when** staff open John-level and monthly/provider profitability reports, **then** the known revenue and expenses remain visible but the affected profit/margin is clearly **incomplete due to unknown cost**, not reported as fully accurate profit equal to $150 for the unknown line. **When** staff enter that missing cost, the applicable projected margin can be calculated from the now known data without creating a second cost or receipt (`FIN-009`, `PAY-024`, `FIN-008`).

### SC-093 — Xcaret zone maps to existing transport-inclusive tariff (CONFIRMED)

**Given** seller selects **Xoximilco** for a 2026 tour date while the traveler stays in a hotel classified `Cancun Hotel Zone`, **when** seller completes tour/date/adult/child entry, **then** system selects the EXISTING `CUN/Playa Mujeres` transportation-inclusive Xoximilco supplier package and suggests its configured actual per-adult/child total. **Assert:** seller did not choose a region, no extra admission-plus-transport charge was invented, and only `Xoximilco` appears on the customer contract. Source actual rates must come from later approved workbook (`CAT-011`–`013`, `CON-016`).

### SC-094 — Tulum fallback and Xcaret de Noche have no provisional indicator (CONFIRMED)

**Given** seller selects Xcaret Plus for an arrival staying in `Tulum Hotel Zone` on that tour date, **when** pricing auto-resolves, **then** it uses an EXISTING `CUN/RM` Xcaret Plus package as the default. **When** seller selects Xcaret de Noche for a date-matched `Cancun Center` hotel, **then** it defaults to the existing `RM` variant. **Assert:** neither triggers a provisional badge/review prompt or fabricates an unlisted package; both remain individually adjustable. No pickup location is needed (`CAT-012`, `RES-022`).

### SC-095 — Adjust one Xcaret booking independently; no historical reprice (CONFIRMED)

**Given** two arrivals hold Xcaret bookings using the same provider tariff, one has already a paid supplier transaction, **when** Admin changes one reservation's package, season or manual cost, **then** only that reservation's effective cost is offered for optional reconciled payable update; the other arrival, Xcaret master tariff, hotel's canonical zone, original contract, historical planned snapshot and real payments are preserved. **Assert:** record exact selected tariff/override for traceability without provisional banner (`RES-022`, `PAY-025`).

### SC-096 — Tour date selects correct 2026 temporada (CONFIRMED)

**Given** an Xcaret tour WITH supplier high/regular prices is scheduled for 2026-03-29 and then for 2026-03-30, **when** selected, **then** the first uses REGULAR/BAJA and second ALTA. Similarly high through 04-12, regular from 04-13, high 07-01 through 08-15, regular 08-16–12-25, high 12-26–12-31. **Assert:** choosing service date not contract/arrival date controls season; 2027 season prices are not guessed, and a product with a single supplier price never invents a seasonal variant (`CAT-013`, `PAY-025`).

### SC-097 — Weekly closed date cannot be sold; see operating days (CONFIRMED)

**Given** Xel-Há is marked closed on Tuesdays, **when** seller attempts to add it for Tuesday 2026-09-01, **then** adding is rejected with a clear doesn't-operate-on-this-day error and a functional **View operating days** action showing the regular schedule and listed exceptions. **Assert:** also block a seller rescheduling an active booking to an explicitly closed date, without deleting the original paid booking (`OPS-012`).

### SC-098 — Special 2026 Sunday exception takes priority (CONFIRMED)

**Given** normal Xplor schedule says closed Sunday, **when** seller chooses **2026-07-19**, **then** the 2026 special Sunday calendar permits Xplor. **When** they choose **2026-09-06**, **then** the weekly closed rule rejects it. **Given** Xoximilco is closed on ordinary Sundays, **when** seller chooses 2026-07-12 or 2026-07-19, **then** the former is closed and latter open per dated exceptions. **Assert:** exceptional opening is specific to 2026 and to the precise tour; do not apply dates indiscriminately to Xplor Fuego (`OPS-012`).

### SC-099 — Mid-December reminder for next-year Xcaret calendars (CONFIRMED)

**Given** it is around **December 15, 2026** and Admin has not completed the **2027** schedule confirmation, **when** they open the dashboard, **then** a reminder identifies **2027** and requests updating/confirming Xcaret season date ranges, dated exceptions and regular weekly operating days. **When** valid next-year information is entered/confirmed, **then** the relevant reminder clears. **Assert:** no external scheduler is required, no 2026-only seasonal period or Sunday date is reused as 2027 source truth, no arrival readiness or payment changes (`OPS-013`).

### SC-100 — Supplied source data does not authorize invented future rates (CONFIRMED; updated v0.1.37)

**Given** the 27 verified Xcaret supplier-rate records are now attached and correctly mapped for the 2026 season/zone rules, **when** the developer seeds source records, **then** use actual Tour/Rate IDs and source costs rather than guessed tariff rows. **If** a new service/zone/season or future year has no authorized actual source rate/calendar, then cost remains Unknown and follows `CON-015`/`FIN-009` where finalization is permitted, and explicitly closed operating dates remain blocked. **Assert:** all 11 supplier workbooks and the approved 2026 calendar annex are now in this ZIP, but the separate hotel master and 2027 season dates are NOT implied to be present (`CAT-005`,`CAT-011`,`CAT-017`–`018`,`PAY-024`).

### SC-101 — Seller display name versus original supplier product and historical PDF (CONFIRMED)

**Given** an Envatours shared tour has a seller display label without `(Coletivo)` but retains the exact supplier name, **when** seller searches, selects and issues a contract, **then** the seller search/PDF use the approved Display Name, supplier records retain the original product/rate labels, and a later admin Display Name edit does not change the prior PDF/sold-line snapshot or Tour ID (`CAT-015`–`016`, `CON-017`).

### SC-102 — One Coco Bongo product with multiple weekday rates (CONFIRMED)

**Given** seller searches Coco Bongo Regular, **when** provider has different approved source weekday net prices, **then** seller sees ONE customer product while backend chooses the corresponding `COC-R002` Monday–Wednesday, `COC-R003` Sunday/Thursday or `COC-R004` Friday rate. **Saturday is explicitly unavailable** for Regular; Coco Bongo is adults-only, so child rates are NOT APPLICABLE, never unknown-USD-0. A price-day criterion is not by itself the universal operating schedule for unrelated tours (`CAT-018`,`CAT-020`,`RES-023`).

### SC-103 — Baktun products stay distinct and zone-independent (CONFIRMED)

**Given** Baktun's Clássico, Deluxe and 2 Cenotes are distinct experiences, **when** seller searches, **then** all three are separate products with their approved display labels; the per-adult/child supplier cost does not change merely because customer hotel zone changes (`CAT-009`, `CAT-016`, `SC-067`).

### SC-104 — Envatours source-verified private boat cost is fixed per boat (CONFIRMED; revised in v0.1.37)

**Given** `ENV-R002`, `ENV-R004` or `ENV-R006` is selected for a private Envatours booking with 1–10 passengers, **when** booked, **then** the supplier cost is respectively USD 140, USD 270 or USD 200 **per one boat**, independent of adult/child passenger count. Missing quotes for OTHER unsupplied yachts remain Unknown and may be entered later; no source price is multiplied per head (`CAT-019`, `PAY-024`, `PAY-027`, `RES-024`).

### SC-105 — Miguel: one tour, two independent round-trip legs (CONFIRMED)

**Given** seller chooses `Transfer Privado Aeroporto ↔ Hotel` for a 1–7-person client with two purchased airport directions, **when** Finalize Sale runs, **then** one seller catalog choice creates TWO distinct dated operational reservations and TWO individually costed planned supplier payables at the applicable **per-vehicle one-way** zone rate; one supplier WhatsApp exchange can arrange both, and client contract uses arriving/departing wording without duplicate tour lines (`TRF-009`–`012`, `CON-014`, `CON-017`).

### SC-106 — Miguel: all eight zone mappings, particularly Maya Riviera (CONFIRMED)

**Given** a dated-stay hotel in each of the eight agency zones, **when** Miguel transfer cost is looked up for a single 1–7-pax one-way leg, **then** it maps respectively: Puerto Juarez→Cancún Downtown $39; Isla Blanca→Costa Mujeres $60; Cancun Center→Cancún Downtown $39; Cancun Hotel Zone→Cancún Hotel Zone $39; Maya Riviera→Playa del Carmen $65; Playa del Carmen→Playa del Carmen $65; Tulum Center→Tulum Centre $120; Tulum Hotel Zone→Tulum Hotel Zone $135. **Every** `Maya Riviera` hotel uses $65 irrespective of location within that canonical zone; Puerto Juarez and Isla Blanca coverage remains supplier-unverified but booking-overridable (`TRF-011`).

### SC-107 — Miguel: no unapproved 8+ pax or hotel-to-hotel fare (CONFIRMED)

**Given** 8 travelers request an airport transfer OR a hotel-to-hotel route is entered, **when** booking is priced, **then** system requests explicit vehicle allocation or manual supplier quote rather than assuming one vehicle, blindly applying 2× tariff, or using airport route price for hotel-to-hotel (`TRF-011`, `PAY-024`).

### SC-108 — Playa Mía: all eight mapping defaults and original MXN unit prices (CONFIRMED)

**Given** one `Cozumel el Cielo` booking for 2 adults and 1 child at a hotel whose dated-stay zone is Puerto Juarez, Isla Blanca, Cancun Center or Cancun Hotel Zone, **then** select the original **Cancún** rate (1960×2+1780=**5700 MXN**). For Maya Riviera, Playa del Carmen, Tulum Center or Tulum Hotel Zone, choose **Playa del Carmen** (1660×2+1480=**4800 MXN**). Do not expose departure variant to seller or customer, or replace the MXN supplier payable with estimated USD cost (`TRF-012`, `PAY-026`).

### SC-109 — Playa Mía Cozumel departure only by audited manual override (CONFIRMED)

**Given** `Cozumel el Cielo` selected for any of the eight agency hotel zones, **when** cost selection runs, **then** it NEVER auto-selects Cozumel. **When** Admin manually chooses the Cozumel rate (1350 MXN adult, 1170 MXN child), **then** it records reason, actor, timestamp, previous automatic rate, selected source rate and effective cost; other bookings and master zone remain unchanged (`TRF-012`, `PAY-026`).

### SC-110 — Changing hotels uses the tour/transfer date, not first hotel (CONFIRMED)

**Given** a customer stays in Cancun Hotel Zone at arrival and changes to Playa del Carmen before the `Cozumel el Cielo` tour, **when** costing that tour, **then** choose Playa del Carmen MXN rate based on **tour date**, while an earlier Miguel inbound transfer uses the hotel's earlier applicable zone. A later hotel change requires deliberate booking review rather than silent rewrite of a confirmed/paid provider booking (`RES-020`, `RES-023`, `TRF-011`–`012`).

### SC-111 — Source gaps and local provider overrides preserve true bookkeeping (CONFIRMED)

**Given** a needed service-date hotel/region or supplier rate is genuinely missing, or a required cost is not supplied, **when** sold, **then** the planned payable remains Unknown with Cost Required and incomplete-profit warnings rather than USD 0. Coco Bongo child blanks are a distinct **adults-only ineligibility**, not a free child rate, and Envatours private boat units are now verified. When authorized staff amend one booking's tariff/zone/effective cost, confirmed allocations and actual cash remain intact, without modifying another booking, master catalog, or issued contract (`RES-023`–`024`, `PAY-024`, `PAY-026`–`027`, `FIN-010`–`011`).

### SC-112 — Idempotent provider import and historical rate snapshots (CONFIRMED)

**Given** an initial two-sheet provider XLSX import contains stable Tour/Rate IDs and the same workbook is reimported with an adjusted Display Name or supplier cost, **when** processed, **then** existing master records are updated without duplicate Tour IDs/Rate IDs, but previously finalized customer PDF Display Names, booking supplier rate/unit/zone/native cost snapshots and actual payment transactions remain unmodified. Flag broken rate Tour references, duplicate IDs and missing currencies rather than guessing (`CAT-014`–`015`, `PAY-026`).



## F. Formerly unresolved scenarios — current interpretation

The original `PEND-*` scenario register is **historical** and preserved under `History/Legacy_Acceptance_Pending_Suite_through_v0.1.40.md`. Do **not** use its old refund/permissions/contract-revision PENDING labels as implementation blockers. Current seller/admin receipt controls, manual refunds, selective edits, infant flows, optional yacht transport and external supplier-link privacy are **approved** and tested by `SC-131`–`SC-183`. Remaining niche/exception details are listed in current `04_Decisions_and_Open_Questions.md` §C.

## G. Developer handoff / test exit criteria

1. For each **CONFIRMED** scenario, demonstrate expected business behavior, not only a successful page render. Verify protected records are unchanged where specified.
2. Pending business-rule scenarios must remain visibly pending; do not add invented rules and mark them green.
3. Run schema migration/backfill tests with realistic linked contract versions, tours, services and provider ledger edits. No deleting historic signed PDFs, paid supplier entries or manually overridden prices.
4. Check PDF content for **private internal tour-line sale price leakage**, honest pending status, legibility and correct client identity.
5. Check that one-off expenses, unknown tours/providers and multiple hotels cannot force staff into hardcoded catalog maintenance.
6. Before live launch, require approvals for security/roles/link exposure and the parts of financial calculations that would otherwise be misleading.


## H. Supplier-data import and rate-engine acceptance scenarios (v0.1.37, source-backed)

### SC-113 — Exact standardized workbook import
Given the attached 10 provider files and one shared reference file, when a fresh tenant is seeded, then 52 stable visible Tours and 80 linked Rate IDs are available from 10×`Tours`/`Supplier Rates` worksheets plus three central reference tables, without fake duplicate provider records for the shared workbook. (`CAT-017`)

### SC-114 — Idempotent imports and source identity
Given the 52 Tours and 80 rates are already loaded, when the importer is run with the same files again, then there are still precisely 52 stable Tour IDs and 80 Rate IDs, original supplier labels and separately editable Display Names remain distinct and historical contracts/reservations are not repriced. (`CAT-015`,`CAT-021`)

### SC-115 — Baktun per-person calculation
Given `BAK-R001` USD 57 adult / 43 child and two adults plus one child, when the seller selects Chichén Itzá Clássico, then the native supplier cost is USD 157, independent of hotel zone; the negotiated customer selling price remains separate. (`CAT-009`,`PAY-027`)

### SC-116 — Envatours private boat fixed unit (resolved)
Given one `ENV-R002` private boat with any valid group of 1–10 passengers, when cost is calculated, then it is exactly USD 140 total, not USD 140 per person. Similarly `ENV-R004` is USD 270 and `ENV-R006` USD 200. Group size above 10 triggers quote/allocation handling rather than inventing a one-boat rate. (`CAT-019`,`PAY-027`)

### SC-117 — Jet Ski equipment quantity
Given three passengers book Jet ski 30min (`PJS-R002`), when cost is computed, then two equipment units are required at USD 90 each and the payable is USD 180; five passengers on 60min (`PJS-R003`) use three skis and USD 360 total. Seller does not enter number of skis; authorized override remains auditable. (`CAT-019`,`PAY-027`)

### SC-118 — Parasailing remains per person
Given `PJS-R001` USD 55 adult / 55 child supplier prices and three eligible passenger entries, then cost is USD 165, **not** an equipment-unit fee and **not** evidence that all child ages are eligible. (`CAT-019`)

### SC-119 — Coco Bongo adult-only restriction
Given a client asks for a Coco Bongo tour for a child passenger, then seller cannot make a normal child-ticket booking (all six products are adults-only); blank child costs are not interpreted as USD 0. (`CAT-020`)

### SC-120 — Coco Bongo weekday rules and unavailable day
Given Coco Bongo Regular, when the requested tour date is Thursday, choose the applicable `COC-R003` USD 75 net adult supplier rate; when Friday, choose `COC-R004` USD 93.75; on Saturday reject the unavailable date rather than using another weekday rate or inventing one. Drink Pack Mon–Wed `COC-R001` USD 64; no cost is auto-priced for an unlisted day. (`CAT-018`,`CAT-020`)

### SC-121 — Miguel one product, canonical service-date zone
Given `MIG-001` from a Maya Riviera hotel for one one-way airport transfer of 1–7 people, when Finalize Sale runs, select `MIG-R003` USD 65 per VEHICLE, not per passenger; a purchased departure leg uses a distinct reservation/payable and hotel applicable on that departure date. (`TRF-011`,`PAY-027`)

### SC-122 — Miguel nonstandard routes and extra vehicles
Given hotel-to-hotel service or more than seven passengers for `MIG-001`, normal one-vehicle automatic tariff cannot be applied as a fictional total; require manual quote or explicit allocation without losing contract/reservation creation. (`TRF-011`,`PAY-024`)

### SC-123 — Playa Mía native MXN and manual-only departure
Given a Cancún Hotel Zone client on a selected service date books `PLY-001` for two adults and one child, choose `PLY-R002` and snapshot MXN 5,700 plus standard-rate USD estimate; do not replace original MXN liability. `PLY-R003` Cozumel must NEVER auto-select from any canonical hotel zone, and only authorized manual selection with audit may apply. (`PAY-026`,`PAY-027`)

### SC-124 — Xcaret eight-zone Rate ID completeness
Given each of the 8 canonical zones, 10 current Xcaret Tour IDs and either High or Regular where applicable, normal resolver finds **exactly one of the 27 existing Xcaret Rate IDs**, using product-specific geographic region and no invented entrance/transport cost split. (`CAT-012`,`CAT-018`)

### SC-125 — Xcaret tour-date seasons and actual calendar
Given selected Xcaret Tour ID with a High/Regular price, the tour service date 2026-03-29 selects Regular; 2026-03-30 selects High; 2026-04-13 selects Regular; 2026-12-26 selects High. For nonseasonal Xcaret rows do not invent alternate rates. Future-year undefined calendars cannot reuse 2026. (`CAT-013`)

### SC-126 — Xcaret operating-day enforcement survives import
Given imported Xcaret Rate IDs exist, when seller tries a genuinely closed weekday not opened by one of the seven specific 2026 Sunday exceptions, they are blocked with operating-days explanation; where a dated exception opens Sunday, allow it. Supplier price zone does not decide actual pickup point. (`OPS-012`,`OPS-013`)

### SC-127 — Dolphin base-cost exclusion and product count
Given 17 approved Dolphin rates `DOL-R001`–`DOL-R017`, then no Columbus product exists and booking-derived payable covers the known base supplier amount only; transport/dock/taxes remain separate known/unknown operational expenses, not silently added at fictional zero or falsely labeled all-inclusive. (`CAT-020`,`FIN-011`)

### SC-128 — Missing or manual-only rate never auto-prices
Given `Rate Status=Manual Only`, an unmatched hotel/date, a missing seasonal calendar, ambiguous variant, or an expressly unavailable weekday, the system cannot treat a missing eligible rate as zero or automatically pick an inapplicable one. Admin can manually choose/override with audit and the existing `Cost Required` pattern still permits Finalize Sale where cost is genuinely unknown. Explicit CLOSED dates are still blocked under applicable product operating rules. (`CAT-018`,`RES-024`)

### SC-129 — Historical snapshots and supplier payments do not mutate
Given a finalized supplier booking with original Rate ID, native amount, 2026 season and estimated USD FX, editing a master catalog Display Name, standard rate, season or supplier cost does not rewrite its original recorded fields, issued contract PDF or actual allocated payments; local operational overrides remain separately auditable. (`RES-024`,`PAY-027`,`FIN-011`)

### SC-130 — Repeat import with local Admin master edits
Given Admin has amended a master tour display name or source-rate amount since initial import, running supplier XLSX upsert detects the difference and requires an explicit authorized reconciliation choice, never silently discarding changes or using source names as database primary keys. (`CAT-021`)


## I. Owner-approved v0.1.38 acceptance addendum — SC-131 to SC-151

### SC-131 — Hotel master exact import and repeat
Import `Hotel_Master/Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx` twice: 1,125 unique selectable hotel records across exact eight canonical zones, no duplicates, and original row names/locations preserved. Invalid/free-typed hotel remains supported without inventing a zone.

### SC-132 — Dated multiple hotels with provider mapping
Guest switches hotel on second trip day. Two different tour dates resolve to their respective actual stays and supplier-specific Xcaret/Playa Mía/Miguel zone rules; snapshots record matched hotel/date/zone/Rate ID without modifying master.

### SC-133 — Repeat contract itinerary and PDF secrecy
Generate PDF with two hotel stays, 3 tours on varied dates, inbound with agency transfer and outbound without; show chronological items, each service's adults/children/infants where supplied and real inclusions/exclusions. No internal per-tour negotiated price, supplier cost, admin notes or commission leaks.

### SC-134 — Unlimited payment installments and accounting distinction
Record three installments, including occasional BRL tender with explicitly credited USD amount; no one-time deposit cutoff. Render accurate current/issued contract summary, separating agreed payment terms, actual receipts, outstanding balance and no double counting of BRL.

### SC-135 — Seller revises finalized contract without blocking
Seller edits/finalizes new version after one booking confirmed and paid. Earlier PDF/history and same arrival survive, protected operations and actual paid amounts remain unaltered, and arrival shows `Changed / Needs Attention` without blocking seller finalization.

### SC-136 — Admin chosen divergent operations and dismissal
Admin changes confirmed/paid booking, sees related arrival/wallet/payable/supplier-impact warning, proceeds with selective/manual updates, leaves deliberate mismatch, then explicitly dismisses `Changed / Needs Attention`; no hidden automatic matching/cash deletion.

### SC-137 — Audit history visually hidden
Open default arrival: compact current data and actionable badge only. `View History` reveals actor/date/old/new/purpose including protected overrides; no default cascading version table or overwhelming details.

### SC-138 — Seller receipt permissions
Seller adds/views arbitrarily many separate customer payments; Seller cannot reverse/refund existing entry, edit supplier booking or see provider ledger/private cost; Admin can do those allowed operations.

### SC-139 — Admin reversal preserves actual receipt
Admin corrects earlier receipt via auditable reversal/replacement; original transaction and attribution remain recoverable and client net paid/outstanding update once, without silently mutating past issued/signed PDF.

### SC-140 — Manual actual customer refund
Admin logs a real outgoing refund, date/amount/currency/method/reason and contract. Balance reflects the refund but prompts human review if it appears due; no auto-cancel, no edited original receipt, no in-app bank transfer.

### SC-141 — Supplier link cross-reservation privacy
Open token for booking A; cannot enumerate/access booking B, CPF, selling prices, receipts, broad client contract or company reports. Revoked token cannot read/submit; access granted only for purpose-limited details.

### SC-142 — Configurable supplier form custom fields
Admin adds/changes per-provider `meeting instructions` field and marks it required for one product; seller contract does not suddenly include it; unrelated supplier links do not leak it; current chosen form updates without source-code change. Exact real supplier fields pending owner input.

### SC-143 — 2027 no copied Xcaret restrictions
2027-01-01 and a 2027 weekday that was explicitly closed in 2026 remain selectable until Admin sets a 2027 rule; 2026 selected dates still correctly enforce source actual closures/high-season rules. No claim of supplier opening from selection alone.

### SC-144 — 2027 current Xcaret configured supplier cost
For nonseasonal 2027 Xcaret rate, use active supplier configured price, not default Unknown/0. For dual seasonal rates with no future dates, use Admin-declared fallback Rate ID (or show focused cost-setup prompt if not configured), never invent 2027 High/Regular dates.

### SC-145 — Xcaret batch rate update scope
Admin changes a Xcaret supplier cost. Prompt preview to apply change to **all not-yet-commenced** arrivals including previously entered/finalized. On approval only eligible supplier planned/booking costs change with version/audit; customer selling totals, originals, actual paid transactions and historical completed visits remain unchanged. On decline nothing is repriced.

### SC-146 — Resolved paid cost mismatch after supplier repricing
New lower provider payable than paid allocations prompts staff review about credit/adjustments; no hidden cash-refund/reversal or automatic credit release, while Admin retains edit flexibility consistent with existing `PAY-020`/DEC-021.

### SC-147 — Yacht transport optional
Yacht A configured `ancillary transport needed` produces a missing-booking task until separate staff booking created; yacht B with no requirement makes no such task and is not penalized in operational Ready calculations.

### SC-148 — Contract template lacks forged signing evidence
Unsigned generated PDF has no old signature QR, historical e-sign hash or `valida.ae` validation URL. A later separately uploaded signed copy links only to that contract version; no built-in e-sign validity assertion.

### SC-149 — Preserve wallet behavior without layout blockage
A current wallet can be prepared/exported, pending service honestly identified, current ready-to-send independent of mark-sent status; generated PDF visual UAT is deferred, older PDF history not cluttering current wallet UI.

### SC-150 — Finance scenario: discounted attribution, refunds and native MXN
Given internal tour sale prices USD 400 and 600 and a USD 100 overall discount, net attribution is USD 360/540; contract total USD 900. Given USD 250+150 receipts and USD 50 actual refund, net received USD 350, apparent outstanding USD 550 flagged for review (not an automatic demand). Given MXN 5,700 supplier liability and STANDARD 19 MXN/USD, estimated cost = USD 300; later MXN 1,900 part paid at actual USD 110 and MXN 3,800 paid at USD 210, total actual supplier spend USD 320 with no duplicate expense or tariff rewrite. **These are deterministic arithmetic examples, not validations of deployed code.**

### SC-151 — Complete packaging integrity
All pre-existing 11 supplier XLSXs and the two 2026 JPEGs preserve exact original SHA256; hotel master byte-identical to owner upload; sanitized DOCX contains all 18 current clauses and no old e-sign URLs/hashed validation; all current member hashes match manifest and archive CRC. No sensitive completed real customer PDFs included.


## v0.1.39 — Added owner-approved acceptance scenarios

### SC-152 — Dolphin round-trip transport default on
Given a Dolphin product and a known hotel in Cancun Center with two adults, one child and one infant, **transport ON by default**, selected standard per-person USD9.01 rates yield USD **36.04** additional **round-trip planned transportation cost**. Do not add duplicate payment expense or modify base DOL Rate ID.

### SC-153 — Dolphin explicit no-transport exception
Admin turns Dolphin transportation OFF for one specific booking; only that booking's planned transportation becomes USD **0**, with visible cost impact warning and View History. Other Dolphin reservations retain ON default; supplier base cost unchanged.

### SC-154 — Dolphin infant rate modified without code
Admin sets Cancun Center infant transport rate USD **0.00** while adult/child remain USD9.01. A new booking for 2 adults, 1 child and 1 infant costs USD **27.03**. Existing prior cost snapshots remain as priced unless explicitly updated by Admin.

### SC-155 — Dolphin eight-zone mapping and southern source limitation
All eight canonical hotel zones map to one of USD **9.01**, **12.01**, **15.02** for each of adult/child/infant as in `09_v0.1.39_Owner_Approved_Decisions.md`; Playa del Carmen/Tulum map to USD15.02 by owner's instruction. UI must **not assert** confirmed Dolphin pickup coverage in these southern hotel locations.

### SC-156 — Dolphin transport date-effective hotel and pax
Customer changes hotels midway through stay; two Dolphin bookings on different service dates resolve against the correct dated stay rather than arrival hotel or overall contract PAX. Different ages and rates affect transport only when set by Admin.

### SC-157 — Dolphin cost provenance and financial integrity
XLSX seed's 150/200/250 MXN at planning rate 16.65 rounds to 9.01/12.01/15.02 USD; rate is stored for pricing without dynamically converting at each booking. Original source XLSXs, all 80 Rate IDs, paid cash ledger and USD selling price remain untouched after transportation settings changes.

### SC-158 — One auto-generated reservation ID, separate provider confirmation
New supplier reservation receives immutable internal unique number. Admin later adds supplier confirmation number without changing internal number. Distinct supplier bookings cannot share the same internal reference even if provider uses the same code.

### SC-159 — Standard supplier fields, later details
Contract prepopulates client, service-date hotel, per-service adult/child/infant, tour, date and provider. Room, pickup, meeting point and provider confirmation can remain empty initially and be filled later by Admin. Neither seller nor supplier can change Admin-only internals.

### SC-160 — Supplier vs internal observations privacy
Admin enters both supplier-visible observations and confidential internal notes; externally shared reservation displays only supplier observations. Direct link/API queries, PDF downloads or guessed identifiers cannot reveal internal notes, guest CPF, financials or other reservations.

### SC-161 — Admin-configured provider fields default private
Admin adds a custom field for one supplier, configures label/type/required/visibility via app, and edits it later without developer involvement. New field is NOT supplier-visible until Admin explicitly opts in; integral booking number and audit identity cannot be disabled.

### SC-162 — 2027 Xcaret date selectable, no 2026 calendar copy
Seller may choose any 2027 date in absence of a 2027-specific restriction. App does not reuse a 2026 Sunday closure or season window or claim provider has confirmed operating that date.

### SC-163 — Xcaret active high/regular fallback requires choice
Where High and Regular supplier rates exist and 2027 seasons not yet configured, Admin can select/modify an explicit provisional active rate/season, and booking uses currently stored configured supplier price; absent a selection, a focused setup/manual review prompts rather than silently assuming a season or fabricating supplier cost.

### SC-164 — Xcaret annual maintenance no developer required
Admin directly edits 2027 season dates/weekday closures and supplier rates in settings, even after December 15. No code update required; 2026 original source calendar/source hashes unchanged.

### SC-165 — Future Xcaret repricing, receipts and paid supplier ledger
After Admin changes supplier cost, explicit review prompt offers propagation to *all uncommenced* arrivals including already-finalized contracts. Yes updates eligible **supplier planned cost only**; No leaves all booking costs unchanged. Existing customer sales amounts, original cash payments, historic signed PDFs and cost history preserved; confirmed/paid/manual overrides flagged for review rather than silently overwritten.

### SC-166 — Manual migration of future arrivals
Admin can enter one upcoming arrival from Trello, one supplier booking status from WhatsApp and separate customer receipts from Sheets using their ORIGINAL dates, amounts, currencies and references when known. Duplicate input is detectable and unverified facts are marked unknown. No automated integrations mandatory.

### SC-167 — Existing partially built app gap assessment
Developer identifies already implemented screens, schema, auth and flows before coding; maps each current requirement to present/missing/changed and runs UAT/tests against actual code. A documentation-only ZIP is never treated as evidence the app is functioning.


## v0.1.40 — P0 Cross-app selective change, recovery, privacy and completeness

### SC-168 — Arbitrary subset propagation, six independent choices
Given a change with exactly FIVE proposed affected targets, test separate actions selecting 0, 1, 2, 3, 4, and 5. Only the selected target records change; record actor, old→new, and unresolved attention on excluded material impacts. Do not enforce matching downstream values.

### SC-169 — Sticky manual supplier cost on later source edit
Given calculated cost USD120 overridden by Admin to USD135, changing a hotel/zone recalculates suggested USD145. Show old USD135 → suggested USD145 but default to preserving USD135. Admin can choose to update ONLY cost; a later unrelated change again protects the currently manual value unless Admin explicitly restores auto mode.

### SC-170 — Mixed paid/confirmed record warning, no blocked operational save
Given confirmed provider reservation and provider payable partly paid, Admin changes service date and chooses NOT to change reservation confirmation, payable, wallet or real supplier cash. Save the edited field, warn about selected mismatches and create targeted review task without fabricating supplier approval or rewriting payments.

### SC-171 — New version produces attention, not forced downstream cascade
Seller finalizes revised sale V2 independently with prior V1 signed file; Admin sees Changed / Needs Attention and impact preview. Zero destinations can be selected. Prior PDF, signed file and ledger remain unchanged. Admin may explicitly dismiss after review; later changes reflag as appropriate.

### SC-172 — Failed automated arrival/reservation creation is manually recoverable
After a finalized sale, deliberately fail automatic arrival and supplier reservation creation. Preserve sale/PDF, allow Admin to add missing arrival, booking and correct payable manually, proceed to wallet/payment/reports. Retry automation safely without duplicates.

### SC-173 — Transaction correction is append-only
Seller may add multiple client receipts; Seller cannot correct/reverse/refund prior receipts. Admin logs a separate dated refund or correction/reversal, with original cash receipt preserved. Supplier cost adjustment is independent of what actually left the bank; no negative 'paid' fake transaction.

### SC-174 — Concurrent edit conflict and partial impact failure
Two Admin sessions preview edits of the same booking; after first commits, second must see conflict or re-preview before any overwritten target. If one chosen downstream update fails, show exactly the applied/failed items or roll back as specified; do not claim complete success; retry is idempotent.

### SC-175 — No-code custom form field visibility and integrity
Admin adds new customer/supplier/custom operational field and changes label/required/visibility through settings without code; new supplier field is private by default, only explicit supplier-visible fields appear in supplier link. Cannot disable stable reservation ID, authentication or receipt transaction identity.

### SC-176 — Missing tour description fallback
A booked service lacks verified inclusions/exclusions. Contract generator warns seller/Admin, permits accurate manual authorized content entry and later catalog update, or follows an explicit approved omit policy; never fabricates package promises or writes false 'includes'.

### SC-177 — Infant chain end-to-end
Seller enters distinct adults, children and infants for two tours; contract, bookings, provider requests, wallet and Dolphin transportation each use the right per-service counts. Infant base-tour cost missing => needs pricing/manual Admin input rather than automatically free, while infant transport per zone uses approved independent age tariff.

### SC-178 — Future-Xcaret provisional rate remains configurable
With no confirmed 2027 seasons, all 2027 dates selectable. Admin sets/modifies provisional current High/Regular rate in app; booking snapshots configured actual active rate, clearly unverified provider availability. Rate update prompt shows individually selectable eligible future uncommenced costs and preserves customer selling totals and actual old payments.

### SC-179 — Real wallet readiness + manual completion
Missing required booking => not auto Ready; required bookings confirmed plus current wallet prepared => Ready (Sent tracked separately). Admin can add accurate pickup/time/code if known, leave inapplicable blank, and override display without clearing pending tasks. PDF visual polish not a gating requirement.

### SC-180 — Supplier URL scope and revoked-token security
Supplier A with booking link cannot read booking B, Internal Notes, guest CPF, price/receipt ledger or custom field not explicitly supplier-visible; revoked token cannot read or mutate; link grants nothing beyond intended booking. Test both UI and direct API requests.

### SC-181 — Actual cost, liabilities and cash history divergence
Edit one MXN supplier liability after two actual USD payments at different FX outlays. Show source/native outstanding, original estimated USD and actual USD cash accurately without inventing a third cash movement. Admin may leave payable/cost out-of-sync with reservation and see nonblocking attention.

### SC-182 — Manual migration / duplicate prevention
Manually enter an upcoming contract/arrival and original dated receipts from Trello/Sheets/WhatsApp; later retry or import detection does not duplicate historical payments or reservations. Missing references/prices stay marked unknown, not invented.

### SC-183 — Developer first return and actual code evidence
Developer inventories existing app features, DB and permissions, maps each main workstream implemented/partial/missing, provides evidence and first runnable vertical-slice demo plan. Static ZIP integrity does not count as app acceptance.

## J. v0.1.42 targeted regression specifications — SC-184 to SC-215

These are **mandatory human-readable expected behaviors**, **not executable tests that have already passed**. The developer must implement corresponding automated/UAT checks against the actual existing app. Each case traces a specific finding.

### SC-184 — QC1-001 regression (P0)

**Scenario:** Issue V2 after a confirmed tour, select zero impacts, verify no booking/payable value changed and Changed flag remains.

**Expected invariant:** Seller revisions never auto-propagate to editable downstream records; Admin selects none/any/all after an impact preview; first-sale initialization is distinct and idempotent.

### SC-185 — QC1-002 regression (P1)

**Scenario:** New developer loads START HERE and identifies actual packaged rate/hotel files without being told files are missing.

**Expected invariant:** Current 10 provider XLSXs, shared XLSX and 1,125-hotel master are packaged seed evidence; importing them into developer app remains separately unverified.

### SC-186 — QC1-003 regression (P1)

**Scenario:** Seller API requests to change provider cost or refund receipt are denied; Admin can; importer is not required for first manual migration.

**Expected invariant:** Seller may finalize/revise contracts and add/view client receipts, but only Admin may correct/refund receipts and manage supplier reservations, costs, credit, reports and supplier links. Supplier links require recipient isolation and revocation. Manual migration accepted.

### SC-187 — QC1-004 regression (P1)

**Scenario:** Two yacht bookings: one flagged transport required gets task/payable only after actual ancillary entry; other gets neither.

**Expected invariant:** Separate yacht transport is booking-specific, required only when Admin marks it necessary, never universally on every yacht sale.

### SC-188 — QC1-005 regression (P1)

**Scenario:** Confirmed required bookings and prepared wallet give Ready despite unpaid balance; unconfirmed ancillary blocks calculated Ready while Admin may override display.

**Expected invariant:** Calculated Ready requires all effectively required bookings Confirmed and a current wallet prepared/ready to send; delivery, payment and optional staff review are separate; Admin badge override never hides tasks.

### SC-189 — QC1-006 regression (P1)

**Scenario:** Repeat seed import twice, assert 52 stable seller IDs and 80 stable base rate IDs with no duplicates; original XLSXs preserved.

**Expected invariant:** Source workbooks physically included and structurally QCed are not proof of a completed app import; developer must verify app-side idempotent import/mapping and historical-snapshot tests.

### SC-190 — QC1-007 regression (P1)

**Scenario:** Playa Mía import uses packaged approved XLSX despite v0.1.36 historical text; no fabricated or old draft rows.

**Expected invariant:** Supplier pricing appendix historical pre-approval commands no longer apply; only packaged originals and current approved mapping decide seed values.

### SC-191 — QC1-008 regression (P1)

**Scenario:** Agent following README and START HERE arrives at identical hierarchy when checking conflicting historical note.

**Expected invariant:** Use START HERE → active authority index → `11` override rules → requirements/architecture/scenarios → current decision boundary → immutable supplier numeric sources; historical pages have no current authority.

### SC-192 — QC1-009 regression (P2)

**Scenario:** Read current status and main docs; no live document claims v0.1.38/v0.1.40 as current checkpoint.

**Expected invariant:** Active version/status metadata identifies current v0.1.43, while creation-version filenames and historical release evidence remain unchanged and unambiguous.

### SC-193 — QC2-001 regression (P1)

**Scenario:** Select Jan 2027 Xcaret: no copied 2026 closures, Admin chooses High/Regular existing rate, sell price unchanged.

**Expected invariant:** The immutable Shared Reference REF-015/E40 Cost Required future-year rule is superseded for 2027+: use current configured Xcaret cost with Admin-selected provisional rate and unrestricted unconfirmed seller calendar.

### SC-194 — QC2-002 regression (P1)

**Scenario:** Seller cannot edit a supplier-rate override even if old workbook says authorized staff.

**Expected invariant:** The immutable Shared Reference REF-025/E50 `authorized admin/staff` is permission narrowed to Admin for supplier cost/rate/booking overrides; Seller denied.

### SC-195 — QC2-003 regression (P1)

**Scenario:** 2 adults 1 child 1 infant on Dolphin: transport 4×$9.01=$36.04; admission with no infant tariff Unknown not zero.

**Expected invariant:** Snapshot adults/children/infants separately; infant tour-admission cost remains Unknown/Cost Required absent verified policy; independently calculate separately known Dolphin infant transport.

### SC-196 — QC3-001 regression (P1)

**Scenario:** Seller finalizes with no CPF, no supplier tariff and valid party/date/tour/USD total; missing cost appears as task, generated PDF has no invented copy.

**Expected invariant:** Finalization preflight checks identifiable customer, travel date, at least one dated purchased service, and explicit USD agreed total; optional CPF/flight/pickup/supplier cost/unknown copy warn but do not block valid sales.

### SC-197 — QC3-002 regression (P1)

**Scenario:** V2 swaps A for B, Admin selects no booking changes: A remains confirmed, B visibly unfulfilled, Changed flag present until explicit review.

**Expected invariant:** Latest contracted service demand and Admin-chosen effective operational required booking set are distinguishable; unpropagated new sold services remain visible as outstanding mismatch, never deemed booked by old confirmed reservations.

### SC-198 — QC3-003 regression (P1)

**Scenario:** Supplier adds pickup time but does not press Confirm: booking remains Awaiting; explicit Confirm advances it once.

**Expected invariant:** Supplier details-only save must not confirm a booking; explicit Confirm action confirms only that scoped booking, independent of optional pickup/confirmation code.

### SC-199 — QC3-004 regression (P1)

**Scenario:** Admin changes pickup after wallet marked Sent with wallet unchecked: update-needed indicator appears, old sent PDF unchanged.

**Expected invariant:** Wallet update/review is triggered by material guest-facing upstream divergence after previous wallet preparation/send, even if the saved wallet was not selected for propagation; sent PDFs remain unchanged.

### SC-200 — QC3-005 regression (P1)

**Scenario:** Wallet PDF for 2 adults 1 child 1 infant visibly includes all categories; no invented infant ticket price.

**Expected invariant:** Wallet shows relevant per-service adult, child, infant counts separately, including infants even when infant supplier admission price is Unknown.

### SC-201 — QC4-001 regression (P1)

**Scenario:** 3 × $100 selling lines, $100 fixed discount; discounts $33.34,$33.33,$33.33 in stable ID order; net sum exactly $200.

**Expected invariant:** Money calculations use fixed-decimal/minor-unit rounding; percentage/fixed discount residual cents assigned by stable deterministic tie-break so sum line discounts equals contract total exactly.

### SC-202 — QC4-002 regression (P1)

**Scenario:** MXN2000 liability, allocate MXN800 paid at USD48.05 and MXN600 paid at USD37.00: remaining MXN600; actual outlay USD85.05.

**Expected invariant:** MXN payables maintain native-MXN amount allocated per supplier payment and explicit actual USD cash outlay; never subtract USD nominal amount from MXN payable. Mixed-payment allocations require explicit native values.

### SC-203 — QC4-003 regression (P1)

**Scenario:** After first MXN800 allocation on MXN2000, show actual USD48.05 plus separate MXN1200 forecast, not original forecast plus cash twice.

**Expected invariant:** Partially settled provider reports show original native obligation, native paid/remaining, actual paid USD and separate forecast USD of remainder or Unknown; do not call incomplete amount fully realized or double-count paid portions.

### SC-204 — QC4-004 regression (P1)

**Scenario:** USD100 paid, charge reduced to USD30: due 0, excess USD70 stays allocated under review until Admin releases.

**Expected invariant:** Remaining due=max(0,effective payable−allocations); excess allocated=max(0,allocations−effective payable) and flagged pending explicit release; do not show negative due or automatically release.

### SC-205 — QC4-005 regression (P1)

**Scenario:** Supplier holds $100 credit, returns $30 actual cash: link receipt to credit, available balance $70 once; no customer revenue.

**Expected invariant:** Real supplier cash refund references original same-provider credit/advance or paid allocation, is not tour revenue, and cannot reduce credit twice; releasing allocated funds to credit is a separate noncash Admin action.

### SC-206 — QC4-006 regression (P1)

**Scenario:** Actual BRL500 returned, Admin credits USD90 equivalent: USD customer net falls $90, one BRL cash-out; duplicate receipt reversal creates no cash-out.

**Expected invariant:** Non-USD customer refund stores tender currency/amount and Admin-confirmed USD debit; physical refund money-out distinct from bookkeeping-only void/reversal of erroneous receipt.

### SC-207 — QC5-001 regression (P1)

**Scenario:** Test Seller cannot POST provider payments/bookings, even if UI hides buttons; Admin can.

**Expected invariant:** Supplier operational mutation actors in live requirements are Admin-only, not ambiguous generic staff; seller access to contracts/receipts does not grant supplier edits.

### SC-208 — QC5-002 regression (P0)

**Scenario:** Old Provider A token fails for reassigned booking to B on page, API and attachment; B obtains new scoped token.

**Expected invariant:** Supplier access is bound to reservation AND current intended provider/recipient and visibility scope; provider reassignment/replacement automatically revokes old URL read/write/file access.

### SC-209 — QC5-003 regression (P0)

**Scenario:** Private legacy note populated before field visibility change never appears on old supplier link without explicit Admin approval.

**Expected invariant:** Newly supplier-visible custom fields are future-only by default; previously private values require explicit per-record disclosure approval; supplier API/PDF/attachments use server-side field allowlists.

### SC-210 — QC5-004 regression (P1)

**Scenario:** Supplier opens v1, Admin edits v2 pickup, supplier submits v1: conflict/review, Admin pickup survives, no false confirmation.

**Expected invariant:** Supplier submissions require scoped identity and current record version; stale details cannot overwrite newer Admin changes; confirmation intent is separate; duplicate retries idempotent.

### SC-211 — QC5-005 regression (P1)

**Scenario:** Six targets with transport excluded but payable selected: payable preview uses true kept transport or requires explicit override; verify all 64 masks.

**Expected invariant:** Selective impact preview recomputes each dependent proposed value based on Admin-selected subset, identifies dependencies, and permits arbitrary subset without implicit extra selections; read-only reports derive from effective persisted records.

### SC-212 — QC5-006 regression (P1)

**Scenario:** Create→populate→rename→hide→archive→restore field, previous wallet/booking history retains old meaning without leaking private data.

**Expected invariant:** Custom fields use permanent non-reused IDs, non-destructive archive/disable, type-change validation, and historic label/value/visibility snapshots for each generated/sent artifact.

### SC-213 — QC5-007 regression (P1)

**Scenario:** Disable PDF renderer; saved contract survives, manual valid document/attachment path allows operation and retry idempotently.

**Expected invariant:** On PDF renderer failure retain versioned sale intent and saved fields, offer retry and manual DOCX/output attachment issuance; never mark signed/issued without actual valid file; no duplicate arrival/bookings/payables on retry.

### SC-214 — QC6-001 regression (P1)

**Scenario:** Provider A $100 payable with $60 A payment; reassign booking to B: B paid=0, A actual payment remains with A, attention shown.

**Expected invariant:** Actual supplier payments retain original payee/provider identity permanently; booking reassignment does not migrate allocations or credit to new provider; Admin reviews separately and explicitly reallocates only within valid payee.

### SC-215 — QC6-002 regression (P1)

**Scenario:** Import arrival and $100 receipt, then finalize its contract and choose Link Existing: exactly one arrival, one receipt and no duplicate bookings after retry.

**Expected invariant:** Admin can explicitly link an imported upcoming arrival to a later-created/finalized contract; no auto-merge by guest name; reused stable arrival and genuine transaction IDs avoid duplicate bookings/receipts.
